import {
  NextRequest,
  NextResponse,
} from "next/server";

import { AppError } from "@/lib/errors";
import { fail, ok } from "@/lib/response";
import { cajaService } from "@/services/caja.service";

function manejarError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      fail(error.message),
      {
        status: error.status,
      }
    );
  }

  console.error(
    "Error en caja:",
    error
  );

  const detalle =
    error instanceof Error
      ? error.message
      : "Error desconocido";

  return NextResponse.json(
    fail(
      process.env.NODE_ENV === "development"
        ? `Error procesando caja: ${detalle}`
        : "Ocurrió un error interno en caja."
    ),
    {
      status: 500,
    }
  );
}

/*
 * GET
 *
 * Sin atencionId:
 * lista todas las cuentas pendientes.
 *
 * Con atencionId:
 * obtiene una cuenta específica.
 */
export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const atencionId =
      searchParams.get("atencionId");

    if (atencionId) {
      const cuenta =
        await cajaService.obtenerCuenta(
          atencionId
        );

      return NextResponse.json(
        ok(
          cuenta,
          "Cuenta obtenida correctamente."
        )
      );
    }

    const cuentas =
      await cajaService.listarCuentasPendientes();

    return NextResponse.json(
      ok(
        cuentas,
        "Cuentas pendientes obtenidas correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}