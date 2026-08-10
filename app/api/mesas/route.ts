import {
  NextRequest,
  NextResponse,
} from "next/server";

import { AppError } from "@/lib/errors";
import { fail, ok } from "@/lib/response";
import { mesaService } from "@/services/mesa.service";

function manejarError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      fail(error.message),
      {
        status: error.status,
      }
    );
  }

  console.error("Error en mesas:", error);

  const detalle =
    error instanceof Error
      ? error.message
      : "Error desconocido";

  return NextResponse.json(
    fail(
      process.env.NODE_ENV === "development"
        ? `Error procesando las mesas: ${detalle}`
        : "Ocurrió un error interno procesando las mesas."
    ),
    {
      status: 500,
    }
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const sucursalId =
      searchParams.get("sucursalId") ?? "";

    const mesas =
      await mesaService.listar(sucursalId);

    return NextResponse.json(
      ok(
        mesas,
        "Mesas obtenidas correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const atencion =
      await mesaService.abrirAtencion({
        mesaId: body.mesaId,
        sucursalId: body.sucursalId,
        mozoId: body.mozoId,
        cantidadPersonas: Number(
          body.cantidadPersonas ?? 1
        ),
        metodoPagoPrevisto:
          body.metodoPagoPrevisto,
        observacion: body.observacion,
      });

    return NextResponse.json(
      ok(
        atencion,
        "Mesa ocupada y atención abierta correctamente."
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    return manejarError(error);
  }
}