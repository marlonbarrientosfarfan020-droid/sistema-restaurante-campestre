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
import {
  fail,
  ok,
} from "@/lib/response";

/*
 * ============================================================
 * CÓDIGO ÚNICO DE ATENCIÓN
 * ============================================================
 */
function generarCodigoAtencion() {
  const ahora =
    new Date();

  const fecha = [
    ahora.getFullYear(),
    String(
      ahora.getMonth() + 1
    ).padStart(2, "0"),
    String(
      ahora.getDate()
    ).padStart(2, "0"),
  ].join("");

  const hora = [
    String(
      ahora.getHours()
    ).padStart(2, "0"),
    String(
      ahora.getMinutes()
    ).padStart(2, "0"),
    String(
      ahora.getSeconds()
    ).padStart(2, "0"),
    String(
      ahora.getMilliseconds()
    ).padStart(3, "0"),
  ].join("");

  const aleatorio =
    crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 6)
      .toUpperCase();

  return `AT-${fecha}-${hora}-${aleatorio}`;
}

/*
 * ============================================================
 * CÓDIGO DE ACCESO PARA LOS CLIENTES
 * ============================================================
 *
 * Ejemplo:
 * 4827
 *
 * Se comparte únicamente entre
 * las personas de la misma mesa.
 */
function generarCodigoAcceso() {
  const arreglo =
    new Uint32Array(1);

  crypto.getRandomValues(
    arreglo
  );

  const numero =
    1000 +
    (arreglo[0] % 9000);

  return String(numero);
}

/*
 * ============================================================
 * TOKEN SEGURO DE LA ATENCIÓN
 * ============================================================
 */
function generarTokenAcceso() {
  return [
    crypto.randomUUID(),
    crypto.randomUUID(),
  ]
    .join("")
    .replaceAll("-", "");
}

/*
 * ============================================================
 * ESTADOS QUE TODAVÍA OCUPAN LA MESA
 * ============================================================
 */
const ESTADOS_ACTIVOS: EstadoAtencion[] = [
  EstadoAtencion.ABIERTA,
  EstadoAtencion.SOLICITO_CUENTA,
  EstadoAtencion.PAGADA,
];

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Sirve para consultar el estado de una mesa.
 *
 * IMPORTANTE:
 *
 * Ya NO entregamos automáticamente la atención
 * de una mesa ocupada a cualquier celular.
 *
 * Si existe token válido:
 * → devolvemos la atención.
 *
 * Si no existe token válido:
 * → solo informamos que la mesa está ocupada.
 */
