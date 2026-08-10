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
    "Error liberando mesa:",
    error
  );

  const detalle =
    error instanceof Error
      ? error.message
      : "Error desconocido";

  return NextResponse.json(
    fail(
      process.env.NODE_ENV === "development"
        ? `Error liberando mesa: ${detalle}`
        : "Ocurrió un error liberando la mesa."
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

    const atencionId =
      typeof body.atencionId ===
      "string"
        ? body.atencionId
        : "";

    const resultado =
      await cajaService.liberarMesa(
        atencionId
      );

    return NextResponse.json(
      ok(
        resultado,
        "Mesa liberada correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}