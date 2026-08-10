import {
  EstadoPedido,
  OrigenPedido,
} from "@/app/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { generarCodigo } from "@/lib/utils";
import { pedidoRepository } from "@/repositories/pedido.repository";

import type {
  CrearPedidoDTO,
} from "@/types/pedido";

/*
 * ============================================================
 * FLUJO OPERATIVO SIMPLIFICADO
 * ============================================================
 *
 * CLIENTE QR
 *
 * PENDIENTE_CONFIRMACION
 *        ↓
 * RECIBIDO
 *        ↓
 * PREPARANDO
 *        ↓
 * ENTREGADO
 *
 *
 * PEDIDO DEL MOZO
 *
 * RECIBIDO
 *    ↓
 * PREPARANDO
 *    ↓
 * ENTREGADO
 *
 * ============================================================
 */

type EstadoOperacion =
  | "RECIBIDO"
  | "PREPARANDO"
  | "ENTREGADO";

const TRANSICIONES_OPERACION: Record<
  EstadoOperacion,
  EstadoPedido
> = {
  RECIBIDO:
    EstadoPedido.RECIBIDO,

  PREPARANDO:
    EstadoPedido.PREPARANDO,

  ENTREGADO:
    EstadoPedido.ENTREGADO,
};

/*
 * ============================================================
 * COMPATIBILIDAD CON FLUJO ANTIGUO
 * ============================================================
 *
 * Lo dejamos temporalmente porque podemos
 * tener pedidos antiguos en:
 *
 * LISTO
 * EN_ENTREGA
 *
 * Así todavía podremos cerrarlos correctamente.
 */
const TRANSICIONES_ENTREGA: Record<
  "EN_ENTREGA" | "ENTREGADO",
  EstadoPedido
> = {
  EN_ENTREGA:
    EstadoPedido.EN_ENTREGA,

  ENTREGADO:
    EstadoPedido.ENTREGADO,
};

function manejarErrorEstadoPedido(
  error: unknown
): never {
  if (
    error instanceof Error &&
    error.message ===
      "PEDIDO_NO_EXISTE"
  ) {
    throw new AppError(
      "El pedido no fue encontrado.",
      404
    );
  }

  if (
    error instanceof Error &&
    error.message ===
      "TRANSICION_ESTADO_INVALIDA"
  ) {
    throw new AppError(
      "No se puede realizar ese cambio desde el estado actual del pedido.",
      409
    );
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "STOCK_INSUFICIENTE|"
    )
  ) {
    const [
      ,
      nombre,
      solicitado,
      disponible,
    ] =
      error.message.split(
        "|"
      );

    throw new AppError(
      `No se puede confirmar el pedido. Stock insuficiente para ${nombre}. Disponible: ${disponible}. Solicitado: ${solicitado}.`,
      409
    );
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "PRODUCTO_NO_DISPONIBLE|"
    )
  ) {
    const [
      ,
      producto,
    ] =
      error.message.split(
        "|"
      );

    throw new AppError(
      `No se puede confirmar el pedido porque ${producto} ya no está disponible.`,
      409
    );
  }

  throw error;
}

