import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  rutaInicialPorRol,
  SESSION_COOKIE,
  verificarTokenSesion,
} from "@/lib/session";

/*
 * ============================================================
 * ROLES ADMINISTRATIVOS
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
 * RUTAS EXCLUSIVAS DEL ADMINISTRADOR
 * ============================================================
 *
 * Todo lo que empiece con:
 *
 * /dashboard/configuracion
 *
 * solo será accesible por:
 *
 * SUPERADMIN
 * ADMINISTRADOR
 */

function esRutaAdministrativa(
  pathname: string
) {
  return pathname.startsWith(
    "/dashboard/configuracion"
  );
}

/*
 * ============================================================
 * VALIDAR ACCESO
 * ============================================================
 */

function puedeEntrar(
  pathname: string,
  rol: string
) {
  /*
   * SUPERADMIN y ADMINISTRADOR
   * pueden entrar a todo.
   */
  if (
    esAdministrador(rol)
  ) {
    return true;
  }

  /*
   * Los demás usuarios NO pueden
   * entrar a configuración.
   */
  if (
    esRutaAdministrativa(
      pathname
    )
  ) {
    return false;
  }

  /*
   * Todos los demás módulos
   * operativos están disponibles
   * para usuarios autenticados.
   */
  return true;
}

/*
 * ============================================================
 * PROXY
 * ============================================================
 */

export async function proxy(
  request: NextRequest
) {
  const {
    pathname,
  } = request.nextUrl;

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

  /*
   * ==========================================================
   * LOGIN
   * ==========================================================
   *
   * Si ya inició sesión, no debe volver
   * al login.
   */
  if (
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

  /*
   * ==========================================================
   * DASHBOARD
   * ==========================================================
   */
  if (
    pathname.startsWith(
      "/dashboard"
    )
  ) {
    /*
     * Sin sesión:
     * regresar al login.
     */
    if (!sesion) {
      const url =
        new URL(
          "/login",
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

    /*
     * Usuario autenticado pero intentando
     * entrar a una zona exclusiva
     * del administrador.
     */
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

/*
 * ============================================================
 * MATCHER
 * ============================================================
 */

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
  ],
};