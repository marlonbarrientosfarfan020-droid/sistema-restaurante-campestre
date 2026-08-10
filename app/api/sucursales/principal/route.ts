import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";

export async function GET() {
  try {
    const sucursal = await prisma.sucursal.findFirst({
      where: {
        codigo: "PRINCIPAL",
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        empresa: {
          select: {
            nombre: true,
          },
        },
      },
    });

    if (!sucursal) {
      return NextResponse.json(
        fail(
          "No se encontró la sucursal principal. Ejecuta nuevamente el seed."
        ),
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      ok(
        sucursal,
        "Sucursal principal obtenida correctamente."
      )
    );
  } catch (error) {
    console.error(
      "Error obteniendo sucursal principal:",
      error
    );

    return NextResponse.json(
      fail(
        "No se pudo obtener la sucursal principal."
      ),
      {
        status: 500,
      }
    );
  }
}