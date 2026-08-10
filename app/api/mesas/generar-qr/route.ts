import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const sucursalId =
      String(
        body.sucursalId ?? ""
      ).trim();

    if (!sucursalId) {
      return NextResponse.json(
        fail(
          "La sucursal es obligatoria."
        ),
        {
          status: 400,
        }
      );
    }

    const sucursal =
      await prisma.sucursal.findUnique({
        where: {
          id: sucursalId,
        },

        select: {
          id: true,
          codigo: true,
          nombre: true,
        },
      });

    if (!sucursal) {
      return NextResponse.json(
        fail(
          "La sucursal no existe."
        ),
        {
          status: 404,
        }
      );
    }

    const mesas =
      await prisma.mesa.findMany({
        where: {
          zona: {
            sucursalId,
          },
          activa: true,
        },

        select: {
          id: true,
          numero: true,
          nombre: true,
          qrCode: true,
        },

        orderBy: {
          numero: "asc",
        },
      });

    if (mesas.length === 0) {
      return NextResponse.json(
        fail(
          "No existen mesas activas en esta sucursal."
        ),
        {
          status: 404,
        }
      );
    }

    const resultado =
      await prisma.$transaction(
        mesas.map((mesa) => {
          /*
           * Si la mesa ya tiene código,
           * NO lo cambiamos.
           */
          if (mesa.qrCode) {
            return prisma.mesa.update({
              where: {
                id: mesa.id,
              },

              data: {},

              select: {
                id: true,
                numero: true,
                nombre: true,
                qrCode: true,
              },
            });
          }

          /*
           * Código permanente de la mesa.
           *
           * Ejemplo:
           * CHINKA-PRINCIPAL-M02-A8F92C31
           */
          const aleatorio =
            crypto.randomUUID()
              .replaceAll("-", "")
              .slice(0, 8)
              .toUpperCase();

          const numeroMesa =
            String(
              mesa.numero
            ).padStart(2, "0");

          const codigoQr =
            `CHINKA-${sucursal.codigo}-M${numeroMesa}-${aleatorio}`;

          return prisma.mesa.update({
            where: {
              id: mesa.id,
            },

            data: {
              qrCode:
                codigoQr,
            },

            select: {
              id: true,
              numero: true,
              nombre: true,
              qrCode: true,
            },
          });
        })
      );

    return NextResponse.json(
      ok(
        {
          sucursal: {
            id: sucursal.id,
            codigo:
              sucursal.codigo,
            nombre:
              sucursal.nombre,
          },

          cantidad:
            resultado.length,

          mesas:
            resultado,
        },
        `${resultado.length} mesas procesadas correctamente.`
      )
    );
  } catch (error) {
    console.error(
      "Error generando códigos QR:",
      error
    );

    return NextResponse.json(
      fail(
        process.env.NODE_ENV ===
          "development"
          ? `Error generando códigos QR: ${
              error instanceof Error
                ? error.message
                : "Error desconocido"
            }`
          : "No se pudieron generar los códigos QR."
      ),
      {
        status: 500,
      }
    );
  }
}