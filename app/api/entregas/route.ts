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
    "Error en entregas:",
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
        ? `Error procesando entregas: ${detalle}`
        : "Ocurrió un error interno procesando las entregas."
    ),
    {
      status: 500,
    }
  );
}

export async function GET() {
  try {
    const pedidos =
      await pedidoService.listarParaEntrega();

    return NextResponse.json(
      ok(
        pedidos,
        "Pedidos para entrega obtenidos correctamente."
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
      await pedidoService.cambiarEstadoEntrega(
        typeof body.id === "string"
          ? body.id
          : "",
        typeof body.estado === "string"
          ? body.estado
          : "",
        typeof body.usuarioId === "string"
          ? body.usuarioId
          : undefined
      );

    return NextResponse.json(
      ok(
        pedido,
        body.estado === "ENTREGADO"
          ? "Pedido entregado correctamente."
          : "Pedido recogido para su entrega."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}