export async function GET(
  request: NextRequest
) {
  try {
    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const mesaId =
      searchParams
        .get("mesaId")
        ?.trim() ?? "";

    const token =
      searchParams
        .get("token")
        ?.trim() ?? "";

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

          estado: {
            in:
              ESTADOS_ACTIVOS,
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
                not:
                  "ANULADO",
              },
            },

            orderBy: {
              fechaPedido:
                "asc",
            },
          },
        },

        orderBy: {
          fechaApertura:
            "desc",
        },
      });

    /*
     * Mesa sin atención.
     */
    if (!atencion) {
      return NextResponse.json(
        ok(
          {
            ocupada:
              false,

            autorizado:
              false,

            requiereCodigo:
              false,

            atencion:
              null,
          },
          "La mesa se encuentra disponible."
        )
      );
    }

    /*
     * Existe atención.
     *
     * Validamos el token que posee
     * este navegador.
     */
    const autorizado =
      Boolean(
        token &&
          atencion.tokenAccesoMesa &&
          token ===
            atencion.tokenAccesoMesa
      );

    /*
     * Navegador autorizado.
     */
    if (autorizado) {
      const {
        tokenAccesoMesa:
          _tokenPrivado,

        codigoAccesoMesa:
          _codigoPrivado,

        ...atencionSegura
      } =
        atencion;

      return NextResponse.json(
        ok(
          {
            ocupada:
              true,

            autorizado:
              true,

            requiereCodigo:
              false,

            atencion:
              atencionSegura,
          },
          "Atención activa obtenida correctamente."
        )
      );
    }

    /*
     * Otro celular escaneó el QR.
     *
     * NO devolvemos:
     * - pedidos
     * - total
     * - atención
     * - código
     * - token
     */
    return NextResponse.json(
      ok(
        {
          ocupada:
            true,

          autorizado:
            false,

          requiereCodigo:
            atencion.estado ===
            EstadoAtencion.ABIERTA,

          atencion:
            null,

          mesa: {
            id:
              atencion.mesa.id,

            numero:
              atencion.mesa.numero,

            nombre:
              atencion.mesa.nombre,

            estado:
              atencion.mesa.estado,

            zona:
              atencion.mesa.zona,
          },

          estadoAtencion:
            atencion.estado,
        },
        "Esta mesa ya tiene una atención activa."
      )
    );
  } catch (error) {
    console.error(
      "Error obteniendo atención:",
      error
    );

    return NextResponse.json(
      fail(
        process.env.NODE_ENV ===
          "development"
          ? `Error obteniendo atención: ${
              error instanceof
              Error
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

/*
 * ============================================================
 * POST
 * ============================================================
 *
 * accion:
 *
 * ABRIR
 * → primera persona ocupa la mesa.
 *
 * UNIR
 * → otro teléfono entra usando
 *   el código de 4 dígitos.
 */
export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const accion =
      typeof body.accion ===
      "string"
        ? body.accion
            .trim()
            .toUpperCase()
        : "ABRIR";

    const mesaId =
      typeof body.mesaId ===
      "string"
        ? body.mesaId.trim()
        : "";

    const sucursalId =
      typeof body.sucursalId ===
      "string"
        ? body.sucursalId.trim()
        : "";

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

    /*
     * ========================================================
     * UNIRSE A UNA MESA OCUPADA
     * ========================================================
     */
    if (
      accion === "UNIR"
    ) {
      const codigoAcceso =
        typeof body.codigoAcceso ===
        "string"
          ? body.codigoAcceso
              .trim()
          : "";

      if (
        !/^\d{4}$/.test(
          codigoAcceso
        )
      ) {
        return NextResponse.json(
          fail(
            "Ingresa el código de acceso de 4 dígitos."
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

                zona: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
          },

          orderBy: {
            fechaApertura:
              "desc",
          },
        });

      if (!atencion) {
        return NextResponse.json(
          fail(
            "Esta mesa ya no tiene una atención abierta."
          ),
          {
            status: 409,
          }
        );
      }

      if (
        !atencion.codigoAccesoMesa ||
        atencion.codigoAccesoMesa !==
          codigoAcceso
      ) {
        return NextResponse.json(
          fail(
            "El código de acceso es incorrecto."
          ),
          {
            status: 403,
          }
        );
      }

      /*
       * Compatibilidad con atenciones creadas
       * antes de esta mejora.
       */
      let tokenAcceso =
        atencion.tokenAccesoMesa;

      if (!tokenAcceso) {
        tokenAcceso =
          generarTokenAcceso();

        await prisma.atencion.update({
          where: {
            id:
              atencion.id,
          },

          data: {
            tokenAccesoMesa:
              tokenAcceso,
          },
        });
      }

      const {
        tokenAccesoMesa:
          _tokenPrivado,

        codigoAccesoMesa:
          _codigoPrivado,

        ...atencionSegura
      } =
        atencion;

      return NextResponse.json(
        ok(
          {
            creada:
              false,

            unida:
              true,

            tokenAcceso,

            atencion:
              atencionSegura,
          },
          `Acceso autorizado a ${atencion.mesa.nombre}.`
        )
      );
    }

    /*
     * ========================================================
     * ABRIR NUEVA ATENCIÓN
     * ========================================================
     */
    if (
      accion !== "ABRIR"
    ) {
      return NextResponse.json(
        fail(
          "La acción solicitada no es válida."
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

    const cantidadPersonas =
      Number(
        body.cantidadPersonas ??
          1
      );

    const metodoPagoPrevisto =
      typeof body.metodoPagoPrevisto ===
      "string"
        ? body.metodoPagoPrevisto
            .trim()
        : "";

    const observacion =
      typeof body.observacion ===
      "string"
        ? body.observacion
            .trim()
        : undefined;

    if (
      !Number.isFinite(
        cantidadPersonas
      ) ||
      cantidadPersonas <=
        0 ||
      cantidadPersonas >
        50
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
      Boolean(
        metodoPagoPrevisto &&
          [
            "EFECTIVO",
            "YAPE",
            "PLIN",
            "TARJETA",
            "MIXTO",
          ].includes(
            metodoPagoPrevisto
          )
      );

    const codigoAcceso =
      generarCodigoAcceso();

    const tokenAcceso =
      generarTokenAcceso();

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const mesa =
            await tx.mesa.findFirst({
              where: {
                id:
                  mesaId,

                activa:
                  true,

                zona: {
                  sucursalId,
                },
              },

              select: {
                id: true,
                numero: true,
                nombre: true,
                capacidad: true,
                estado: true,
              },
            });

          if (!mesa) {
            throw new Error(
              "MESA_NO_EXISTE"
            );
          }

          /*
           * ==================================================
           * BLOQUEO REAL
           * ==================================================
           *
           * Ya NO reutilizamos una atención
           * automáticamente.
           *
           * Si hay una abierta:
           * otro celular debe usar UNIR.
           */
          const atencionExistente =
            await tx.atencion.findFirst({
              where: {
                mesaId,

                estado: {
                  in:
                    ESTADOS_ACTIVOS,
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
              "MESA_OCUPADA"
            );
          }

          const cantidadFinal =
            Math.max(
              1,
              Math.min(
                mesa.capacidad,
                cantidadPersonas
              )
            );

          const codigo =
            generarCodigoAtencion();

          const atencion =
            await tx.atencion.create({
              data: {
                sucursalId,
                mesaId,

                codigo,

                estado:
                  EstadoAtencion.ABIERTA,

                cantidadPersonas:
                  cantidadFinal,

                codigoAccesoMesa:
                  codigoAcceso,

                tokenAccesoMesa:
                  tokenAcceso,

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

                    zona: {
                      select: {
                        id: true,
                        nombre: true,
                      },
                    },
                  },
                },
              },
            });

          await tx.mesa.update({
            where: {
              id:
                mesaId,
            },

            data: {
              estado:
                EstadoMesa.OCUPADA,
            },
          });

          const {
            tokenAccesoMesa:
              _tokenPrivado,

            codigoAccesoMesa:
              _codigoPrivado,

            ...atencionSegura
          } =
            atencion;

          return {
            creada:
              true,

            unida:
              false,

            codigoAcceso,

            tokenAcceso,

            atencion:
              atencionSegura,
          };
        }
      );

    return NextResponse.json(
      ok(
        resultado,
        "Mesa ocupada y atención iniciada correctamente."
      ),
      {
        status: 201,
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
        "MESA_OCUPADA"
    ) {
      return NextResponse.json(
        fail(
          "Esta mesa ya está ocupada. Si perteneces a esta mesa, ingresa el código de acceso."
        ),
        {
          status: 409,
        }
      );
    }

    console.error(
      "Error procesando atención:",
      error
    );

    return NextResponse.json(
      fail(
        process.env.NODE_ENV ===
          "development"
          ? `Error procesando atención: ${
              error instanceof
              Error
                ? error.message
                : "Error desconocido"
            }`
          : "No se pudo procesar la atención."
      ),
      {
        status: 500,
      }
    );
  }
}