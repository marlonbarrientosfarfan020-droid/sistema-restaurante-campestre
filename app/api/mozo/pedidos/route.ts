import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  EstadoPedido,
  OrigenPedido,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";
import { pedidoService } from "@/services/pedido.service";

function manejarError(error: unknown) {
  console.error(
    "Error en pedidos del mozo:",
    error
  );

  return NextResponse.json(
    fail(
      error instanceof Error
        ? error.message
        : "Ocurrió un error procesando los pedidos del mozo."
    ),
    {
      status: 500,
    }
  );
}

export async function GET() {
  try {
    const pedidos =
      await prisma.pedido.findMany({
        where: {
          origen:
            OrigenPedido.CLIENTE_QR,

          estado:
            EstadoPedido.PENDIENTE_CONFIRMACION,
        },

        include: {
          atencion: {
            select: {
              id: true,
              codigo: true,
              metodoPagoPrevisto: true,

              mesa: {
                select: {
                  id: true,
                  numero: true,
                  nombre: true,

                  zona: {
                    select: {
                      id: true,
                      nombre: true,
                    },
                  },
                },
              },
            },
          },

          detalles: {
            include: {
              producto: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  imagenUrl: true,
                },
              },
            },

            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: {
          fechaPedido: "asc",
        },
      });

    const data =
      pedidos.map(
        (pedido) => ({
          id: pedido.id,
          numero: pedido.numero,
          estado: pedido.estado,
          origen: pedido.origen,
          observacion:
            pedido.observacion,
          subtotal:
            Number(pedido.subtotal),
          fechaPedido:
            pedido.fechaPedido.toISOString(),

          atencion: {
            id:
              pedido.atencion.id,

            codigo:
              pedido.atencion.codigo,

            metodoPagoPrevisto:
              pedido.atencion
                .metodoPagoPrevisto,

            mesa:
              pedido.atencion.mesa,
          },

          detalles:
            pedido.detalles.map(
              (detalle) => ({
                id: detalle.id,

                cantidad:
                  Number(
                    detalle.cantidad
                  ),

                precioUnitario:
                  Number(
                    detalle.precioUnitario
                  ),

                subtotal:
                  Number(
                    detalle.subtotal
                  ),

                observacion:
                  detalle.observacion,

                producto:
                  detalle.producto,
              })
            ),
        })
      );

    return NextResponse.json(
      ok(
        data,
        "Pedidos QR pendientes obtenidos correctamente."
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

    const pedidoId =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    if (!pedidoId) {
      return NextResponse.json(
        fail(
          "El pedido es obligatorio."
        ),
        {
          status: 400,
        }
      );
    }

    const pedido =
      await prisma.pedido.findUnique({
        where: {
          id: pedidoId,
        },

        select: {
          id: true,
          estado: true,
          origen: true,
        },
      });

    if (!pedido) {
      return NextResponse.json(
        fail(
          "El pedido no fue encontrado."
        ),
        {
          status: 404,
        }
      );
    }

    if (
      pedido.origen !==
      OrigenPedido.CLIENTE_QR
    ) {
      return NextResponse.json(
        fail(
          "Este pedido no corresponde a un pedido QR."
        ),
        {
          status: 409,
        }
      );
    }

    if (
      pedido.estado !==
      EstadoPedido.PENDIENTE_CONFIRMACION
    ) {
      return NextResponse.json(
        fail(
          "Este pedido ya fue confirmado o ya cambió de estado."
        ),
        {
          status: 409,
        }
      );
    }

    const actualizado =
      await pedidoService.cambiarEstadoCocina(
        pedidoId,
        "RECIBIDO"
      );

    return NextResponse.json(
      ok(
        actualizado,
        "Pedido confirmado correctamente. Ya fue enviado a Cocina."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}