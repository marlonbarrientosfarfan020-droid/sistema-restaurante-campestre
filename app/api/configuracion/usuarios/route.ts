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

/*
 * ============================================================
 * RESPUESTAS
 * ============================================================
 */

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

/*
 * ============================================================
 * OBTENER SESIÓN
 * ============================================================
 */

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

/*
 * ============================================================
 * VALIDAR ADMINISTRADOR
 * ============================================================
 */

function esAdministrador(
  rol: string
) {
  return (
    rol === "SUPERADMIN" ||
    rol === "ADMINISTRADOR"
  );
}

/*
 * ============================================================
 * VALIDAR CORREO
 * ============================================================
 */

function correoValido(
  correo: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    correo
  );
}

/*
 * ============================================================
 * ROLES DISPONIBLES
 * ============================================================
 */

const ROLES_VALIDOS = [
  RolUsuario.SUPERADMIN,
  RolUsuario.ADMINISTRADOR,
  RolUsuario.GERENTE,
  RolUsuario.MOZO,
  RolUsuario.COCINA,
  RolUsuario.BARRA,
  RolUsuario.CAJERO,
];

/*
 * ============================================================
 * GET
 *
 * LISTAR USUARIOS
 * ============================================================
 */

export async function GET(
  request: NextRequest
) {
  try {
    const sesion =
      await obtenerSesion(
        request
      );

    /*
     * No autenticado
     */
    if (!sesion) {
      return respuestaError(
        "Debes iniciar sesión.",
        401
      );
    }

    /*
     * No administrador
     */
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

    /*
     * ========================================================
     * SUPERADMIN
     *
     * Puede consultar todos los usuarios.
     *
     * ADMINISTRADOR
     *
     * Solamente usuarios de su sucursal.
     * ========================================================
     */

    const usuarios =
      await prisma.usuario.findMany({
        where:
          sesion.rol ===
          "SUPERADMIN"
            ? undefined
            : {
                sucursalId:
                  sesion.sucursalId,
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
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            activo: "desc",
          },

          {
            nombres: "asc",
          },

          {
            apellidos: "asc",
          },
        ],
      });

    return NextResponse.json({
      success: true,

      message:
        "Usuarios obtenidos correctamente.",

      data: usuarios.map(
        (usuario) => ({
          id:
            usuario.id,

          nombres:
            usuario.nombres,

          apellidos:
            usuario.apellidos,

          nombreCompleto:
            `${usuario.nombres} ${usuario.apellidos}`,

          correo:
            usuario.correo,

          rol:
            usuario.rol,

          activo:
            usuario.activo,

          sucursalId:
            usuario.sucursalId,

          sucursal: {
            id:
              usuario.sucursal.id,

            nombre:
              usuario.sucursal
                .nombre,

            codigo:
              usuario.sucursal
                .codigo,

            empresa:
              usuario.sucursal
                .empresa.nombre,
          },

          createdAt:
            usuario.createdAt.toISOString(),

          updatedAt:
            usuario.updatedAt.toISOString(),
        })
      ),
    });
  } catch (error) {
    console.error(
      "Error listando usuarios:",
      error
    );

    return respuestaError(
      "No se pudieron obtener los usuarios.",
      500
    );
  }
}

