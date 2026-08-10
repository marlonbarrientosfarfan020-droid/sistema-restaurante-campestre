import {
  EstadoAtencion,
  EstadoDetallePedido,
  EstadoMesa,
  EstadoPedido,
  MetodoPago,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type RegistrarPagoRepositorio = {
  atencionId: string;
  metodo: MetodoPago;
  monto: number;
  montoRecibido?: number;
  vuelto?: number;
  referencia?: string;
  observacion?: string;
};

export class CajaRepository {
  /*
   * =========================================================
   * LISTAR CUENTAS DE CAJA
   * =========================================================
   *
   * Importante:
   * - SOLICITO_CUENTA = todavía falta cobrar.
   * - PAGADA = ya se cobró, pero todavía falta liberar mesa.
   *
   * CERRADA ya no aparece en Caja.
   */
  listarCuentasPendientes() {
    return prisma.atencion.findMany({
      where: {
        estado: {
          in: [
            EstadoAtencion.SOLICITO_CUENTA,
            EstadoAtencion.PAGADA,
          ],
        },
      },

      include: {
        mesa: {
          select: {
            id: true,
            numero: true,
            nombre: true,
            estado: true,

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

        pagos: {
          orderBy: {
            fechaPago: "asc",
          },
        },
      },

      /*
       * Primero mostramos las cuentas
       * que llevan más tiempo esperando.
       */
      orderBy: {
        fechaSolicitudCuenta: "asc",
      },
    });
  }

  /*
   * =========================================================
   * OBTENER UNA CUENTA
   * =========================================================
   */
  obtenerCuenta(atencionId: string) {
    return prisma.atencion.findUnique({
      where: {
        id: atencionId,
      },

      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,

            empresa: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },

        mesa: {
          select: {
            id: true,
            numero: true,
            nombre: true,
            estado: true,

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

        pagos: {
          orderBy: {
            fechaPago: "asc",
          },
        },
      },
    });
  }

  /*
   * =========================================================
   * REGISTRAR PAGO
   * =========================================================
   */
  async registrarPago(
    datos: RegistrarPagoRepositorio
  ) {
    return prisma.$transaction(
      async (tx) => {
        const atencion =
          await tx.atencion.findUnique({
            where: {
              id: datos.atencionId,
            },

            select: {
              id: true,
              codigo: true,
              estado: true,
              sucursalId: true,
              mesaId: true,
              total: true,

              pagos: {
                select: {
                  id: true,
                  monto: true,
                },
              },
            },
          });

        if (!atencion) {
          throw new Error(
            "ATENCION_NO_EXISTE"
          );
        }

        /*
         * No permitimos cobrar nuevamente
         * una atención ya pagada/cerrada.
         */
        if (
          atencion.estado ===
            EstadoAtencion.PAGADA ||
          atencion.estado ===
            EstadoAtencion.CERRADA
        ) {
          throw new Error(
            "ATENCION_YA_PAGADA"
          );
        }

        /*
         * Solo se puede cobrar cuando
         * el cliente solicitó la cuenta.
         */
        if (
          atencion.estado !==
          EstadoAtencion.SOLICITO_CUENTA
        ) {
          throw new Error(
            "ATENCION_NO_SOLICITO_CUENTA"
          );
        }

        const totalAtencion =
          Number(atencion.total);

        const totalPagadoAnterior =
          atencion.pagos.reduce(
            (acumulado, pago) =>
              acumulado +
              Number(pago.monto),
            0
          );

        const saldoPendiente =
          Math.max(
            0,
            Math.round(
              (totalAtencion -
                totalPagadoAnterior) *
                100
            ) / 100
          );

        if (
          saldoPendiente <= 0
        ) {
          throw new Error(
            "ATENCION_YA_PAGADA"
          );
        }

        if (
          !Number.isFinite(
            datos.monto
          ) ||
          datos.monto <= 0 ||
          datos.monto >
            saldoPendiente
        ) {
          throw new Error(
            "MONTO_PAGO_INVALIDO"
          );
        }

        /*
         * Guardamos el pago.
         */
        const pago =
          await tx.pago.create({
            data: {
              sucursalId:
                atencion.sucursalId,

              atencionId:
                atencion.id,

              metodo:
                datos.metodo,

              monto:
                datos.monto,

              montoRecibido:
                datos.montoRecibido,

              vuelto:
                datos.vuelto,

              referencia:
                datos.referencia,

              observacion:
                datos.observacion,
            },
          });

        const totalPagadoNuevo =
          Math.round(
            (totalPagadoAnterior +
              datos.monto) *
              100
          ) / 100;

        const nuevoSaldo =
          Math.max(
            0,
            Math.round(
              (totalAtencion -
                totalPagadoNuevo) *
                100
            ) / 100
          );

        const pagoCompleto =
          nuevoSaldo <= 0;

        /*
         * Si terminó de pagar:
         *
         * Atención -> PAGADA
         * Mesa     -> PAGADA
         *
         * PERO todavía NO liberamos
         * la mesa.
         */
        if (pagoCompleto) {
          await tx.atencion.update({
            where: {
              id: atencion.id,
            },

            data: {
              estado:
                EstadoAtencion.PAGADA,

              fechaPago:
                new Date(),
            },
          });

          await tx.mesa.update({
            where: {
              id: atencion.mesaId,
            },

            data: {
              estado:
                EstadoMesa.PAGADA,
            },
          });
        }

        return {
          pago,

          atencionId:
            atencion.id,

          codigo:
            atencion.codigo,

          totalAtencion,

          totalPagado:
            totalPagadoNuevo,

          saldoPendiente:
            nuevoSaldo,

          pagoCompleto,
        };
      }
    );
  }

  /*
   * =========================================================
   * LIBERAR MESA
   * =========================================================
   *
   * Solo puede ejecutarse después
   * de que la cuenta esté PAGADA.
   */
  async liberarMesa(
    atencionId: string
  ) {
    return prisma.$transaction(
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
            },
          });

        if (!atencion) {
          throw new Error(
            "ATENCION_NO_EXISTE"
          );
        }

        if (
          atencion.estado !==
          EstadoAtencion.PAGADA
        ) {
          throw new Error(
            "ATENCION_NO_PAGADA"
          );
        }

        /*
         * Cerramos la atención.
         */
        await tx.atencion.update({
          where: {
            id: atencion.id,
          },

          data: {
            estado:
              EstadoAtencion.CERRADA,

            fechaCierre:
              new Date(),
          },
        });

        /*
         * La mesa vuelve a quedar
         * disponible.
         */
        await tx.mesa.update({
          where: {
            id: atencion.mesaId,
          },

          data: {
            estado:
              EstadoMesa.LIBRE,
          },
        });

        return {
          atencionId:
            atencion.id,

          codigo:
            atencion.codigo,

          mesaId:
            atencion.mesaId,

          liberada: true,
        };
      }
    );
  }

  /*
   * =========================================================
   * MÉTRICAS DEL PANEL PRINCIPAL
   * =========================================================
   */
  async obtenerMetricasDashboard(
    inicioHoy: Date,
    finHoy: Date,
    inicioAyer: Date
  ) {
    const [
      pagosHoy,
      pagosAyer,
      atencionesHoy,
      pedidosHoy,
      detallesHoy,
    ] = await Promise.all([
      prisma.pago.findMany({
        where: {
          fechaPago: {
            gte: inicioHoy,
            lt: finHoy,
          },
        },
        select: {
          atencionId: true,
          metodo: true,
          monto: true,
          fechaPago: true,
        },
        orderBy: {
          fechaPago: "asc",
        },
      }),

      prisma.pago.findMany({
        where: {
          fechaPago: {
            gte: inicioAyer,
            lt: inicioHoy,
          },
        },
        select: {
          monto: true,
        },
      }),

      prisma.atencion.findMany({
        where: {
          fechaPago: {
            gte: inicioHoy,
            lt: finHoy,
          },
          estado: {
            in: [
              EstadoAtencion.PAGADA,
              EstadoAtencion.CERRADA,
            ],
          },
        },
        select: {
          id: true,
          mesaId: true,
          total: true,
          fechaPago: true,
        },
      }),

      prisma.pedido.count({
        where: {
          estado: {
            not: EstadoPedido.ANULADO,
          },
          atencion: {
            fechaPago: {
              gte: inicioHoy,
              lt: finHoy,
            },
          },
        },
      }),

      prisma.detallePedido.findMany({
        where: {
          estado: {
            not: EstadoDetallePedido.ANULADO,
          },
          pedido: {
            estado: {
              not: EstadoPedido.ANULADO,
            },
            atencion: {
              fechaPago: {
                gte: inicioHoy,
                lt: finHoy,
              },
            },
          },
        },
        select: {
          cantidad: true,
          subtotal: true,
          producto: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      }),
    ]);

    return {
      pagosHoy,
      pagosAyer,
      atencionesHoy,
      pedidosHoy,
      detallesHoy,
    };
  }

}

export const cajaRepository =
  new CajaRepository();