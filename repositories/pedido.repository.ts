import {
  EstadoAtencion,
  EstadoDetallePedido,
  EstadoMesa,
  EstadoPedido,
  OrigenPedido,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type DetalleValidado = {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion?: string;
};

type CrearPedidoRepositorio = {
  sucursalId: string;
  atencionId: string;
  registradoPorId?: string;
  numero: string;
  origen: OrigenPedido;
  observacion?: string;
  subtotal: number;
  detalles: DetalleValidado[];
};

const ESTADOS_COCINA: EstadoPedido[] = [
  // Compatibilidad con pedidos antiguos.
  EstadoPedido.NUEVO,

  // Flujo operativo nuevo.
  EstadoPedido.RECIBIDO,
  EstadoPedido.PREPARANDO,
];

const ESTADOS_ACTIVOS_ATENCION: EstadoAtencion[] = [
  EstadoAtencion.ABIERTA,
];

export class PedidoRepository {
  obtenerAtencionActiva(
    atencionId: string,
    sucursalId: string
  ) {
    return prisma.atencion.findFirst({
      where: {
        id: atencionId,
        sucursalId,
        estado: {
          in: ESTADOS_ACTIVOS_ATENCION,
        },
      },
      include: {
        mesa: {
          select: {
            id: true,
            numero: true,
            nombre: true,
            estado: true,
          },
        },
      },
    });
  }

  obtenerProductos(
    sucursalId: string,
    productoIds: string[]
  ) {
    return prisma.producto.findMany({
      where: {
        id: {
          in: productoIds,
        },
        sucursalId,
        activo: true,
        disponible: true,
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        precioVenta: true,
        tiempoPreparacion: true,
        controlaStock: true,
        stockActual: true,
        stockMinimo: true,
      },
    });
  }

  obtenerUltimoPedido(sucursalId: string) {
    return prisma.pedido.findFirst({
      where: {
        sucursalId,
        numero: {
          startsWith: "PED-",
        },
      },
      orderBy: {
        numero: "desc",
      },
      select: {
        numero: true,
      },
    });
  }

  async crear(datos: CrearPedidoRepositorio) {
    return prisma.$transaction(async (tx) => {
      const atencion =
        await tx.atencion.findFirst({
          where: {
            id: datos.atencionId,
            sucursalId: datos.sucursalId,
            estado: EstadoAtencion.ABIERTA,
          },
          select: {
            id: true,
            mesaId: true,
          },
        });

      if (!atencion) {
        throw new Error(
          "ATENCION_NO_DISPONIBLE"
        );
      }

      /*
       * ======================================================
       * DESCONTAR STOCK
       * ======================================================
       *
       * CLIENTE_QR:
       * todavía NO descontamos aquí porque el pedido
       * debe ser confirmado primero por el mozo.
       *
       * MOZO / CAJA:
       * nacen confirmados en RECIBIDO, por lo tanto
       * descontamos el stock dentro de esta misma transacción.
       */
      if (
        datos.origen !==
        OrigenPedido.CLIENTE_QR
      ) {
        for (const detalle of datos.detalles) {
          const producto =
            await tx.producto.findFirst({
              where: {
                id: detalle.productoId,
                sucursalId:
                  datos.sucursalId,
                activo: true,
                disponible: true,
              },
              select: {
                id: true,
                nombre: true,
                controlaStock: true,
                stockActual: true,
              },
            });

          if (!producto) {
            throw new Error(
              `PRODUCTO_NO_DISPONIBLE|${detalle.productoId}`
            );
          }

          if (
            !producto.controlaStock
          ) {
            continue;
          }

          const actualizado =
            await tx.producto.updateMany({
              where: {
                id: producto.id,
                sucursalId:
                  datos.sucursalId,
                activo: true,
                disponible: true,
                controlaStock: true,
                stockActual: {
                  gte: detalle.cantidad,
                },
              },
              data: {
                stockActual: {
                  decrement:
                    detalle.cantidad,
                },
              },
            });

          if (
            actualizado.count !== 1
          ) {
            const estadoActual =
              await tx.producto.findUnique({
                where: {
                  id: producto.id,
                },
                select: {
                  nombre: true,
                  stockActual: true,
                },
              });

            throw new Error(
              `STOCK_INSUFICIENTE|${
                estadoActual?.nombre ??
                producto.nombre
              }|${detalle.cantidad}|${Number(
                estadoActual?.stockActual ??
                  0
              )}`
            );
          }

          const stockDespues =
            await tx.producto.findUnique({
              where: {
                id: producto.id,
              },
              select: {
                stockActual: true,
              },
            });

          if (
            stockDespues &&
            Number(
              stockDespues.stockActual
            ) <= 0
          ) {
            await tx.producto.update({
              where: {
                id: producto.id,
              },
              data: {
                disponible: false,
              },
            });
          }
        }
      }

      const pedido =
        await tx.pedido.create({
          data: {
            sucursalId: datos.sucursalId,
            atencionId: datos.atencionId,
            registradoPorId:
              datos.registradoPorId,
            numero: datos.numero,
            origen: datos.origen,
            estado:
              datos.origen === OrigenPedido.CLIENTE_QR
                ? EstadoPedido.PENDIENTE_CONFIRMACION
                : EstadoPedido.RECIBIDO,
            observacion: datos.observacion,
            subtotal: datos.subtotal,

            detalles: {
              create: datos.detalles.map(
                (detalle) => ({
                  productoId:
                    detalle.productoId,
                  cantidad:
                    detalle.cantidad,
                  precioUnitario:
                    detalle.precioUnitario,
                  subtotal:
                    detalle.subtotal,
                  estado:
                    EstadoDetallePedido.NUEVO,
                  observacion:
                    detalle.observacion,
                })
              ),
            },
          },

          include: {
            atencion: {
              select: {
                id: true,
                codigo: true,
                mesa: {
                  select: {
                    id: true,
                    numero: true,
                    nombre: true,
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
                    tiempoPreparacion:
                      true,
                  },
                },
              },
            },
          },
        });

      await tx.atencion.update({
        where: {
          id: datos.atencionId,
        },
        data: {
          subtotal: {
            increment: datos.subtotal,
          },
          total: {
            increment: datos.subtotal,
          },
        },
      });

      await tx.mesa.update({
        where: {
          id: atencion.mesaId,
        },
        data: {
          estado:
            EstadoMesa.PEDIDO_PENDIENTE,
        },
      });

      return pedido;
    });
  }
listarBandeja() {
  return prisma.pedido.findMany({
    include: {
      atencion: {
        select: {
          id: true,
          codigo: true,
          estado: true,

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

      registradoPor: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
        },
      },

      entregadoPor: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
        },
      },

      detalles: {
        where: {
          estado: {
            not: EstadoDetallePedido.ANULADO,
          },
        },

        include: {
          producto: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              imagenUrl: true,
              tiempoPreparacion: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      },
    },

    orderBy: {
      fechaPedido: "desc",
    },

    take: 200,
  });
}
  listarPorAtencion(atencionId: string) {
    return prisma.pedido.findMany({
      where: {
        atencionId,
      },

      include: {
        atencion: {
          select: {
            id: true,
            codigo: true,
            mesa: {
              select: {
                id: true,
                numero: true,
                nombre: true,
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
                tiempoPreparacion: true,
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
  }

  listarParaCocina() {
    return prisma.pedido.findMany({
      where: {
        estado: {
          in: ESTADOS_COCINA,
        },
      },

      include: {
        atencion: {
          select: {
            id: true,
            codigo: true,
            mesa: {
              select: {
                id: true,
                numero: true,
                nombre: true,
              },
            },
          },
        },

        registradoPor: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },

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
                tiempoPreparacion: true,
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
  }

  listarParaEntrega() {
    return prisma.pedido.findMany({
      where: {
        estado: {
          in: [
            EstadoPedido.LISTO,
            EstadoPedido.EN_ENTREGA,
          ],
        },
      },

      include: {
        atencion: {
          select: {
            id: true,
            codigo: true,

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

        registradoPor: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },

        entregadoPor: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },

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
                tiempoPreparacion: true,
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        },
      },

      orderBy: [
        {
          estado: "asc",
        },
        {
          fechaListo: "asc",
        },
      ],
    });
  }

  async actualizarEstado(
    pedidoId: string,
    nuevoEstado: EstadoPedido,
    usuarioId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const pedido =
        await tx.pedido.findUnique({
          where: {
            id: pedidoId,
          },

          select: {
            id: true,
            estado: true,
            atencionId: true,

            detalles: {
              where: {
                estado: {
                  not:
                    EstadoDetallePedido.ANULADO,
                },
              },
              select: {
                cantidad: true,
                productoId: true,
                producto: {
                  select: {
                    id: true,
                    nombre: true,
                    activo: true,
                    disponible: true,
                    controlaStock: true,
                    stockActual: true,
                  },
                },
              },
            },

            atencion: {
              select: {
                mesaId: true,
              },
            },
          },
        });

      if (!pedido) {
        throw new Error(
          "PEDIDO_NO_EXISTE"
        );
      }

      const transicionesValidas: Record<
        EstadoPedido,
        EstadoPedido[]
      > = {
        /*
         * Flujo nuevo para pedidos QR:
         *
         * PENDIENTE_CONFIRMACION
         * -> RECIBIDO
         * -> PREPARANDO
         * -> ENTREGADO
         */
        PENDIENTE_CONFIRMACION: [
          EstadoPedido.RECIBIDO,
          EstadoPedido.ANULADO,
        ],

        /*
         * Compatibilidad con pedidos creados
         * antes de incorporar la confirmación
         * del mozo.
         */
        NUEVO: [
          EstadoPedido.RECIBIDO,
          EstadoPedido.ANULADO,
        ],

        RECIBIDO: [
          EstadoPedido.PREPARANDO,
          EstadoPedido.ANULADO,
        ],

       PREPARANDO: [
  EstadoPedido.LISTO,
  EstadoPedido.ANULADO,
],

        /*
         * Estados heredados.
         * Los conservamos para que pedidos
         * antiguos puedan terminar su ciclo.
         */
        LISTO: [
  EstadoPedido.EN_ENTREGA,
  EstadoPedido.ANULADO,
],

        EN_ENTREGA: [
          EstadoPedido.ENTREGADO,
          EstadoPedido.ANULADO,
        ],

        ENTREGADO: [],

        ANULADO: [],
      };

      const estadosPermitidos =
        transicionesValidas[pedido.estado];

      if (
        !estadosPermitidos.includes(
          nuevoEstado
        )
      ) {
        throw new Error(
          "TRANSICION_ESTADO_INVALIDA"
        );
      }

      /*
       * ======================================================
       * CONFIRMACIÓN QR / NUEVO ANTIGUO -> RECIBIDO
       * ======================================================
       *
       * El stock se descuenta aquí porque el pedido QR todavía
       * no estaba confirmado cuando fue creado.
       *
       * La condición stockActual >= cantidad dentro de
       * updateMany evita vender más unidades de las disponibles
       * si dos pedidos se confirman casi al mismo tiempo.
       */
      if (
        nuevoEstado ===
          EstadoPedido.RECIBIDO &&
        (
          pedido.estado ===
            EstadoPedido.PENDIENTE_CONFIRMACION ||
          pedido.estado ===
            EstadoPedido.NUEVO
        )
      ) {
        for (const detalle of pedido.detalles) {
          const producto =
            detalle.producto;

          if (
            !producto.activo ||
            !producto.disponible
          ) {
            throw new Error(
              `PRODUCTO_NO_DISPONIBLE|${producto.nombre}`
            );
          }

          if (
            !producto.controlaStock
          ) {
            continue;
          }

          const cantidad =
            Number(
              detalle.cantidad
            );

          const actualizado =
            await tx.producto.updateMany({
              where: {
                id:
                  producto.id,
                activo:
                  true,
                disponible:
                  true,
                controlaStock:
                  true,
                stockActual: {
                  gte:
                    cantidad,
                },
              },
              data: {
                stockActual: {
                  decrement:
                    cantidad,
                },
              },
            });

          if (
            actualizado.count !== 1
          ) {
            const estadoActual =
              await tx.producto.findUnique({
                where: {
                  id:
                    producto.id,
                },
                select: {
                  nombre:
                    true,
                  stockActual:
                    true,
                },
              });

            throw new Error(
              `STOCK_INSUFICIENTE|${
                estadoActual?.nombre ??
                producto.nombre
              }|${cantidad}|${Number(
                estadoActual?.stockActual ??
                  0
              )}`
            );
          }

          const stockDespues =
            await tx.producto.findUnique({
              where: {
                id:
                  producto.id,
              },
              select: {
                stockActual:
                  true,
              },
            });

          if (
            stockDespues &&
            Number(
              stockDespues.stockActual
            ) <= 0
          ) {
            await tx.producto.update({
              where: {
                id:
                  producto.id,
              },
              data: {
                disponible:
                  false,
              },
            });
          }
        }
      }

      /*
       * ======================================================
       * ANULACIÓN -> DEVOLVER STOCK
       * ======================================================
       *
       * Solo devolvemos inventario si el pedido ya había sido
       * confirmado y, por tanto, su stock había sido descontado.
       *
       * PENDIENTE_CONFIRMACION y NUEVO no necesitan devolución.
       */
      const estadosConStockDescontado: EstadoPedido[] = [
        EstadoPedido.RECIBIDO,
        EstadoPedido.PREPARANDO,
        EstadoPedido.LISTO,
        EstadoPedido.EN_ENTREGA,
      ];

      if (
        nuevoEstado ===
          EstadoPedido.ANULADO &&
        estadosConStockDescontado.includes(
          pedido.estado
        )
      ) {
        for (const detalle of pedido.detalles) {
          const producto =
            detalle.producto;

          if (
            !producto.controlaStock
          ) {
            continue;
          }

          const cantidad =
            Number(
              detalle.cantidad
            );

          const stockAntes =
            Number(
              producto.stockActual
            );

          await tx.producto.update({
            where: {
              id:
                producto.id,
            },
            data: {
              stockActual: {
                increment:
                  cantidad,
              },

              /*
               * Si estaba agotado exactamente por llegar a cero,
               * al devolver unidades vuelve a quedar disponible.
               */
              disponible:
                producto.activo &&
                !producto.disponible &&
                stockAntes <= 0
                  ? true
                  : producto.disponible,
            },
          });
        }
      }

      const ahora = new Date();

      const datosPedido: {
        estado: EstadoPedido;
        fechaRecibido?: Date;
        fechaPreparacion?: Date;
        fechaListo?: Date;
        fechaEntrega?: Date;
        entregadoPorId?: string;
      } = {
        estado: nuevoEstado,
      };

      if (
        nuevoEstado ===
        EstadoPedido.RECIBIDO
      ) {
        datosPedido.fechaRecibido =
          ahora;
      }

      if (
        nuevoEstado ===
        EstadoPedido.PREPARANDO
      ) {
        datosPedido.fechaPreparacion =
          ahora;
      }

      if (
        nuevoEstado ===
        EstadoPedido.LISTO
      ) {
        datosPedido.fechaListo = ahora;
      }

      if (
        nuevoEstado ===
          EstadoPedido.EN_ENTREGA &&
        usuarioId
      ) {
        datosPedido.entregadoPorId =
          usuarioId;
      }

      if (
        nuevoEstado ===
        EstadoPedido.ENTREGADO
      ) {
        datosPedido.fechaEntrega = ahora;

        if (usuarioId) {
          datosPedido.entregadoPorId =
            usuarioId;
        }
      }

      await tx.pedido.update({
        where: {
          id: pedidoId,
        },
        data: datosPedido,
      });

      if (
        nuevoEstado ===
        EstadoPedido.PREPARANDO
      ) {
        await tx.detallePedido.updateMany({
          where: {
            pedidoId,
            estado: {
              not:
                EstadoDetallePedido.ANULADO,
            },
          },
          data: {
            estado:
              EstadoDetallePedido.PREPARANDO,
            fechaPreparacion: ahora,
          },
        });
      }

      if (
        nuevoEstado ===
        EstadoPedido.LISTO
      ) {
        await tx.detallePedido.updateMany({
          where: {
            pedidoId,
            estado: {
              not:
                EstadoDetallePedido.ANULADO,
            },
          },
          data: {
            estado:
              EstadoDetallePedido.LISTO,
            fechaListo: ahora,
          },
        });
      }

      if (
        nuevoEstado ===
        EstadoPedido.ENTREGADO
      ) {
        await tx.detallePedido.updateMany({
          where: {
            pedidoId,
            estado: {
              not:
                EstadoDetallePedido.ANULADO,
            },
          },
          data: {
            estado:
              EstadoDetallePedido.ENTREGADO,
            fechaEntrega: ahora,
          },
        });
      }

      if (
        nuevoEstado ===
        EstadoPedido.ANULADO
      ) {
        await tx.detallePedido.updateMany({
          where: {
            pedidoId,
          },
          data: {
            estado:
              EstadoDetallePedido.ANULADO,
          },
        });
      }

      /*
       * Cuando cocina termina el pedido,
       * la mesa todavía espera que el mozo
       * lo recoja y lo entregue.
       */
      if (
        nuevoEstado ===
        EstadoPedido.LISTO
      ) {
        await tx.mesa.update({
          where: {
            id: pedido.atencion.mesaId,
          },
          data: {
            estado:
              EstadoMesa.PEDIDO_PENDIENTE,
          },
        });
      }

      /*
       * Cuando el mozo confirma la entrega,
       * la mesa pasa a CONSUMIENDO.
       */
      if (
        nuevoEstado ===
        EstadoPedido.ENTREGADO
      ) {
        await tx.mesa.update({
          where: {
            id: pedido.atencion.mesaId,
          },
          data: {
            estado:
              EstadoMesa.CONSUMIENDO,
          },
        });
      }

      /*
       * Si el pedido se anula, revisamos si
       * quedan otros pedidos activos.
       */
      if (
        nuevoEstado ===
        EstadoPedido.ANULADO
      ) {
        const pedidosActivos =
          await tx.pedido.count({
            where: {
              atencionId:
                pedido.atencionId,
              estado: {
                in: [
                  EstadoPedido.PENDIENTE_CONFIRMACION,
                  EstadoPedido.NUEVO,
                  EstadoPedido.RECIBIDO,
                  EstadoPedido.PREPARANDO,
                  EstadoPedido.LISTO,
                  EstadoPedido.EN_ENTREGA,
                ],
              },
            },
          });

        if (pedidosActivos === 0) {
          await tx.mesa.update({
            where: {
              id:
                pedido.atencion.mesaId,
            },
            data: {
              estado:
                EstadoMesa.CONSUMIENDO,
            },
          });
        }
      }

      const pedidoActualizado =
        await tx.pedido.findUnique({
          where: {
            id: pedidoId,
          },

          include: {
            atencion: {
              select: {
                id: true,
                codigo: true,

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

            registradoPor: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },

            entregadoPor: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
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
                    tiempoPreparacion:
                      true,
                  },
                },
              },

              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

      if (!pedidoActualizado) {
        throw new Error(
          "PEDIDO_NO_EXISTE"
        );
      }

      return pedidoActualizado;
    });
  }
}

export const pedidoRepository =
  new PedidoRepository();