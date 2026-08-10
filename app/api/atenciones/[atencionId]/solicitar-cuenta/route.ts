import {
  NextResponse,
} from "next/server";

import {
  EstadoAtencion,
  EstadoMesa,
  EstadoPedido,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import {
  fail,
  ok,
} from "@/lib/response";

type ContextoRuta = {
  params: Promise<{
    atencionId: string;
  }>;
};

export async function PATCH(
  _request: Request,
  contexto: ContextoRuta
) {
  try {
    const {
      atencionId,
    } = await contexto.params;

    const id =
      atencionId?.trim();

    if (!id) {
      return NextResponse.json(
        fail(
          "La atención es obligatoria."
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
                id,
              },

              select: {
                id: true,
                codigo: true,
                estado: true,
                mesaId: true,
                total: true,

                mesa: {
                  select: {
                    id: true,
                    nombre: true,
                    estado: true,
                  },
                },

                pedidos: {
                  where: {
                    estado: {
                      notIn: [
                        EstadoPedido.ENTREGADO,
                        EstadoPedido.ANULADO,
                      ],
                    },
                  },

                  select: {
                    id: true,
                    numero: true,
                    estado: true,
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
           * Solo una atención abierta puede
           * solicitar cuenta.
           */
          if (
            atencion.estado ===
            EstadoAtencion.SOLICITO_CUENTA
          ) {
            throw new Error(
              "CUENTA_YA_SOLICITADA"
            );
          }

          if (
            atencion.estado ===
              EstadoAtencion.PAGADA ||
            atencion.estado ===
              EstadoAtencion.CERRADA
          ) {
            throw new Error(
              "ATENCION_CERRADA"
            );
          }

          /*
           * No dejamos pedir la cuenta si
           * todavía existen pedidos:
           *
           * PENDIENTE_CONFIRMACION
           * RECIBIDO
           * PREPARANDO
           */
          if (
            atencion.pedidos.length >
            0
          ) {
            throw new Error(
              "PEDIDOS_PENDIENTES"
            );
          }

          const ahora =
            new Date();

          await tx.atencion.update({
            where: {
              id:
                atencion.id,
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
              id:
                atencion.mesaId,
            },

            data: {
              estado:
                EstadoMesa.SOLICITO_CUENTA,
            },
          });

          return {
            id:
              atencion.id,

            codigo:
              atencion.codigo,

            mesaId:
              atencion.mesaId,

            mesa:
              atencion.mesa.nombre,

            estado:
              EstadoAtencion.SOLICITO_CUENTA,

            total:
              Number(
                atencion.total
              ),

            fechaSolicitudCuenta:
              ahora.toISOString(),
          };
        }
      );

    return NextResponse.json(
      ok(
        resultado,
        "Cuenta solicitada correctamente. Caja fue notificada."
      )
    );
  } catch (error) {
    console.error(
      "Error solicitando cuenta:",
      error
    );

    if (
      error instanceof Error
    ) {
      if (
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
        error.message ===
        "CUENTA_YA_SOLICITADA"
      ) {
        return NextResponse.json(
          fail(
            "La cuenta ya fue solicitada."
          ),
          {
            status: 409,
          }
        );
      }

      if (
        error.message ===
        "ATENCION_CERRADA"
      ) {
        return NextResponse.json(
          fail(
            "La atención ya fue pagada o cerrada."
          ),
          {
            status: 409,
          }
        );
      }

      if (
        error.message ===
        "PEDIDOS_PENDIENTES"
      ) {
        return NextResponse.json(
          fail(
            "Todavía existen pedidos pendientes de preparar o entregar."
          ),
          {
            status: 409,
          }
        );
      }
    }

    return NextResponse.json(
      fail(
        process.env.NODE_ENV ===
          "development"
          ? `Error solicitando cuenta: ${
              error instanceof Error
                ? error.message
                : "Error desconocido"
            }`
          : "Ocurrió un error solicitando la cuenta."
      ),
      {
        status: 500,
      }
    );
  }
}