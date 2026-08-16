import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  EstadoPedido,
  OrigenPedido,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import {
  fail,
  ok,
} from "@/lib/response";
import {
  SESSION_COOKIE,
  verificarTokenSesion,
} from "@/lib/session";
import { pedidoService } from "@/services/pedido.service";

const ROLES_PERMITIDOS = new Set([
  "MOZO",
  "SUPERADMIN",
  "ADMINISTRADOR",
  "GERENTE",
]);

async function obtenerSesion() {
  const store =
    await cookies();

  const token =
    store.get(
      SESSION_COOKIE
    )?.value;

  if (!token) {
    return null;
  }

  return verificarTokenSesion(
    token
  );
}

function manejarError(
  error: unknown
) {
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

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Se conserva para no romper la bandeja
 * actual de pedidos QR pendientes.
 */
export async function GET() {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        fail(
          "Sesión no válida."
        ),
        {
          status: 401,
        }
      );
    }

    const pedidos =
      await prisma.pedido.findMany({
        where: {
          sucursalId:
            sesion.sucursalId,

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
              createdAt:
                "asc",
            },
          },
        },

        orderBy: {
          fechaPedido:
            "asc",
        },
      });

    const data =
      pedidos.map(
        (pedido) => ({
          id:
            pedido.id,

          numero:
            pedido.numero,

          estado:
            pedido.estado,

          origen:
            pedido.origen,

          observacion:
            pedido.observacion,

          subtotal:
            Number(
              pedido.subtotal
            ),

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
                id:
                  detalle.id,

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
    return manejarError(
      error
    );
  }
}

/*
 * ============================================================
 * POST
 * ============================================================
 *
 * Pedido registrado por un trabajador.
 *
 * IMPORTANTE:
 * registradoPorId y sucursalId salen
 * de la sesión, no del navegador.
 */
export async function POST(
  request: NextRequest
) {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        fail(
          "Tu sesión expiró. Inicia sesión nuevamente."
        ),
        {
          status: 401,
        }
      );
    }

    if (
      !ROLES_PERMITIDOS.has(
        sesion.rol
      )
    ) {
      return NextResponse.json(
        fail(
          "No tienes permiso para registrar pedidos como mozo."
        ),
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const atencionId =
      typeof body.atencionId ===
      "string"
        ? body.atencionId.trim()
        : "";

    if (!atencionId) {
      return NextResponse.json(
        fail(
          "La atención es obligatoria."
        ),
        {
          status: 400,
        }
      );
    }

    const atencion =
      await prisma.atencion.findFirst({
        where: {
          id:
            atencionId,

          sucursalId:
            sesion.sucursalId,

          estado: {
            in: [
              "ABIERTA",
            ],
          },
        },

        select: {
          id: true,
          mesaId: true,
          estado: true,
        },
      });

    if (!atencion) {
      return NextResponse.json(
        fail(
          "La atención no está disponible para registrar pedidos."
        ),
        {
          status: 409,
        }
      );
    }

    const pedido =
      await pedidoService.crear({
        atencionId,
        sucursalId:
          sesion.sucursalId,

        registradoPorId:
          sesion.sub,

        origen:
          "MOZO",

        observacion:
          typeof body.observacion ===
          "string"
            ? body.observacion
            : undefined,

        detalles:
          Array.isArray(
            body.detalles
          )
            ? body.detalles.map(
                (
                  detalle: {
                    productoId?: string;
                    cantidad?: number;
                    observacion?: string;
                  }
                ) => ({
                  productoId:
                    typeof detalle.productoId ===
                    "string"
                      ? detalle.productoId
                      : "",

                  cantidad:
                    Number(
                      detalle.cantidad ??
                        0
                    ),

                  observacion:
                    typeof detalle.observacion ===
                    "string"
                      ? detalle.observacion
                      : undefined,
                })
              )
            : [],
      });

    return NextResponse.json(
      ok(
        pedido,
        "Pedido enviado correctamente a Cocina."
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    return manejarError(
      error
    );
  }
}

/*
 * ============================================================
 * PATCH
 * ============================================================
 *
 * Se conserva la confirmación manual
 * de pedidos QR mientras terminamos de
 * decidir si se automatiza por completo.
 */
export async function PATCH(
  request: NextRequest
) {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        fail(
          "Sesión no válida."
        ),
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const pedidoId =
      typeof body.id ===
      "string"
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
      await prisma.pedido.findFirst({
        where: {
          id:
            pedidoId,

          sucursalId:
            sesion.sucursalId,
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
          "Este pedido ya fue confirmado o cambió de estado."
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
        "Pedido confirmado. Ya fue enviado a Cocina."
      )
    );
  } catch (error) {
    return manejarError(
      error
    );
  }
}
