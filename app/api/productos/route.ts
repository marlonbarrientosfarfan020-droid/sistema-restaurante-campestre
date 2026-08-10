import {
  NextRequest,
  NextResponse,
} from "next/server";

import { AppError } from "@/lib/errors";
import { fail, ok } from "@/lib/response";
import { productoService } from "@/services/producto.service";

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
    "Error en productos:",
    error
  );

  return NextResponse.json(
    fail(
      "Ocurrió un error interno procesando los productos."
    ),
    {
      status: 500,
    }
  );
}

export async function GET() {
  try {
    const productos =
      await productoService.listar();

    return NextResponse.json(
      ok(
        productos,
        "Productos obtenidos correctamente."
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
    const body =
      await request.json();

    const controlaStock =
      body.controlaStock === true;

    const stockActual =
      Number(
        body.stockActual ?? 0
      );

    const stockMinimo =
      Number(
        body.stockMinimo ?? 0
      );

    const disponibleSolicitado =
      body.disponible !== false;

    const disponibleFinal =
      controlaStock
        ? stockActual > 0 &&
          disponibleSolicitado
        : disponibleSolicitado;

    const producto =
      await productoService.crear({
        sucursalId:
          body.sucursalId,

        categoriaId:
          body.categoriaId,

        nombre:
          body.nombre,

        descripcion:
          body.descripcion,

        precioVenta:
          Number(
            body.precioVenta
          ),

        costo:
          Number(
            body.costo ?? 0
          ),

        tiempoPreparacion:
          Number(
            body.tiempoPreparacion ??
              15
          ),

        imagenUrl:
          body.imagenUrl,

        controlaStock,

        stockActual,

        stockMinimo,

        disponible:
          disponibleFinal,
      });

    return NextResponse.json(
      ok(
        producto,
        "Producto creado correctamente."
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    return manejarError(error);
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      typeof body.id ===
      "string"
        ? body.id.trim()
        : "";

    const controlaStock =
      body.controlaStock === true;

    const stockActual =
      Number(
        body.stockActual ?? 0
      );

    const stockMinimo =
      Number(
        body.stockMinimo ?? 0
      );

    const disponibleSolicitado =
      Boolean(
        body.disponible
      );

    const disponibleFinal =
      controlaStock
        ? stockActual > 0 &&
          disponibleSolicitado
        : disponibleSolicitado;

    const producto =
      await productoService.actualizar(
        id,
        {
          categoriaId:
            body.categoriaId,

          nombre:
            body.nombre,

          descripcion:
            body.descripcion,

          precioVenta:
            Number(
              body.precioVenta
            ),

          costo:
            Number(
              body.costo ?? 0
            ),

          tiempoPreparacion:
            Number(
              body.tiempoPreparacion ??
                15
            ),

          imagenUrl:
            body.imagenUrl,

          controlaStock,

          stockActual,

          stockMinimo,

          disponible:
            disponibleFinal,

          activo:
            Boolean(
              body.activo
            ),
        }
      );

    return NextResponse.json(
      ok(
        producto,
        "Producto actualizado correctamente."
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

    const id =
      typeof body.id ===
      "string"
        ? body.id.trim()
        : "";

    const producto =
      await productoService.cambiarDisponibilidad(
        id,
        Boolean(
          body.disponible
        )
      );

    return NextResponse.json(
      ok(
        producto,
        body.disponible
          ? "Producto disponible nuevamente."
          : "Producto marcado como agotado."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const {
      searchParams,
    } = new URL(
      request.url
    );

    const id =
      searchParams.get(
        "id"
      ) ?? "";

    const producto =
      await productoService.desactivar(
        id
      );

    return NextResponse.json(
      ok(
        producto,
        "Producto desactivado correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}