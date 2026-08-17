import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  SESSION_COOKIE,
  verificarTokenSesion,
} from "@/lib/session";

export const runtime = "nodejs";

function errorJson(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    }
  );
}

async function obtenerSesion(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      SESSION_COOKIE
    )?.value;

  if (!token) {
    return null;
  }

  return verificarTokenSesion(token);
}

function puedeAdministrar(
  rol: string
) {
  return (
    rol === "SUPERADMIN" ||
    rol === "ADMINISTRADOR"
  );
}

type Contexto = {
  params: Promise<{
    mesaId: string;
  }>;
}

/**
 * =========================================================
 * PATCH
 * Editar mesa
 * =========================================================
 */
export async function PATCH(
  request: NextRequest,
  context: Contexto
) {
  try {
    const sesion =
      await obtenerSesion(request);

    if (!sesion) {
      return errorJson(
        "Debes iniciar sesión.",
        401
      );
    }

    if (
      !puedeAdministrar(
        sesion.rol
      )
    ) {
      return errorJson(
        "No tienes permisos para editar mesas.",
        403
      );
    }

    const {
      mesaId,
    } = await context.params;

    const body =
      await request.json();

    const mesa =
      await prisma.mesa.findFirst({
        where: {
          id: mesaId,

          zona: {
            sucursalId:
              sesion.sucursalId,
          },
        },

        select: {
          id: true,
          zonaId: true,
          numero: true,
          nombre: true,
          capacidad: true,
          activa: true,
          estado: true,
        },
      });

    if (!mesa) {
      return errorJson(
        "Mesa no encontrada.",
        404
      );
    }

    const zonaId =
      typeof body.zonaId === "string"
        ? body.zonaId.trim()
        : mesa.zonaId;

    const numero =
      Number(body.numero);

    const capacidad =
      Number(body.capacidad);

    const nombre =
      typeof body.nombre === "string"
        ? body.nombre.trim()
        : mesa.nombre;

    if (
      !Number.isInteger(numero) ||
      numero <= 0
    ) {
      return errorJson(
        "El número de mesa no es válido."
      );
    }

    if (
      !Number.isInteger(capacidad) ||
      capacidad <= 0
    ) {
      return errorJson(
        "La capacidad no es válida."
      );
    }

    const zona =
      await prisma.zona.findFirst({
        where: {
          id: zonaId,
          sucursalId:
            sesion.sucursalId,
        },

        select: {
          id: true,
        },
      });

    if (!zona) {
      return errorJson(
        "La zona no pertenece a tu sucursal.",
        403
      );
    }

    const duplicada =
      await prisma.mesa.findFirst({
        where: {
          zonaId,
          numero,

          id: {
            not: mesaId,
          },
        },

        select: {
          id: true,
        },
      });

    if (duplicada) {
      return errorJson(
        `Ya existe la mesa ${numero} en esa zona.`,
        409
      );
    }

    const actualizada =
      await prisma.mesa.update({
        where: {
          id: mesaId,
        },

        data: {
          zonaId,
          numero,

          nombre:
            nombre ||
            `Mesa ${String(
              numero
            ).padStart(2, "0")}`,

          capacidad,
        },

        select: {
          id: true,
          numero: true,
          nombre: true,
          capacidad: true,
          qrCode: true,
          estado: true,
          activa: true,

          zona: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Mesa actualizada correctamente.",
      data: actualizada,
    });
  } catch (error) {
    console.error(
      "Error actualizando mesa:",
      error
    );

    return errorJson(
      "No se pudo actualizar la mesa.",
      500
    );
  }
}

/**
 * =========================================================
 * DELETE
 * Activar / desactivar
 * =========================================================
 */
export async function DELETE(
  request: NextRequest,
  context: Contexto
) {
  try {
    const sesion =
      await obtenerSesion(request);

    if (!sesion) {
      return errorJson(
        "Debes iniciar sesión.",
        401
      );
    }

    if (
      !puedeAdministrar(
        sesion.rol
      )
    ) {
      return errorJson(
        "No tienes permisos para cambiar mesas.",
        403
      );
    }

    const {
      mesaId,
    } = await context.params;

    const mesa =
      await prisma.mesa.findFirst({
        where: {
          id: mesaId,

          zona: {
            sucursalId:
              sesion.sucursalId,
          },
        },

        select: {
          id: true,
          nombre: true,
          activa: true,
          estado: true,
        },
      });

    if (!mesa) {
      return errorJson(
        "Mesa no encontrada.",
        404
      );
    }

    if (
      mesa.activa &&
      mesa.estado !== "LIBRE"
    ) {
      return errorJson(
        "Solo puedes desactivar una mesa cuando está libre.",
        409
      );
    }

    const actualizada =
      await prisma.mesa.update({
        where: {
          id: mesaId,
        },

        data: {
          activa:
            !mesa.activa,
        },

        select: {
          id: true,
          nombre: true,
          activa: true,
        },
      });

    return NextResponse.json({
      success: true,

      message:
        actualizada.activa
          ? "Mesa activada correctamente."
          : "Mesa desactivada correctamente.",

      data: actualizada,
    });
  } catch (error) {
    console.error(
      "Error cambiando estado:",
      error
    );

    return errorJson(
      "No se pudo cambiar el estado de la mesa.",
      500
    );
  }
}