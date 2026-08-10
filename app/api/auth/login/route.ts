import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verificarPassword,
} from "@/lib/password";
import {
  crearTokenSesion,
  rutaInicialPorRol,
  SESSION_COOKIE,
} from "@/lib/session";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const identificador =
      typeof body.identificador === "string"
        ? body.identificador.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!identificador || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ingresa tu correo y contraseña.",
        },
        {
          status: 400,
        }
      );
    }

    const usuario =
      await prisma.usuario.findFirst({
        where: {
          correo: {
            equals: identificador,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          sucursalId: true,
          nombres: true,
          apellidos: true,
          correo: true,
          password: true,
          rol: true,
          activo: true,
          sucursal: {
            select: {
              nombre: true,
              empresa: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      });

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Credenciales incorrectas o usuario inactivo.",
        },
        {
          status: 401,
        }
      );
    }

    const verificacion = verificarPassword(
      password,
      usuario.password
    );

    if (!verificacion.valido) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Credenciales incorrectas.",
        },
        {
          status: 401,
        }
      );
    }

    // Migra automáticamente contraseñas antiguas en texto plano.
    if (verificacion.legado) {
      await prisma.usuario.update({
        where: {
          id: usuario.id,
        },
        data: {
          password:
            hashPassword(password),
        },
      });
    }

    const token = await crearTokenSesion({
      sub: usuario.id,
      sucursalId: usuario.sucursalId,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol,
    });

    const redirectTo =
      rutaInicialPorRol(usuario.rol);

    const response = NextResponse.json({
      success: true,
      message: "Bienvenido a Chinka Chinka.",
      data: {
        usuario: {
          id: usuario.id,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          correo: usuario.correo,
          rol: usuario.rol,
          sucursalId: usuario.sucursalId,
          sucursal:
            usuario.sucursal.nombre,
          empresa:
            usuario.sucursal.empresa.nombre,
        },
        redirectTo,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("Error login:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "No se pudo iniciar sesión.",
      },
      {
        status: 500,
      }
    );
  }
}
