import {
  EstadoAtencion,
  EstadoMesa,
  MetodoPago,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type CrearAtencionRepositorio = {
  mesaId: string;
  sucursalId: string;
  mozoId?: string;
  codigo: string;
  cantidadPersonas: number;
  metodoPagoPrevisto?: MetodoPago;
  observacion?: string;
};

/*
 * Una atención sigue ocupando la mesa mientras esté:
 *
 * ABIERTA
 * SOLICITO_CUENTA
 * PAGADA
 *
 * PAGADA se considera activa hasta que Caja/Mozo
 * ejecute "Liberar mesa", momento en el cual la
 * atención pasa a CERRADA y la mesa a LIBRE.
 */
const ESTADOS_ATENCION_ACTIVA: EstadoAtencion[] = [
  EstadoAtencion.ABIERTA,
  EstadoAtencion.SOLICITO_CUENTA,
  EstadoAtencion.PAGADA,
];

/*
 * Estos estados de mesa requieren obligatoriamente
 * una atención activa asociada.
 *
 * Si encontramos una mesa en uno de estos estados
 * pero sin atención activa, quedó inconsistente por
 * una prueba/cierre anterior y la reparamos a LIBRE.
 *
 * No incluimos LIMPIEZA porque puede ser un estado
 * físico intencional aun cuando no haya atención.
 */
const ESTADOS_MESA_QUE_REQUIEREN_ATENCION: EstadoMesa[] = [
  EstadoMesa.OCUPADA,
  EstadoMesa.PEDIDO_PENDIENTE,
  EstadoMesa.CONSUMIENDO,
  EstadoMesa.SOLICITO_CUENTA,
  EstadoMesa.PAGADA,
];

export class MesaRepository {
  /*
   * =====================================================
   * LISTAR MESAS
   * =====================================================
   *
   * Antes de devolver el mapa hacemos una autocorrección
   * segura de mesas "huérfanas":
   *
   * CONSUMIENDO / OCUPADA / etc.
   * +
   * sin atención activa
   * =
   * LIBRE
   *
   * Así nunca volveremos a mostrar:
   * "Consumiendo - Sin atención - S/ 0.00".
   */
  async listarPorSucursal(
    sucursalId: string
  ) {
    await prisma.mesa.updateMany({
      where: {
        activa: true,

        zona: {
          sucursalId,
        },

        estado: {
          in:
            ESTADOS_MESA_QUE_REQUIEREN_ATENCION,
        },

        atenciones: {
          none: {
            estado: {
              in:
                ESTADOS_ATENCION_ACTIVA,
            },
          },
        },
      },

      data: {
        estado:
          EstadoMesa.LIBRE,
      },
    });

    const mesas =
      await prisma.mesa.findMany({
        where: {
          activa: true,

          zona: {
            sucursalId,
          },
        },

        include: {
          zona: {
            select: {
              id: true,
              nombre: true,
            },
          },

          atenciones: {
            where: {
              estado: {
                in:
                  ESTADOS_ATENCION_ACTIVA,
              },
            },

            orderBy: {
              fechaApertura:
                "desc",
            },

            take: 1,

            include: {
              mozo: {
                select: {
                  id: true,
                  nombres: true,
                  apellidos: true,
                },
              },

              _count: {
                select: {
                  pedidos: true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            zona: {
              nombre: "asc",
            },
          },
          {
            numero: "asc",
          },
        ],
      });

    /*
     * Segunda protección visual:
     *
     * Aunque por alguna razón el update anterior no
     * haya afectado una fila, si no existe atención
     * activa jamás devolvemos un estado operativo
     * incoherente al frontend.
     */
    return mesas.map(
      (mesa) => {
        const tieneAtencionActiva =
          mesa.atenciones.length >
          0;

        const estadoNecesitaAtencion =
          ESTADOS_MESA_QUE_REQUIEREN_ATENCION.includes(
            mesa.estado
          );

        if (
          !tieneAtencionActiva &&
          estadoNecesitaAtencion
        ) {
          return {
            ...mesa,
            estado:
              EstadoMesa.LIBRE,
            atenciones: [],
          };
        }

        return mesa;
      }
    );
  }

  /*
   * =====================================================
   * OBTENER MESA
   * =====================================================
   */
  obtenerPorId(id: string) {
    return prisma.mesa.findUnique({
      where: {
        id,
      },

      include: {
        zona: {
          select: {
            id: true,
            nombre: true,
            sucursalId: true,
          },
        },
      },
    });
  }

  /*
   * =====================================================
   * ATENCIÓN ACTIVA
   * =====================================================
   */
  buscarAtencionActiva(
    mesaId: string
  ) {
    return prisma.atencion.findFirst({
      where: {
        mesaId,

        estado: {
          in:
            ESTADOS_ATENCION_ACTIVA,
        },
      },

      orderBy: {
        fechaApertura:
          "desc",
      },
    });
  }

  /*
   * =====================================================
   * ÚLTIMA ATENCIÓN
   * =====================================================
   */
  obtenerUltimaAtencion(
    sucursalId: string
  ) {
    return prisma.atencion.findFirst({
      where: {
        sucursalId,

        codigo: {
          startsWith:
            "AT-",
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },

      select: {
        codigo: true,
      },
    });
  }

  /*
   * =====================================================
   * ABRIR ATENCIÓN
   * =====================================================
   */
  async abrirAtencion(
    datos: CrearAtencionRepositorio
  ) {
    return prisma.$transaction(
      async (tx) => {
        /*
         * Validamos que la mesa realmente exista,
         * esté activa y pertenezca a la sucursal.
         */
        const mesa =
          await tx.mesa.findFirst({
            where: {
              id:
                datos.mesaId,

              activa:
                true,

              zona: {
                sucursalId:
                  datos.sucursalId,
              },
            },

            select: {
              id: true,
              estado: true,
              nombre: true,
            },
          });

        if (!mesa) {
          throw new Error(
            "MESA_NO_EXISTE"
          );
        }

        /*
         * La fuente de verdad para saber si una mesa
         * puede abrir otra atención es la existencia
         * de una atención activa, no un estado viejo
         * guardado en Mesa.
         */
        const atencionExistente =
          await tx.atencion.findFirst({
            where: {
              mesaId:
                datos.mesaId,

              estado: {
                in:
                  ESTADOS_ATENCION_ACTIVA,
              },
            },

            select: {
              id: true,
              codigo: true,
              estado: true,
            },
          });

        if (
          atencionExistente
        ) {
          throw new Error(
            "ATENCION_ACTIVA_EXISTENTE"
          );
        }

        /*
         * Si la mesa quedó con un estado viejo pero
         * no tiene atención activa, la normalizamos
         * antes de crear la nueva atención.
         *
         * LIMPIEZA se respeta porque puede ser un
         * estado físico real del restaurante.
         */
        if (
          ESTADOS_MESA_QUE_REQUIEREN_ATENCION.includes(
            mesa.estado
          )
        ) {
          await tx.mesa.update({
            where: {
              id:
                mesa.id,
            },

            data: {
              estado:
                EstadoMesa.LIBRE,
            },
          });
        }

        const atencion =
          await tx.atencion.create({
            data: {
              sucursalId:
                datos.sucursalId,

              mesaId:
                datos.mesaId,

              mozoId:
                datos.mozoId,

              codigo:
                datos.codigo,

              cantidadPersonas:
                datos.cantidadPersonas,

              metodoPagoPrevisto:
                datos.metodoPagoPrevisto,

              observacion:
                datos.observacion,

              estado:
                EstadoAtencion.ABIERTA,
            },

            include: {
              mesa: {
                select: {
                  id: true,
                  numero: true,
                  nombre: true,
                },
              },

              mozo: {
                select: {
                  id: true,
                  nombres: true,
                  apellidos: true,
                },
              },
            },
          });

        await tx.mesa.update({
          where: {
            id:
              datos.mesaId,
          },

          data: {
            estado:
              EstadoMesa.OCUPADA,
          },
        });

        return atencion;
      }
    );
  }
}

export const mesaRepository =
  new MesaRepository();