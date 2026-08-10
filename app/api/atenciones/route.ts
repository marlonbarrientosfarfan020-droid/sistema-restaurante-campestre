import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  EstadoAtencion,
  EstadoMesa,
  MetodoPago,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";

function generarCodigoAtencion(
  numero: number
) {
  return `AT-${String(numero).padStart(
    6,
    "0"
  )}`;
}

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const mesaId =
      searchParams.get("mesaId")?.trim() ??
      "";

    if (!mesaId) {
      return NextResponse.json(
        fail(
          "El identificador de la mesa es obligatorio."
        ),
        {
          status: 400,
        }
      );
    }

    const atencion =
      await prisma.atencion.findFirst({
        where: {
          mesaId,
          estado: EstadoAtencion.ABIERTA,
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

                  sucursal: {
                    select: {
                      id: true,
                      nombre: true,
                    },
                  },
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

            orderBy: {
              fechaPedido: "asc",
            },
          },
        },

        orderBy: {
          fechaApertura: "desc",
        },
      });

    return NextResponse.json(
      ok(
        atencion,
        atencion
          ? "Atención activa obtenida correctamente."
          : "La mesa no tiene una atención activa."
      )
    );
  } catch (error) {
    console.error(
      "Error obteniendo atención:",
      error
    );

    return NextResponse.json(
      fail(
        process.env.NODE_ENV === "development"
          ? `Error obteniendo atención: ${
              error instanceof Error
                ? error.message
                : "Error desconocido"
            }`
          : "No se pudo obtener la atención."
      ),
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const mesaId =
      typeof body.mesaId === "string"
        ? body.mesaId.trim()
        : "";

    const sucursalId =
      typeof body.sucursalId === "string"
        ? body.sucursalId.trim()
        : "";

    const cantidadPersonas =
      Number(body.cantidadPersonas ?? 1);

    const metodoPagoPrevisto =
      typeof body.metodoPagoPrevisto ===
      "string"
        ? body.metodoPagoPrevisto.trim()
        : "";

    const observacion =
      typeof body.observacion === "string"
        ? body.observacion.trim()
        : undefined;

    if (!mesaId) {
      return NextResponse.json(
        fail(
          "La mesa es obligatoria."
        ),
        {
          status: 400,
        }
      );
    }

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

    if (
      !Number.isFinite(
        cantidadPersonas
      ) ||
      cantidadPersonas <= 0 ||
      cantidadPersonas > 50
    ) {
      return NextResponse.json(
        fail(
          "La cantidad de personas no es válida."
        ),
        {
          status: 400,
        }
      );
    }

    const metodoValido =
      metodoPagoPrevisto &&
      [
        "EFECTIVO",
        "YAPE",
        "PLIN",
        "TARJETA",
        "MIXTO",
      ].includes(
        metodoPagoPrevisto
      );

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const mesa =
            await tx.mesa.findFirst({
              where: {
                id: mesaId,
                activa: true,

                zona: {
                  sucursalId,
                },
              },

              select: {
                id: true,
                numero: true,
                nombre: true,
                estado: true,
              },
            });

          if (!mesa) {
            throw new Error(
              "MESA_NO_EXISTE"
            );
          }

          /*
           * Muy importante para QR:
           *
           * Si la mesa ya tiene una atención
           * ABIERTA, reutilizamos esa misma.
           *
           * Esto permite que el cliente haga:
           *
           * pedido inicial
           * + bebida 20 min después
           * + postre después
           *
           * y todo quede en una sola cuenta.
           */
          const atencionExistente =
            await tx.atencion.findFirst({
              where: {
                mesaId,
                sucursalId,
                estado:
                  EstadoAtencion.ABIERTA,
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

              orderBy: {
                fechaApertura: "desc",
              },
            });

          if (atencionExistente) {
            return {
              creada: false,
              atencion:
                atencionExistente,
            };
          }

          /*
           * Si existe una atención que ya
           * solicitó cuenta o fue pagada,
           * no dejamos abrir otra hasta que
           * la anterior se cierre/libere.
           */
          const atencionPendiente =
            await tx.atencion.findFirst({
              where: {
                mesaId,
                estado: {
                  in: [
                    EstadoAtencion.SOLICITO_CUENTA,
                    EstadoAtencion.PAGADA,
                  ],
                },
              },

              select: {
                id: true,
                codigo: true,
                estado: true,
              },
            });

          if (atencionPendiente) {
            throw new Error(
              "MESA_CON_CUENTA_PENDIENTE"
            );
          }

          const ultimo =
            await tx.atencion.findFirst({
              where: {
                sucursalId,
                codigo: {
                  startsWith: "AT-",
                },
              },

              orderBy: {
                codigo: "desc",
              },

              select: {
                codigo: true,
              },
            });

          const ultimoNumero =
            ultimo
              ? Number(
                  ultimo.codigo.replace(
                    "AT-",
                    ""
                  )
                )
              : 0;

          const codigo =
            generarCodigoAtencion(
              Number.isFinite(
                ultimoNumero
              )
                ? ultimoNumero + 1
                : 1
            );

          const atencion =
            await tx.atencion.create({
              data: {
                sucursalId,
                mesaId,

                codigo,

                estado:
                  EstadoAtencion.ABIERTA,

                cantidadPersonas,

                metodoPagoPrevisto:
                  metodoValido
                    ? MetodoPago[
                        metodoPagoPrevisto as keyof typeof MetodoPago
                      ]
                    : null,

                observacion,

                subtotal: 0,
                descuento: 0,
                total: 0,
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

          /*
           * Abrir atención significa que la
           * mesa deja de estar LIBRE.
           */
          await tx.mesa.update({
            where: {
              id: mesaId,
            },

            data: {
              estado:
                EstadoMesa.OCUPADA,
            },
          });

          return {
            creada: true,
            atencion,
          };
        }
      );

    return NextResponse.json(
      ok(
        resultado,
        resultado.creada
          ? "Atención creada correctamente."
          : "Se reutilizó la atención activa de la mesa."
      ),
      {
        status:
          resultado.creada
            ? 201
            : 200,
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "MESA_NO_EXISTE"
    ) {
      return NextResponse.json(
        fail(
          "La mesa no existe o no pertenece a la sucursal."
        ),
        {
          status: 404,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "MESA_CON_CUENTA_PENDIENTE"
    ) {
      return NextResponse.json(
        fail(
          "Esta mesa ya tiene una cuenta solicitada o pagada pendiente de cierre."
        ),
        {
          status: 409,
        }
      );
    }

    console.error(
      "Error creando atención:",
      error
    );

    return NextResponse.json(
      fail(
        process.env.NODE_ENV ===
          "development"
          ? `Error creando atención: ${
              error instanceof Error
                ? error.message
                : "Error desconocido"
            }`
          : "No se pudo crear la atención."
      ),
      {
        status: 500,
      }
    );
  }
}