import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";

type ContextoRuta = {
  params: Promise<{
    qrCode: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  contexto: ContextoRuta
) {
  try {
    const { qrCode } =
      await contexto.params;

    const codigo =
      decodeURIComponent(
        qrCode ?? ""
      ).trim();

    if (!codigo) {
      return NextResponse.json(
        fail(
          "El código QR de la mesa es obligatorio."
        ),
        {
          status: 400,
        }
      );
    }

    const mesa =
      await prisma.mesa.findFirst({
        where: {
          qrCode: codigo,
          activa: true,
        },

        select: {
          id: true,
          numero: true,
          nombre: true,
          capacidad: true,
          estado: true,
          qrCode: true,

          zona: {
            select: {
              id: true,
              nombre: true,

              sucursal: {
                select: {
                  id: true,
                  nombre: true,
                  direccion: true,

                  empresa: {
                    select: {
                      id: true,
                      nombre: true,
                      logoUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!mesa) {
      return NextResponse.json(
        fail(
          "El QR no corresponde a una mesa activa."
        ),
        {
          status: 404,
        }
      );
    }

    const sucursal =
      mesa.zona.sucursal;

    const categorias =
      await prisma.categoria.findMany({
        where: {
          sucursalId:
            sucursal.id,

          activa: true,

          productos: {
            some: {
              activo: true,
              disponible: true,
            },
          },
        },

        select: {
          id: true,
          codigo: true,
          nombre: true,
          descripcion: true,

          productos: {
            where: {
              activo: true,
              disponible: true,
            },

            select: {
              id: true,
              codigo: true,
              nombre: true,
              descripcion: true,
              precioVenta: true,
              imagenUrl: true,
              tiempoPreparacion:
                true,
            },

            orderBy: {
              nombre: "asc",
            },
          },
        },

        orderBy: {
          nombre: "asc",
        },
      });

    const data = {
      restaurante: {
        empresaId:
          sucursal.empresa.id,

        nombre:
          sucursal.empresa.nombre,

        logoUrl:
          sucursal.empresa.logoUrl,

        sucursal: {
          id: sucursal.id,
          nombre:
            sucursal.nombre,
          direccion:
            sucursal.direccion,
        },
      },

      mesa: {
        id: mesa.id,
        numero: mesa.numero,
        nombre: mesa.nombre,
        capacidad:
          mesa.capacidad,
        estado: mesa.estado,
        qrCode: mesa.qrCode,
        zona: {
          id: mesa.zona.id,
          nombre:
            mesa.zona.nombre,
        },
      },

      categorias:
        categorias.map(
          (categoria) => ({
            id: categoria.id,
            codigo:
              categoria.codigo,
            nombre:
              categoria.nombre,
            descripcion:
              categoria.descripcion,

            productos:
              categoria.productos.map(
                (producto) => ({
                  id: producto.id,
                  codigo:
                    producto.codigo,
                  nombre:
                    producto.nombre,
                  descripcion:
                    producto.descripcion,

                  precioVenta:
                    Number(
                      producto.precioVenta
                    ),

                  imagenUrl:
                    producto.imagenUrl,

                  tiempoPreparacion:
                    producto.tiempoPreparacion,
                })
              ),
          })
        ),
    };

    return NextResponse.json(
      ok(
        data,
        "Menú obtenido correctamente."
      )
    );
  } catch (error) {
    console.error(
      "Error cargando menú QR:",
      error
    );

    return NextResponse.json(
      fail(
        process.env.NODE_ENV ===
          "development"
          ? `Error cargando el menú: ${
              error instanceof Error
                ? error.message
                : "Error desconocido"
            }`
          : "No se pudo cargar el menú."
      ),
      {
        status: 500,
      }
    );
  }
}