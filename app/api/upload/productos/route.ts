import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

function limpiarNombre(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const archivo = formData.get("archivo");

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Debes seleccionar una imagen.",
        },
        {
          status: 400,
        }
      );
    }

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Formato no permitido. Usa JPG, PNG, WEBP o AVIF.",
        },
        {
          status: 400,
        }
      );
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json(
        {
          ok: false,
          message: "La imagen no puede superar los 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const nombreSeguro = limpiarNombre(archivo.name);

    const nombreBlob =
      `productos/${Date.now()}-${crypto.randomUUID()}-${nombreSeguro}`;

    const blob = await put(nombreBlob, archivo, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Imagen subida correctamente.",
        data: {
          url: blob.url,
          pathname: blob.pathname,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error subiendo imagen del producto:",
      error
    );

    const detalle =
      error instanceof Error
        ? error.message
        : "Error desconocido";

    return NextResponse.json(
      {
        ok: false,
        message:
          process.env.NODE_ENV === "development"
            ? `Error subiendo imagen: ${detalle}`
            : "No se pudo subir la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}