export class PedidoService {
  /*
   * ==========================================================
   * CREAR PEDIDO
   * ==========================================================
   */
  async crear(
    datos: CrearPedidoDTO
  ) {
    const atencionId =
      datos.atencionId?.trim();

    const sucursalId =
      datos.sucursalId?.trim();

    const registradoPorId =
      datos.registradoPorId?.trim() ||
      undefined;

    if (!atencionId) {
      throw new AppError(
        "La atención es obligatoria.",
        400
      );
    }

    if (!sucursalId) {
      throw new AppError(
        "La sucursal es obligatoria.",
        400
      );
    }

    if (
      !Array.isArray(
        datos.detalles
      ) ||
      datos.detalles.length === 0
    ) {
      throw new AppError(
        "El pedido debe contener al menos un producto.",
        400
      );
    }

    const origen =
      datos.origen;

    if (
      ![
        "CLIENTE_QR",
        "MOZO",
        "CAJA",
      ].includes(origen)
    ) {
      throw new AppError(
        "El origen del pedido no es válido.",
        400
      );
    }

    /*
     * La atención debe seguir ABIERTA.
     *
     * Esto permite:
     *
     * Pedido 1
     * Pedido 2
     * Pedido 3
     *
     * todos dentro de la misma mesa
     * y la misma atención.
     */
    const atencion =
      await pedidoRepository.obtenerAtencionActiva(
        atencionId,
        sucursalId
      );

    if (!atencion) {
      throw new AppError(
        "La atención no existe o ya no se encuentra abierta.",
        409
      );
    }

    /*
     * ========================================================
     * VALIDAR PRODUCTOS
     * ========================================================
     */
    const productoIds =
      Array.from(
        new Set(
          datos.detalles.map(
            (detalle) =>
              detalle.productoId?.trim()
          )
        )
      ).filter(
        Boolean
      ) as string[];

    if (
      productoIds.length !==
      datos.detalles.length
    ) {
      throw new AppError(
        "Todos los productos del pedido deben tener un identificador válido.",
        400
      );
    }

    const productos =
      await pedidoRepository.obtenerProductos(
        sucursalId,
        productoIds
      );

    if (
      productos.length !==
      productoIds.length
    ) {
      throw new AppError(
        "Uno o más productos no existen, están inactivos o agotados.",
        400
      );
    }

    /*
     * ========================================================
     * VALIDAR STOCK ACTUAL
     * ========================================================
     *
     * Esta validación mejora el mensaje al usuario.
     * La validación definitiva se vuelve a realizar dentro
     * de la transacción del repository para evitar sobreventa.
     */
    const productosPorId =
      new Map(
        productos.map(
          (producto) => [
            producto.id,
            producto,
          ]
        )
      );

    /*
     * ========================================================
     * CALCULAR DETALLES
     * ========================================================
     */
    const detallesValidados =
      datos.detalles.map(
        (detalle) => {
          const cantidad =
            Number(
              detalle.cantidad
            );

          if (
            !Number.isFinite(
              cantidad
            ) ||
            cantidad <= 0 ||
            cantidad > 100
          ) {
            throw new AppError(
              "La cantidad de cada producto debe ser mayor que cero y no superar 100.",
              400
            );
          }

          const producto =
            productosPorId.get(
              detalle.productoId
            );

          if (!producto) {
            throw new AppError(
              "Producto no disponible.",
              400
            );
          }

          if (
            producto.controlaStock &&
            cantidad >
              Number(
                producto.stockActual
              )
          ) {
            throw new AppError(
              `Stock insuficiente para ${producto.nombre}. Disponible: ${Number(
                producto.stockActual
              )}. Solicitado: ${cantidad}.`,
              409
            );
          }

          const precioUnitario =
            Number(
              producto.precioVenta
            );

          const subtotal =
            Math.round(
              cantidad *
                precioUnitario *
                100
            ) / 100;

          return {
            productoId:
              producto.id,

            cantidad,

            precioUnitario,

            subtotal,

            observacion:
              detalle.observacion
                ?.trim() ||
              undefined,
          };
        }
      );

    /*
     * ========================================================
     * TOTAL DEL PEDIDO
     * ========================================================
     */
    const subtotal =
      Math.round(
        detallesValidados.reduce(
          (
            total,
            detalle
          ) =>
            total +
            detalle.subtotal,
          0
        ) * 100
      ) / 100;

    /*
     * ========================================================
     * GENERAR NÚMERO DE PEDIDO
     * ========================================================
     */
    const ultimoPedido =
      await pedidoRepository.obtenerUltimoPedido(
        sucursalId
      );

    const ultimoNumero =
      ultimoPedido
        ? Number(
            ultimoPedido.numero.replace(
              "PED-",
              ""
            )
          )
        : 0;

    const siguienteNumero =
      Number.isFinite(
        ultimoNumero
      )
        ? ultimoNumero + 1
        : 1;

    const numero =
      generarCodigo(
        "PED",
        siguienteNumero
      );

    /*
     * ========================================================
     * CREAR
     * ========================================================
     *
     * El repository decide:
     *
     * CLIENTE_QR
     * → PENDIENTE_CONFIRMACION
     *
     * MOZO
     * → RECIBIDO
     */
    try {
      return await pedidoRepository.crear(
        {
          sucursalId,

          atencionId,

          registradoPorId,

          numero,

          origen:
            OrigenPedido[
              origen as keyof typeof OrigenPedido
            ],

          observacion:
            datos.observacion
              ?.trim() ||
            undefined,

          subtotal,

          detalles:
            detallesValidados,
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "ATENCION_NO_DISPONIBLE"
      ) {
        throw new AppError(
          "La atención ya no está disponible para recibir pedidos.",
          409
        );
      }

      if (
        error instanceof Error &&
        error.message.startsWith(
          "STOCK_INSUFICIENTE|"
        )
      ) {
        const [
          ,
          nombre,
          solicitado,
          disponible,
        ] =
          error.message.split(
            "|"
          );

        throw new AppError(
          `Stock insuficiente para ${nombre}. Disponible: ${disponible}. Solicitado: ${solicitado}.`,
          409
        );
      }

      if (
        error instanceof Error &&
        error.message.startsWith(
          "PRODUCTO_NO_DISPONIBLE|"
        )
      ) {
        const [
          ,
          producto,
        ] =
          error.message.split(
            "|"
          );

        throw new AppError(
          `El producto ${producto} ya no se encuentra disponible.`,
          409
        );
      }

      throw error;
    }
  }

  /*
   * ==========================================================
   * LISTAR PEDIDOS POR ATENCIÓN
   * ==========================================================
   */
  async listarPorAtencion(
    atencionId: string
  ) {
    const id =
      atencionId?.trim();

    if (!id) {
      throw new AppError(
        "La atención es obligatoria.",
        400
      );
    }

    return pedidoRepository.listarPorAtencion(
      id
    );
  }

  /*
   * ==========================================================
   * COCINA
   * ==========================================================
   */
  async listarParaCocina() {
    return pedidoRepository.listarParaCocina();
  }

  /*
   * ==========================================================
   * ENTREGAS ANTIGUAS
   * ==========================================================
   *
   * Temporalmente mantenemos esto para
   * pedidos existentes en LISTO o EN_ENTREGA.
   */
  async listarParaEntrega() {
    return pedidoRepository.listarParaEntrega();
  }

  /*
   * ==========================================================
   * CAMBIAR ESTADO OPERATIVO
   * ==========================================================
   *
   * Esta función ahora sirve tanto para:
   *
   * MOZO:
   * PENDIENTE_CONFIRMACION
   * → RECIBIDO
   *
   * COCINA:
   * RECIBIDO
   * → PREPARANDO
   *
   * COCINA:
   * PREPARANDO
   * → ENTREGADO
   */
  async cambiarEstadoCocina(
    pedidoId: string,
    nuevoEstado: string
  ) {
    const id =
      pedidoId?.trim();

    const estado =
      nuevoEstado?.trim() as EstadoOperacion;

    if (!id) {
      throw new AppError(
        "El pedido es obligatorio.",
        400
      );
    }

    if (
      ![
        "RECIBIDO",
        "PREPARANDO",
        "ENTREGADO",
      ].includes(estado)
    ) {
      throw new AppError(
        "El estado solicitado no es válido para el pedido.",
        400
      );
    }

    try {
      return await pedidoRepository.actualizarEstado(
        id,
        TRANSICIONES_OPERACION[
          estado
        ]
      );
    } catch (error) {
      manejarErrorEstadoPedido(
        error
      );
    }
  }

  /*
   * ==========================================================
   * COMPATIBILIDAD DE ENTREGA
   * ==========================================================
   *
   * Esta función permanece mientras haya
   * registros antiguos que utilicen:
   *
   * LISTO
   * EN_ENTREGA
   *
   * Más adelante podemos retirar completamente
   * el módulo antiguo de Entregas.
   */
  async cambiarEstadoEntrega(
    pedidoId: string,
    nuevoEstado: string,
    usuarioId?: string
  ) {
    const id =
      pedidoId?.trim();

    const estado =
      nuevoEstado?.trim() as
        | "EN_ENTREGA"
        | "ENTREGADO";

    const mozoId =
      usuarioId?.trim() ||
      undefined;

    if (!id) {
      throw new AppError(
        "El pedido es obligatorio.",
        400
      );
    }

    if (
      ![
        "EN_ENTREGA",
        "ENTREGADO",
      ].includes(estado)
    ) {
      throw new AppError(
        "El estado solicitado no es válido para la entrega.",
        400
      );
    }

    try {
      return await pedidoRepository.actualizarEstado(
        id,
        TRANSICIONES_ENTREGA[
          estado
        ],
        mozoId
      );
    } catch (error) {
      manejarErrorEstadoPedido(
        error
      );
    }
  }
}

export const pedidoService =
  new PedidoService();