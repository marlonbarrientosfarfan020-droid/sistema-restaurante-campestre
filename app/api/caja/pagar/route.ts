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
    "Error registrando pago:",
    error
  );

  const detalle =
    error instanceof Error
      ? error.message
      : "Error desconocido";

  return NextResponse.json(
    fail(
      process.env.NODE_ENV === "development"
        ? `Error registrando pago: ${detalle}`
        : "Ocurrió un error registrando el pago."
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
    const body =
      await request.json();

    const resultado =
      await cajaService.registrarPago({
        atencionId:
          typeof body.atencionId ===
          "string"
            ? body.atencionId
            : "",

        metodo:
          typeof body.metodo ===
          "string"
            ? body.metodo
            : "",

        monto:
          body.monto === undefined ||
          body.monto === null ||
          body.monto === ""
            ? undefined
            : Number(body.monto),

        montoRecibido:
          body.montoRecibido ===
            undefined ||
          body.montoRecibido ===
            null ||
          body.montoRecibido === ""
            ? undefined
            : Number(
                body.montoRecibido
              ),

        referencia:
          typeof body.referencia ===
          "string"
            ? body.referencia
            : undefined,

        observacion:
          typeof body.observacion ===
          "string"
            ? body.observacion
            : undefined,
      });

    return NextResponse.json(
      ok(
        resultado,
        resultado.pagoCompleto
          ? "Pago registrado correctamente. La cuenta quedó pagada."
          : "Pago parcial registrado correctamente."
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    return manejarError(error);
  }
}