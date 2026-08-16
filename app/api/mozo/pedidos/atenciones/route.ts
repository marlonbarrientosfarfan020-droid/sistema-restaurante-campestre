import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import { AppError } from "@/lib/errors";
import {
  fail,
  ok,
} from "@/lib/response";
import {
  SESSION_COOKIE,
  verificarTokenSesion,
} from "@/lib/session";
import {
  mesaService,
} from "@/services/mesa.service";

const ROLES_PERMITIDOS = new Set([
  "MOZO",
  "SUPERADMIN",
  "ADMINISTRADOR",
  "GERENTE",
]);

async function obtenerSesion() {
  const store =
    await cookies();

  const token =
    store.get(
      SESSION_COOKIE
    )?.value;

  if (!token) {
    return null;
  }

  return verificarTokenSesion(
    token
  );
}

function manejarError(
  error: unknown
) {
  if (
    error instanceof AppError
  ) {
    return NextResponse.json(
      fail(
        error.message
      ),
      {
        status:
          error.status,
      }
    );
  }

  console.error(
    "Error abriendo atención del mozo:",
    error
  );

  const mensaje =
    error instanceof Error
      ? error.message
      : "Error desconocido";

  if (
    mensaje ===
    "ATENCION_ACTIVA_EXISTENTE"
  ) {
    return NextResponse.json(
      fail(
        "La mesa ya tiene una atención activa."
      ),
      {
        status: 409,
      }
    );
  }

  if (
    mensaje ===
    "MESA_NO_EXISTE"
  ) {
    return NextResponse.json(
      fail(
        "La mesa no existe o no pertenece a tu sucursal."
      ),
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(
    fail(
      process.env.NODE_ENV ===
        "development"
        ? `No se pudo abrir la atención: ${mensaje}`
        : "No se pudo abrir la atención."
    ),
    {
      status: 500,
    }
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        fail(
          "Tu sesión expiró. Inicia sesión nuevamente."
        ),
        {
          status: 401,
        }
      );
    }

    if (
      !ROLES_PERMITIDOS.has(
        sesion.rol
      )
    ) {
      return NextResponse.json(
        fail(
          "No tienes permiso para abrir mesas."
        ),
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const mesaId =
      typeof body.mesaId ===
      "string"
        ? body.mesaId.trim()
        : "";

    const cantidadPersonas =
      Number(
        body.cantidadPersonas ??
          1
      );

    if (!mesaId) {
      return NextResponse.json(
        fail(
          "La mesa es obligatoria."
        ),
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        cantidadPersonas
      ) ||
      cantidadPersonas <
        1 ||
      cantidadPersonas >
        50
    ) {
      return NextResponse.json(
        fail(
          "La cantidad de personas no es válida."
        ),
        {
          status: 400,
        }
      );
    }

    const atencion =
      await mesaService.abrirAtencion({
        mesaId,
        sucursalId:
          sesion.sucursalId,
        mozoId:
          sesion.sub,
        cantidadPersonas,
        observacion:
          "Atención iniciada desde Modo Mozo",
      });

    return NextResponse.json(
      ok(
        atencion,
        "Mesa abierta correctamente."
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    return manejarError(
      error
    );
  }
}
