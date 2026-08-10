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

  console.error("Error en pedidos:", error);

  const detalle =
    error instanceof Error
      ? error.message
      : "Error desconocido";

  return NextResponse.json(
    fail(
      process.env.NODE_ENV === "development"
        ? `Error procesando pedidos: ${detalle}`
        : "Ocurrió un error interno procesando el pedido."
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
    const { searchParams } =
      new URL(request.url);

    const atencionId =
      searchParams.get("atencionId") ?? "";

    const pedidos =
      await pedidoService.listarPorAtencion(
        atencionId
      );

    return NextResponse.json(
      ok(
        pedidos,
        "Pedidos obtenidos correctamente."
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

    const pedido =
      await pedidoService.crear({
        atencionId: body.atencionId,
        sucursalId: body.sucursalId,
        registradoPorId:
          body.registradoPorId,
        origen: body.origen ?? "MOZO",
        observacion: body.observacion,
        detalles: Array.isArray(
          body.detalles
        )
          ? body.detalles.map(
              (detalle: {
                productoId?: string;
                cantidad?: number;
                observacion?: string;
              }) => ({
                productoId:
                  detalle.productoId ?? "",
                cantidad: Number(
                  detalle.cantidad ?? 0
                ),
                observacion:
                  detalle.observacion,
              })
            )
          : [],
      });

    return NextResponse.json(
      ok(
        pedido,
        "Pedido enviado correctamente a cocina."
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    return manejarError(error);
  }
}