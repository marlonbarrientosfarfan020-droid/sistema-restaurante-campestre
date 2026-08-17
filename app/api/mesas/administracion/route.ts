import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verificarTokenSesion,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * =========================================================
 * GET
 * Lista mesas y zonas de la sucursal del usuario
 * =========================================================
 */
export async function GET(
  request: NextRequest
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
        "No tienes permisos para administrar mesas.",
        403
      );
    }

    const mesas =
      await prisma.mesa.findMany({
        where: {
          zona: {
            sucursalId:
              sesion.sucursalId,
          },
        },

        orderBy: [
          {
            zona: {
              nombre: "asc",
            },
          },
          {
            numero: "asc",
          },
        ],

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
              sucursalId: true,
            },
          },
        },
      });

 let zonas =
      await prisma.zona.findMany({
        where: {
          sucursalId:
            sesion.sucursalId,
        },

        orderBy: {
          nombre: "asc",
        },

        select: {
          id: true,
          nombre: true,
        },
      });

    // AUTO-CREACIÓN: Si la sucursal no tiene zonas aún, crea la primera por defecto
    if (zonas.length === 0) {
      const zonaPrincipal = await prisma.zona.create({
        data: {
          sucursalId: sesion.sucursalId,
          nombre: "Salón Principal",
        },
        select: {
          id: true,
          nombre: true,
        },
      });
      zonas = [zonaPrincipal];
    }

    return NextResponse.json({
      success: true,
      message:
        "Mesas obtenidas correctamente.",

      data: {
        mesas,
        zonas,
      },
    });
  } catch (error) {
    console.error(
      "Error administrando mesas:",
      error
    );

    return errorJson(
      "No se pudieron cargar las mesas.",
      500
    );
  }
}

/**
 * =========================================================
 * POST
 * Crear nueva mesa
 * =========================================================
 */
export async function POST(
  request: NextRequest
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
        "No tienes permisos para crear mesas.",
        403
      );
    }

    const body =
      await request.json();

    const zonaId =
      typeof body.zonaId === "string"
        ? body.zonaId.trim()
        : "";

    const numero =
      Number(body.numero);

    const capacidad =
      Number(body.capacidad);

    const nombre =
      typeof body.nombre === "string"
        ? body.nombre.trim()
        : "";

    if (!zonaId) {
      return errorJson(
        "Selecciona una zona."
      );
    }

    if (
      !Number.isInteger(numero) ||
      numero <= 0
    ) {
      return errorJson(
        "El número de mesa debe ser mayor a 0."
      );
    }

    if (
      !Number.isInteger(capacidad) ||
      capacidad <= 0
    ) {
      return errorJson(
        "La capacidad debe ser mayor a 0."
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

    const existe =
      await prisma.mesa.findFirst({
        where: {
          zonaId,
          numero,
        },

        select: {
          id: true,
        },
      });

    if (existe) {
      return errorJson(
        `Ya existe la mesa ${numero} en esa zona.`,
        409
      );
    }

    const mesa =
      await prisma.mesa.create({
        data: {
          zonaId,

          numero,

          nombre:
            nombre ||
            `Mesa ${String(
              numero
            ).padStart(2, "0")}`,

          capacidad,

          qrCode:
            `mesa-${crypto.randomUUID()}`,

          estado: "LIBRE",

          activa: true,
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

    return NextResponse.json(
      {
        success: true,
        message:
          "Mesa creada correctamente.",
        data: mesa,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando mesa:",
      error
    );

    return errorJson(
      "No se pudo crear la mesa.",
      500
    );
  }
}