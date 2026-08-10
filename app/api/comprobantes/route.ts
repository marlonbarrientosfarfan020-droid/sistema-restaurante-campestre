import {
  NextRequest,
  NextResponse,
} from "next/server";

import { AppError } from "@/lib/errors";
import { fail, ok } from "@/lib/response";
import {
  comprobanteService,
} from "@/services/comprobante.service";

export const runtime = "nodejs";

function manejarError(
  error: unknown
) {
  if (error instanceof AppError) {
    return NextResponse.json(
      fail(error.message),
      {
        status: error.status,
      }
    );
  }

  console.error(
    "Error en comprobantes:",
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
        ? `Error procesando comprobantes: ${detalle}`
        : "Ocurrió un error interno procesando el comprobante."
    ),
    {
      status: 500,
    }
  );
}

/*
 * GET
 *
 * /api/comprobantes
 *   -> lista notas de venta
 *
 * /api/comprobantes?id=xxx
 *   -> obtiene una nota de venta
 */
export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id");

    if (id) {
      const nota =
        await comprobanteService.obtenerNotaVenta(
          id
        );

      return NextResponse.json(
        ok(
          nota,
          "Nota de venta obtenida correctamente."
        )
      );
    }

    const notas =
      await comprobanteService.listarNotasVenta();

    return NextResponse.json(
      ok(
        notas,
        "Notas de venta obtenidas correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}

/*
 * POST
 *
 * Genera una Nota de Venta.
 *
 * Body:
 * {
 *   atencionId: "...",
 *   clienteDocumento?: "...",
 *   clienteNombre?: "...",
 *   clienteDireccion?: "..."
 * }
 */
export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const nota =
      await comprobanteService.crearNotaVenta(
        {
          atencionId:
            typeof body.atencionId ===
            "string"
              ? body.atencionId
              : "",

          clienteDocumento:
            typeof body.clienteDocumento ===
            "string"
              ? body.clienteDocumento
              : undefined,

          clienteNombre:
            typeof body.clienteNombre ===
            "string"
              ? body.clienteNombre
              : undefined,

          clienteDireccion:
            typeof body.clienteDireccion ===
            "string"
              ? body.clienteDireccion
              : undefined,
        }
      );

    return NextResponse.json(
      ok(
        nota,
        `Nota de Venta ${nota.numero} generada correctamente.`
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    return manejarError(error);
  }
}