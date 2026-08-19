import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  rutaInicialPorRol,
  SESSION_COOKIE,
  verificarTokenSesion,
} from "@/lib/session";

function esAdministrador(
  rol: string
) {
  return (
    rol === "SUPERADMIN" ||
    rol === "ADMINISTRADOR"
  );
}

function esRutaAdministrativa(
  pathname: string
) {
  return (
    pathname.startsWith(
      "/dashboard/configuracion"
    ) ||
    pathname.startsWith(
      "/dashboard/usuarios"
    )
  );
}

function puedeEntrar(
  pathname: string,
  rol: string
) {
  if (
    esAdministrador(
      rol
    )
  ) {
    return true;
  }

  if (
    esRutaAdministrativa(
      pathname
    )
  ) {
    return false;
  }

  return true;
}

export async function proxy(
  request: NextRequest
) {
  const {
    pathname,
  } =
    request.nextUrl;

  const token =
    request.cookies.get(
      SESSION_COOKIE
    )?.value;

  const sesion =
    token
      ? await verificarTokenSesion(
          token
        )
      : null;

  // Ruta raíz (/) o Login (/login): Si ya tiene sesión, redirigir al panel correspondiente
  if (
    pathname === "/" ||
    pathname === "/login"
  ) {
    if (sesion) {
      return NextResponse.redirect(
        new URL(
          rutaInicialPorRol(
            sesion.rol
          ),
          request.url
        )
      );
    }

    return NextResponse.next();
  }

  // Rutas protegidas del Dashboard (/dashboard/*)
  if (
    pathname.startsWith(
      "/dashboard"
    )
  ) {
    if (!sesion) {
      const url =
        new URL(
          "/",
          request.url
        );

      url.searchParams.set(
        "from",
        pathname
      );

      return NextResponse.redirect(
        url
      );
    }

    if (
      !puedeEntrar(
        pathname,
        sesion.rol
      )
    ) {
      return NextResponse.redirect(
        new URL(
          rutaInicialPorRol(
            sesion.rol
          ),
          request.url
        )
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
  ],
};
