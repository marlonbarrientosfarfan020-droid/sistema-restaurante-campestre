import { NextRequest, NextResponse } from "next/server";

import { AppError } from "@/lib/errors";
import { fail, ok } from "@/lib/response";
import { categoriaService } from "@/services/categoria.service";

function manejarError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      fail(error.message),
      {
        status: error.status,
      }
    );
  }

  console.error("Error en categorías:", error);

  return NextResponse.json(
    fail("Ocurrió un error interno en el servidor."),
    {
      status: 500,
    }
  );
}

export async function GET() {
  try {
    const categorias =
      await categoriaService.listar();

    return NextResponse.json(
      ok(
        categorias,
        "Categorías obtenidas correctamente."
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

    const categoria =
      await categoriaService.crear(body);

    return NextResponse.json(
      ok(
        categoria,
        "Categoría creada correctamente."
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
    const body = await request.json();

    const id =
      typeof body.id === "string"
        ? body.id
        : "";

    const categoria =
      await categoriaService.actualizar(
        id,
        {
          nombre: body.nombre,
          descripcion: body.descripcion,
          activa: Boolean(body.activa),
        }
      );

    return NextResponse.json(
      ok(
        categoria,
        "Categoría actualizada correctamente."
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
    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id") ?? "";

    const categoria =
      await categoriaService.desactivar(id);

    return NextResponse.json(
      ok(
        categoria,
        "Categoría desactivada correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}