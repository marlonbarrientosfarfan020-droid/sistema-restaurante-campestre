import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  EstadoAtencion,
  EstadoDetallePedido,
  EstadoMesa,
  EstadoPedido,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";

type ContextoRuta = {
  params: Promise<{
    atencionId: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  contexto: ContextoRuta
) {
  try {
    const { atencionId } =
      await contexto.params;

    if (!atencionId?.trim()) {
      return NextResponse.json(
        fail(
          "El identificador de la atención es obligatorio."
        ),
        {
          status: 400,
        }
      );
    }

    const atencion =
      await prisma.atencion.findUnique({
        where: {
          id: atencionId,
        },

        include: {
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

          mozo: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
            },
          },

          pedidos: {
            where: {
              estado: {
                not: EstadoPedido.ANULADO,
              },
            },

            include: {
              detalles: {
                where: {
                  estado: {
                    not:
                      EstadoDetallePedido.ANULADO,
                  },
                },

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
          },
        },
      });

    if (!atencion) {
      return NextResponse.json(
        fail(
          "La atención no fue encontrada."
        ),
        {
          status: 404,
        }
      );
    }

    const pedidos =
      atencion.pedidos.map(
        (pedido) => ({
          id: pedido.id,
          numero: pedido.numero,
          origen: pedido.origen,
          estado: pedido.estado,
          observacion:
            pedido.observacion,
          subtotal:
            Number(
              pedido.subtotal
            ),
          fechaPedido:
            pedido.fechaPedido.toISOString(),

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

                estado:
                  detalle.estado,

                observacion:
                  detalle.observacion,

                producto: {
                  id:
                    detalle.producto.id,

                  codigo:
                    detalle.producto
                      .codigo,

                  nombre:
                    detalle.producto
                      .nombre,

                  imagenUrl:
                    detalle.producto
                      .imagenUrl,
                },
              })
            ),
        })
      );

    const subtotalCalculado =
      pedidos.reduce(
        (total, pedido) =>
          total + pedido.subtotal,
        0
      );

    const respuesta = {
      atencion: {
        id: atencion.id,
        codigo: atencion.codigo,
        estado: atencion.estado,

        cantidadPersonas:
          atencion.cantidadPersonas,

        metodoPagoPrevisto:
          atencion.metodoPagoPrevisto,

        observacion:
          atencion.observacion,

        subtotal:
          Number(atencion.subtotal),

        descuento:
          Number(atencion.descuento),

        total:
          Number(atencion.total),

        subtotalCalculado,

        fechaApertura:
          atencion.fechaApertura.toISOString(),

        fechaSolicitudCuenta:
          atencion.fechaSolicitudCuenta
            ?.toISOString() ?? null,

        fechaPago:
          atencion.fechaPago
            ?.toISOString() ?? null,

        mesa: atencion.mesa,

        mozo: atencion.mozo,
      },

      pedidos,
    };

    return NextResponse.json(
      ok(
        respuesta,
        "Ticket obtenido correctamente."
      )
    );
  } catch (error) {
    console.error(
      "Error obteniendo ticket:",
      error
    );

    return NextResponse.json(
      fail(
        process.env.NODE_ENV ===
          "development"
          ? `Error obteniendo ticket: ${
              error instanceof Error
                ? error.message
                : "Error desconocido"
            }`
          : "No se pudo obtener el ticket."
      ),
      {
        status: 500,
      }
    );
  }
}

/*
 * Solicitar cuenta
 */
export async function PATCH(
  _request: NextRequest,
  contexto: ContextoRuta
) {
  try {
    const { atencionId } =
      await contexto.params;

    if (!atencionId?.trim()) {
      return NextResponse.json(
        fail(
          "El identificador de la atención es obligatorio."
        ),
        {
          status: 400,
        }
      );
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const atencion =
            await tx.atencion.findUnique({
              where: {
                id: atencionId,
              },

              select: {
                id: true,
                codigo: true,
                estado: true,
                mesaId: true,
                total: true,
              },
            });

          if (!atencion) {
            throw new Error(
              "ATENCION_NO_EXISTE"
            );
          }

          if (
            atencion.estado !==
            EstadoAtencion.ABIERTA
          ) {
            throw new Error(
              "ATENCION_NO_ABIERTA"
            );
          }

          const pedidosSinEntregar =
            await tx.pedido.count({
              where: {
                atencionId,

                estado: {
                  in: [
                    EstadoPedido.NUEVO,
                    EstadoPedido.RECIBIDO,
                    EstadoPedido.PREPARANDO,
                    EstadoPedido.LISTO,
                    EstadoPedido.EN_ENTREGA,
                  ],
                },
              },
            });

          /*
           * Por ahora permitimos solicitar
           * la cuenta aunque exista algún
           * pedido todavía en proceso.
           *
           * Más adelante podemos bloquearlo
           * desde configuración si el
           * restaurante lo desea.
           */

          const ahora = new Date();

          const actualizada =
            await tx.atencion.update({
              where: {
                id: atencionId,
              },

              data: {
                estado:
                  EstadoAtencion.SOLICITO_CUENTA,

                fechaSolicitudCuenta:
                  ahora,
              },
            });

          await tx.mesa.update({
            where: {
              id: atencion.mesaId,
            },

            data: {
              estado:
                EstadoMesa.SOLICITO_CUENTA,
            },
          });

          return {
            id: actualizada.id,
            codigo:
              actualizada.codigo,
            estado:
              actualizada.estado,
            total:
              Number(
                actualizada.total
              ),
            pedidosSinEntregar,
          };
        }
      );

    return NextResponse.json(
      ok(
        resultado,
        "Cuenta solicitada correctamente. Caja ya puede procesar el pago."
      )
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "ATENCION_NO_EXISTE"
    ) {
      return NextResponse.json(
        fail(
          "La atención no fue encontrada."
        ),
        {
          status: 404,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "ATENCION_NO_ABIERTA"
    ) {
      return NextResponse.json(
        fail(
          "Esta atención ya no se encuentra abierta."
        ),
        {
          status: 409,
        }
      );
    }

    console.error(
      "Error solicitando cuenta:",
      error
    );

    return NextResponse.json(
      fail(
        "No se pudo solicitar la cuenta."
      ),
      {
        status: 500,
      }
    );
  }
}