/*
 * ============================================================
 * POST
 *
 * CREAR USUARIO
 * ============================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    const sesion =
      await obtenerSesion(
        request
      );

    /*
     * ========================================================
     * SESIÓN
     * ========================================================
     */

    if (!sesion) {
      return respuestaError(
        "Debes iniciar sesión.",
        401
      );
    }

    /*
     * ========================================================
     * PERMISOS
     * ========================================================
     */

    if (
      !esAdministrador(
        sesion.rol
      )
    ) {
      return respuestaError(
        "No tienes permisos para crear usuarios.",
        403
      );
    }

    const body =
      await request.json();

    /*
     * ========================================================
     * DATOS
     * ========================================================
     */

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

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    const rol =
      typeof body.rol ===
      "string"
        ? body.rol.trim()
        : "";

    const sucursalSolicitada =
      typeof body.sucursalId ===
      "string"
        ? body.sucursalId.trim()
        : "";

    /*
     * ========================================================
     * VALIDACIONES
     * ========================================================
     */

    if (!nombres) {
      return respuestaError(
        "Los nombres son obligatorios."
      );
    }

    if (
      nombres.length < 2
    ) {
      return respuestaError(
        "Ingresa nombres válidos."
      );
    }

    if (!apellidos) {
      return respuestaError(
        "Los apellidos son obligatorios."
      );
    }

    if (
      apellidos.length < 2
    ) {
      return respuestaError(
        "Ingresa apellidos válidos."
      );
    }

    if (!correo) {
      return respuestaError(
        "El correo es obligatorio."
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

    if (!password) {
      return respuestaError(
        "La contraseña inicial es obligatoria."
      );
    }

    if (
      password.length < 8
    ) {
      return respuestaError(
        "La contraseña debe tener al menos 8 caracteres."
      );
    }

    if (!rol) {
      return respuestaError(
        "El rol es obligatorio."
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
     * ========================================================
     * PROTEGER SUPERADMIN
     * ========================================================
     *
     * Un ADMINISTRADOR normal NO puede crear SUPERADMIN.
     *
     * Solamente un SUPERADMIN puede crear otro SUPERADMIN.
     * ========================================================
     */

    if (
      rol ===
        RolUsuario.SUPERADMIN &&
      sesion.rol !==
        "SUPERADMIN"
    ) {
      return respuestaError(
        "Solo un SUPERADMIN puede crear otro SUPERADMIN.",
        403
      );
    }

    /*
     * ========================================================
     * SUCURSAL
     * ========================================================
     *
     * ADMINISTRADOR:
     * siempre crea usuarios en su propia sucursal.
     *
     * SUPERADMIN:
     * puede indicar otra sucursal.
     * ========================================================
     */

    let sucursalId =
      sesion.sucursalId;

    if (
      sesion.rol ===
        "SUPERADMIN" &&
      sucursalSolicitada
    ) {
      sucursalId =
        sucursalSolicitada;
    }

    /*
     * Verificar sucursal.
     */

    const sucursal =
      await prisma.sucursal.findUnique({
        where: {
          id: sucursalId,
        },

        select: {
          id: true,
          nombre: true,

          empresa: {
            select: {
              nombre: true,
            },
          },
        },
      });

    if (!sucursal) {
      return respuestaError(
        "La sucursal seleccionada no existe.",
        404
      );
    }

    /*
     * ========================================================
     * CORREO DUPLICADO
     * ========================================================
     */

    const correoExistente =
      await prisma.usuario.findFirst({
        where: {
          correo: {
            equals:
              correo,

            mode:
              "insensitive",
          },
        },

        select: {
          id: true,
        },
      });

    if (correoExistente) {
      return respuestaError(
        "Ya existe un usuario registrado con ese correo.",
        409
      );
    }

    /*
     * ========================================================
     * HASH CONTRASEÑA
     * ========================================================
     */

    const passwordHash =
      hashPassword(
        password
      );

    /*
     * ========================================================
     * CREAR
     * ========================================================
     */

    const usuario =
      await prisma.usuario.create({
        data: {
          nombres,

          apellidos,

          correo,

          password:
            passwordHash,

          rol:
            rol as RolUsuario,

          activo:
            true,

          sucursalId,
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

    /*
     * ========================================================
     * RESPUESTA
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Usuario creado correctamente.",

        data: {
          id:
            usuario.id,

          nombres:
            usuario.nombres,

          apellidos:
            usuario.apellidos,

          nombreCompleto:
            `${usuario.nombres} ${usuario.apellidos}`,

          correo:
            usuario.correo,

          rol:
            usuario.rol,

          activo:
            usuario.activo,

          sucursalId:
            usuario.sucursalId,

          sucursal: {
            id:
              usuario.sucursal.id,

            nombre:
              usuario.sucursal
                .nombre,

            codigo:
              usuario.sucursal
                .codigo,

            empresa:
              usuario.sucursal
                .empresa.nombre,
          },

          createdAt:
            usuario.createdAt.toISOString(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando usuario:",
      error
    );

    return respuestaError(
      "No se pudo crear el usuario.",
      500
    );
  }
}