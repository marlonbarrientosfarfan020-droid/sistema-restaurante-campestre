import {
  EstadoAtencion,
  TipoComprobante,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type CrearNotaVentaRepositorio = {
  atencionId: string;

  clienteDocumento?: string;
  clienteNombre?: string;
  clienteDireccion?: string;
};

export class ComprobanteRepository {
  async obtenerAtencionParaNotaVenta(
    atencionId: string
  ) {
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
                ruc: true,
                direccion: true,
                telefono: true,
                correo: true,
                logoUrl: true,
              },
            },
          },
        },

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

        pedidos: {
          where: {
            estado: {
              not: "ANULADO",
            },
          },

          include: {
            detalles: {
              where: {
                estado: {
                  not: "ANULADO",
                },
              },

              include: {
                producto: {
                  select: {
                    id: true,
                    codigo: true,
                    nombre: true,
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

        comprobantes: {
          where: {
            tipo:
              TipoComprobante.NOTA_VENTA,
          },

          select: {
            id: true,
            numero: true,
            tipo: true,
          },
        },
      },
    });
  }

  obtenerUltimaNotaVenta(
    sucursalId: string,
    serie: string
  ) {
    return prisma.comprobante.findFirst({
      where: {
        sucursalId,
        tipo:
          TipoComprobante.NOTA_VENTA,
        serie,
      },

      orderBy: {
        correlativo: "desc",
      },

      select: {
        id: true,
        correlativo: true,
        numero: true,
      },
    });
  }

  async crearNotaVenta(
    datos: CrearNotaVentaRepositorio
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
              sucursalId: true,
              estado: true,
              subtotal: true,
              descuento: true,
              total: true,

              comprobantes: {
                where: {
                  tipo:
                    TipoComprobante.NOTA_VENTA,
                },

                select: {
                  id: true,
                  numero: true,
                },
              },
            },
          });

        if (!atencion) {
          throw new Error(
            "ATENCION_NO_EXISTE"
          );
        }

        const estadosValidosNotaVenta: EstadoAtencion[] = [
          EstadoAtencion.PAGADA,
          EstadoAtencion.CERRADA,
        ];

        if (
          !estadosValidosNotaVenta.includes(
            atencion.estado
          )
        ) {
          throw new Error(
            "ATENCION_NO_PAGADA"
          );
        }

        if (
          atencion.comprobantes.length >
          0
        ) {
          throw new Error(
            `NOTA_VENTA_YA_EXISTE|${atencion.comprobantes[0].numero}`
          );
        }

        const serie =
          "NV01";

        /*
         * Buscamos el último correlativo
         * dentro de la transacción.
         */
        const ultima =
          await tx.comprobante.findFirst({
            where: {
              sucursalId:
                atencion.sucursalId,

              tipo:
                TipoComprobante.NOTA_VENTA,

              serie,
            },

            orderBy: {
              correlativo:
                "desc",
            },

            select: {
              correlativo:
                true,
            },
          });

        const correlativo =
          (ultima?.correlativo ??
            0) + 1;

        const numero =
          `${serie}-${String(
            correlativo
          ).padStart(
            8,
            "0"
          )}`;

        /*
         * Nota de venta interna:
         * no calculamos IGV separado.
         */
        return tx.comprobante.create({
          data: {
            sucursalId:
              atencion.sucursalId,

            atencionId:
              atencion.id,

            tipo:
              TipoComprobante.NOTA_VENTA,

            serie,

            correlativo,

            numero,

            clienteDocumento:
              datos.clienteDocumento,

            clienteNombre:
              datos.clienteNombre,

            clienteDireccion:
              datos.clienteDireccion,

            subtotal:
              atencion.subtotal,

            igv:
              0,

            total:
              atencion.total,

            emitido:
              true,
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
                    ruc: true,
                    direccion: true,
                    telefono: true,
                    correo: true,
                    logoUrl: true,
                  },
                },
              },
            },

            atencion: {
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

                pedidos: {
                  where: {
                    estado: {
                      not:
                        "ANULADO",
                    },
                  },

                  include: {
                    detalles: {
                      where: {
                        estado: {
                          not:
                            "ANULADO",
                        },
                      },

                      include: {
                        producto: {
                          select: {
                            id: true,
                            codigo: true,
                            nombre: true,
                          },
                        },
                      },

                      orderBy: {
                        createdAt:
                          "asc",
                      },
                    },
                  },

                  orderBy: {
                    fechaPedido:
                      "asc",
                  },
                },

                pagos: {
                  orderBy: {
                    fechaPago:
                      "asc",
                  },
                },
              },
            },
          },
        });
      }
    );
  }

  listarNotasVenta() {
    return prisma.comprobante.findMany({
      where: {
        tipo:
          TipoComprobante.NOTA_VENTA,
        emitido: true,
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
                ruc: true,
              },
            },
          },
        },

        atencion: {
          select: {
            id: true,
            codigo: true,
            fechaPago: true,

            mesa: {
              select: {
                id: true,
                numero: true,
                nombre: true,

                zona: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        fechaEmision: "desc",
      },
    });
  }

  obtenerNotaVenta(
    id: string
  ) {
    return prisma.comprobante.findFirst({
      where: {
        id,

        tipo:
          TipoComprobante.NOTA_VENTA,
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
                ruc: true,
                direccion: true,
                telefono: true,
                correo: true,
                logoUrl: true,
              },
            },
          },
        },

        atencion: {
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

            pedidos: {
              where: {
                estado: {
                  not: "ANULADO",
                },
              },

              include: {
                detalles: {
                  where: {
                    estado: {
                      not:
                        "ANULADO",
                    },
                  },

                  include: {
                    producto: {
                      select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                      },
                    },
                  },

                  orderBy: {
                    createdAt:
                      "asc",
                  },
                },
              },

              orderBy: {
                fechaPedido:
                  "asc",
              },
            },

            pagos: {
              orderBy: {
                fechaPago:
                  "asc",
              },
            },
          },
        },
      },
    });
  }
}

export const comprobanteRepository =
  new ComprobanteRepository();