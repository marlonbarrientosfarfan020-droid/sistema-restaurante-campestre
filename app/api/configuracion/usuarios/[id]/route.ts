import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  RolUsuario,
} from "@/app/generated/prisma/client";

import {
  hashPassword,
} from "@/lib/password";

import {
  prisma,
} from "@/lib/prisma";

import {
  SESSION_COOKIE,
  verificarTokenSesion,
} from "@/lib/session";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ROLES_VALIDOS = [
  RolUsuario.SUPERADMIN,
  RolUsuario.ADMINISTRADOR,
  RolUsuario.GERENTE,
  RolUsuario.MOZO,
  RolUsuario.COCINA,
  RolUsuario.BARRA,
  RolUsuario.CAJERO,
];

function respuestaError(
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

function esAdministrador(
  rol: string
) {
  return (
    rol === "SUPERADMIN" ||
    rol === "ADMINISTRADOR"
  );
}

function correoValido(
  correo: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    correo
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

  return verificarTokenSesion(
    token
  );
}

async function obtenerUsuarioObjetivo(
  id: string
) {
  return prisma.usuario.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      sucursalId: true,
      nombres: true,
      apellidos: true,
      correo: true,
      rol: true,
      activo: true,
    },
  });
}

function puedeAdministrarUsuario(
  sesion: {
    rol: string;
    sucursalId: string;
  },
  usuario: {
    rol: string;
    sucursalId: string;
  }
) {
  if (
    sesion.rol === "SUPERADMIN"
  ) {
    return true;
  }

  if (
    sesion.rol !==
    "ADMINISTRADOR"
  ) {
    return false;
  }

  if (
    usuario.sucursalId !==
    sesion.sucursalId
  ) {
    return false;
  }

  if (
    usuario.rol ===
    "SUPERADMIN"
  ) {
    return false;
  }

  return true;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const sesion =
      await obtenerSesion(
        request
      );

    if (!sesion) {
      return respuestaError(
        "Debes iniciar sesión.",
        401
      );
    }

    if (
      !esAdministrador(
        sesion.rol
      )
    ) {
      return respuestaError(
        "No tienes permisos para administrar usuarios.",
        403
      );
    }

    const {
      id,
    } = await context.params;

    const usuarioId =
      id?.trim();

    if (!usuarioId) {
      return respuestaError(
        "El usuario es obligatorio."
      );
    }

    const usuarioActual =
      await obtenerUsuarioObjetivo(
        usuarioId
      );

    if (!usuarioActual) {
      return respuestaError(
        "El usuario no fue encontrado.",
        404
      );
    }

    if (
      !puedeAdministrarUsuario(
        sesion,
        usuarioActual
      )
    ) {
      return respuestaError(
        "No tienes permisos para modificar este usuario.",
        403
      );
    }

    const body =
      await request.json();

    const accion =
      typeof body.accion ===
      "string"
        ? body.accion.trim()
        : "EDITAR";

    /*
     * ========================================================
     * ACTIVAR / DESACTIVAR
     * ========================================================
     */
    if (
      accion ===
      "CAMBIAR_ESTADO"
    ) {
      if (
        usuarioActual.id ===
          sesion.sub &&
        usuarioActual.activo
      ) {
        return respuestaError(
          "No puedes desactivar tu propio usuario.",
          409
        );
      }

      const actualizado =
        await prisma.usuario.update({
          where: {
            id: usuarioActual.id,
          },

          data: {
            activo:
              !usuarioActual.activo,
          },

          select: {
            id: true,
            nombres: true,
            apellidos: true,
            correo: true,
            rol: true,
            activo: true,
            sucursalId: true,
            updatedAt: true,

            sucursal: {
              select: {
                id: true,
                nombre: true,
                codigo: true,

                empresa: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
        });

      return NextResponse.json({
        success: true,

        message:
          actualizado.activo
            ? "Usuario activado correctamente."
            : "Usuario desactivado correctamente.",

        data: actualizado,
      });
    }

    /*
     * ========================================================
     * RESTABLECER CONTRASEÑA
     * ========================================================
     */
    if (
      accion ===
      "RESTABLECER_PASSWORD"
    ) {
      const password =
        typeof body.password ===
        "string"
          ? body.password
          : "";

      if (
        password.length < 8
      ) {
        return respuestaError(
          "La nueva contraseña debe tener al menos 8 caracteres."
        );
      }

      await prisma.usuario.update({
        where: {
          id: usuarioActual.id,
        },

        data: {
          password:
            hashPassword(
              password
            ),
        },
      });

      return NextResponse.json({
        success: true,
        message:
          "Contraseña restablecida correctamente.",
        data: {
          id:
            usuarioActual.id,
        },
      });
    }

    /*
     * ========================================================
     * EDITAR DATOS / ROL
     * ========================================================
     */
    if (
      accion !== "EDITAR"
    ) {
      return respuestaError(
        "La acción solicitada no es válida."
      );
    }

    const nombres =
      typeof body.nombres ===
      "string"
        ? body.nombres.trim()
        : "";

    const apellidos =
      typeof body.apellidos ===
      "string"
        ? body.apellidos.trim()
        : "";

    const correo =
      typeof body.correo ===
      "string"
        ? body.correo
            .trim()
            .toLowerCase()
        : "";

    const rol =
      typeof body.rol ===
      "string"
        ? body.rol.trim()
        : "";

    if (
      nombres.length < 2
    ) {
      return respuestaError(
        "Ingresa nombres válidos."
      );
    }

    if (
      apellidos.length < 2
    ) {
      return respuestaError(
        "Ingresa apellidos válidos."
      );
    }

    if (
      !correoValido(
        correo
      )
    ) {
      return respuestaError(
        "Ingresa un correo electrónico válido."
      );
    }

    if (
      !ROLES_VALIDOS.includes(
        rol as RolUsuario
      )
    ) {
      return respuestaError(
        "El rol seleccionado no es válido."
      );
    }

    /*
     * Un ADMINISTRADOR normal no puede
     * crear/promover SUPERADMIN.
     */
    if (
      rol ===
        RolUsuario.SUPERADMIN &&
      sesion.rol !==
        "SUPERADMIN"
    ) {
      return respuestaError(
        "Solo un SUPERADMIN puede asignar el rol SUPERADMIN.",
        403
      );
    }

    /*
     * Evitamos que el usuario se quite
     * a sí mismo el rol administrativo.
     */
    if (
      usuarioActual.id ===
        sesion.sub &&
      rol !==
        usuarioActual.rol
    ) {
      return respuestaError(
        "No puedes cambiar tu propio rol desde esta pantalla.",
        409
      );
    }

    const correoExistente =
      await prisma.usuario.findFirst({
        where: {
          correo: {
            equals:
              correo,
            mode:
              "insensitive",
          },

          NOT: {
            id:
              usuarioActual.id,
          },
        },

        select: {
          id: true,
        },
      });

    if (correoExistente) {
      return respuestaError(
        "Ya existe otro usuario con ese correo.",
        409
      );
    }

    const actualizado =
      await prisma.usuario.update({
        where: {
          id:
            usuarioActual.id,
        },

        data: {
          nombres,
          apellidos,
          correo,
          rol:
            rol as RolUsuario,
        },

        select: {
          id: true,
          nombres: true,
          apellidos: true,
          correo: true,
          rol: true,
          activo: true,
          sucursalId: true,
          createdAt: true,
          updatedAt: true,

          sucursal: {
            select: {
              id: true,
              nombre: true,
              codigo: true,

              empresa: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Usuario actualizado correctamente.",
      data: actualizado,
    });
  } catch (error) {
    console.error(
      "Error actualizando usuario:",
      error
    );

    return respuestaError(
      "No se pudo actualizar el usuario.",
      500
    );
  }
}