import {
  NextRequest,
  NextResponse,
} from "next/server";

import { AppError } from "@/lib/errors";
import { fail, ok } from "@/lib/response";
import { pedidoService } from "@/services/pedido.service";

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
    "Error en cocina:",
    error
  );

  const detalle =
    error instanceof Error
      ? error.message
      : "Error desconocido";

  return NextResponse.json(
    fail(
      process.env.NODE_ENV ===
        "development"
        ? `Error procesando cocina: ${detalle}`
        : "Ocurrió un error interno en cocina."
    ),
    {
      status: 500,
    }
  );
}

export async function GET() {
  try {
    const pedidos =
      await pedidoService.listarParaCocina();

    return NextResponse.json(
      ok(
        pedidos,
        "Pedidos de cocina obtenidos correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const pedido =
      await pedidoService.cambiarEstadoCocina(
        typeof body.id === "string"
          ? body.id
          : "",
        typeof body.estado === "string"
          ? body.estado
          : ""
      );

    return NextResponse.json(
      ok(
        pedido,
        "Estado del pedido actualizado correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}