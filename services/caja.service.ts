import {
  MetodoPago,
} from "@/app/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { cajaRepository } from "@/repositories/caja.repository";

type RegistrarPagoDTO = {
  atencionId: string;
  metodo: string;
  monto?: number;
  montoRecibido?: number;
  referencia?: string;
  observacion?: string;
};

export class CajaService {
  async listarCuentasPendientes() {
    const cuentas =
      await cajaRepository.listarCuentasPendientes();

    return cuentas.map((cuenta) => ({
      id: cuenta.id,
      codigo: cuenta.codigo,
      estado: cuenta.estado,

      subtotal: Number(
        cuenta.subtotal
      ),

      descuento: Number(
        cuenta.descuento
      ),

      total: Number(
        cuenta.total
      ),

      metodoPagoPrevisto:
        cuenta.metodoPagoPrevisto,

      fechaApertura:
        cuenta.fechaApertura.toISOString(),

      fechaSolicitudCuenta:
        cuenta.fechaSolicitudCuenta
          ?.toISOString() ?? null,

      mesa: cuenta.mesa,

      mozo: cuenta.mozo,

      pedidos: cuenta.pedidos.map(
        (pedido) => ({
          id: pedido.id,
          numero: pedido.numero,
          estado: pedido.estado,
          subtotal: Number(
            pedido.subtotal
          ),

          fechaPedido:
            pedido.fechaPedido.toISOString(),

          detalles:
            pedido.detalles.map(
              (detalle) => ({
                id: detalle.id,

                cantidad: Number(
                  detalle.cantidad
                ),

                precioUnitario:
                  Number(
                    detalle.precioUnitario
                  ),

                subtotal: Number(
                  detalle.subtotal
                ),

                observacion:
                  detalle.observacion,

                producto:
                  detalle.producto,
              })
            ),
        })
      ),

      pagos: cuenta.pagos.map(
        (pago) => ({
          id: pago.id,
          metodo: pago.metodo,
          monto: Number(
            pago.monto
          ),

          montoRecibido:
            pago.montoRecibido ===
            null
              ? null
              : Number(
                  pago.montoRecibido
                ),

          vuelto:
            pago.vuelto === null
              ? null
              : Number(
                  pago.vuelto
                ),

          referencia:
            pago.referencia,

          fechaPago:
            pago.fechaPago.toISOString(),
        })
      ),
    }));
  }

  async obtenerCuenta(
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

    const cuenta =
      await cajaRepository.obtenerCuenta(
        id
      );

    if (!cuenta) {
      throw new AppError(
        "La cuenta no fue encontrada.",
        404
      );
    }

    return {
      id: cuenta.id,
      codigo: cuenta.codigo,
      estado: cuenta.estado,

      subtotal: Number(
        cuenta.subtotal
      ),

      descuento: Number(
        cuenta.descuento
      ),

      total: Number(
        cuenta.total
      ),

      metodoPagoPrevisto:
        cuenta.metodoPagoPrevisto,

      fechaApertura:
        cuenta.fechaApertura.toISOString(),

      fechaSolicitudCuenta:
        cuenta.fechaSolicitudCuenta
          ?.toISOString() ?? null,

      fechaPago:
        cuenta.fechaPago
          ?.toISOString() ?? null,

      sucursal: cuenta.sucursal,
      mesa: cuenta.mesa,
      mozo: cuenta.mozo,

      pedidos: cuenta.pedidos.map(
        (pedido) => ({
          id: pedido.id,
          numero: pedido.numero,
          estado: pedido.estado,
          subtotal: Number(
            pedido.subtotal
          ),

          fechaPedido:
            pedido.fechaPedido.toISOString(),

          detalles:
            pedido.detalles.map(
              (detalle) => ({
                id: detalle.id,

                cantidad: Number(
                  detalle.cantidad
                ),

                precioUnitario:
                  Number(
                    detalle.precioUnitario
                  ),

                subtotal: Number(
                  detalle.subtotal
                ),

                observacion:
                  detalle.observacion,

                producto:
                  detalle.producto,
              })
            ),
        })
      ),

      pagos: cuenta.pagos.map(
        (pago) => ({
          id: pago.id,

          metodo:
            pago.metodo,

          monto: Number(
            pago.monto
          ),

          montoRecibido:
            pago.montoRecibido ===
            null
              ? null
              : Number(
                  pago.montoRecibido
                ),

          vuelto:
            pago.vuelto === null
              ? null
              : Number(
                  pago.vuelto
                ),

          referencia:
            pago.referencia,

          observacion:
            pago.observacion,

          fechaPago:
            pago.fechaPago.toISOString(),
        })
      ),
    };
  }

  async registrarPago(
    datos: RegistrarPagoDTO
  ) {
    const atencionId =
      datos.atencionId?.trim();

    const metodo =
      datos.metodo?.trim();

    if (!atencionId) {
      throw new AppError(
        "La atención es obligatoria.",
        400
      );
    }

    if (
      ![
        "EFECTIVO",
        "YAPE",
        "PLIN",
        "TARJETA",
        "MIXTO",
      ].includes(metodo)
    ) {
      throw new AppError(
        "El método de pago no es válido.",
        400
      );
    }

    const cuenta =
      await cajaRepository.obtenerCuenta(
        atencionId
      );

    if (!cuenta) {
      throw new AppError(
        "La atención no fue encontrada.",
        404
      );
    }

    const totalCuenta =
      Number(cuenta.total);

    if (
      !Number.isFinite(
        totalCuenta
      ) ||
      totalCuenta <= 0
    ) {
      throw new AppError(
        "La cuenta no tiene un total válido para cobrar.",
        400
      );
    }

    const totalPagado =
      cuenta.pagos.reduce(
        (total, pago) =>
          total +
          Number(pago.monto),
        0
      );

    const saldoPendiente =
      Math.round(
        (totalCuenta -
          totalPagado) *
          100
      ) / 100;

    if (
      saldoPendiente <= 0
    ) {
      throw new AppError(
        "La cuenta ya se encuentra pagada.",
        409
      );
    }

    /*
     * Por defecto cobraremos
     * todo el saldo pendiente.
     *
     * Más adelante el mismo
     * servicio soportará pagos
     * parciales y mixtos.
     */
    const monto =
      datos.monto ===
      undefined
        ? saldoPendiente
        : Number(datos.monto);

    if (
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      throw new AppError(
        "El monto del pago debe ser mayor que cero.",
        400
      );
    }

    if (
      monto >
      saldoPendiente
    ) {
      throw new AppError(
        `El monto no puede superar el saldo pendiente de S/ ${saldoPendiente.toFixed(
          2
        )}.`,
        400
      );
    }

    let montoRecibido:
      | number
      | undefined;

    let vuelto:
      | number
      | undefined;

    const referencia =
      datos.referencia?.trim() ||
      undefined;

    /*
     * EFECTIVO
     */
    if (
      metodo === "EFECTIVO"
    ) {
      montoRecibido =
        Number(
          datos.montoRecibido
        );

      if (
        !Number.isFinite(
          montoRecibido
        ) ||
        montoRecibido <
          monto
      ) {
        throw new AppError(
          `El monto recibido debe ser igual o mayor a S/ ${monto.toFixed(
            2
          )}.`,
          400
        );
      }

      vuelto =
        Math.round(
          (montoRecibido -
            monto) *
            100
        ) / 100;
    }

    /*
     * YAPE / PLIN
     *
     * La referencia no será
     * obligatoria por ahora,
     * pero quedará almacenada
     * cuando el cajero la escriba.
     */
    if (
      metodo === "YAPE" ||
      metodo === "PLIN"
    ) {
      montoRecibido =
        undefined;

      vuelto = 0;
    }

    /*
     * TARJETA
     */
    if (
      metodo === "TARJETA"
    ) {
      montoRecibido =
        undefined;

      vuelto = 0;
    }

    /*
     * MIXTO lo dejaremos
     * preparado, pero no
     * permitiremos cobrarlo
     * desde un único registro.
     *
     * En la siguiente etapa
     * hacemos la UI para dividir
     * Efectivo + Yape, etc.
     */
    if (
      metodo === "MIXTO"
    ) {
      throw new AppError(
        "El pago mixto se habilitará mediante pagos divididos. Por ahora utiliza un método individual.",
        400
      );
    }

    try {
      return await cajaRepository.registrarPago(
        {
          atencionId,

          metodo:
            MetodoPago[
              metodo as keyof typeof MetodoPago
            ],

          monto,

          montoRecibido,

          vuelto,

          referencia,

          observacion:
            datos.observacion?.trim() ||
            undefined,
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "ATENCION_NO_EXISTE"
      ) {
        throw new AppError(
          "La atención no fue encontrada.",
          404
        );
      }

      if (
        error instanceof Error &&
        error.message ===
          "ATENCION_YA_PAGADA"
      ) {
        throw new AppError(
          "Esta atención ya se encuentra pagada.",
          409
        );
      }

      if (
        error instanceof Error &&
        error.message ===
          "ATENCION_NO_SOLICITO_CUENTA"
      ) {
        throw new AppError(
          "La mesa todavía no ha solicitado la cuenta.",
          409
        );
      }

      if (
        error instanceof Error &&
        error.message ===
          "MONTO_PAGO_INVALIDO"
      ) {
        throw new AppError(
          "El monto ingresado no es válido para esta cuenta.",
          400
        );
      }

      throw error;
    }
  }

  async liberarMesa(
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

    try {
      return await cajaRepository.liberarMesa(
        id
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "ATENCION_NO_EXISTE"
      ) {
        throw new AppError(
          "La atención no fue encontrada.",
          404
        );
      }

      if (
        error instanceof Error &&
        error.message ===
          "ATENCION_NO_PAGADA"
      ) {
        throw new AppError(
          "No se puede liberar la mesa hasta que la cuenta esté completamente pagada.",
          409
        );
      }

      throw error;
    }
  }

  /*
   * =========================================================
   * MÉTRICAS DEL PANEL PRINCIPAL
   * =========================================================
   */
  async obtenerMetricasDashboard() {
    const ahora = new Date();

    const partes = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(ahora);

    const valor = (
      tipo: Intl.DateTimeFormatPartTypes
    ) =>
      Number(
        partes.find(
          (parte) =>
            parte.type === tipo
        )?.value ?? 0
      );

    const anio =
      valor("year");

    const mes =
      valor("month");

    const dia =
      valor("day");

    /*
     * Perú = UTC-5 todo el año.
     * 00:00 en Lima equivale a 05:00 UTC.
     */
    const inicioHoy =
      new Date(
        Date.UTC(
          anio,
          mes - 1,
          dia,
          5,
          0,
          0,
          0
        )
      );

    const finHoy =
      new Date(
        inicioHoy.getTime() +
          24 * 60 * 60 * 1000
      );

    const inicioAyer =
      new Date(
        inicioHoy.getTime() -
          24 * 60 * 60 * 1000
      );

    const datos =
      await cajaRepository.obtenerMetricasDashboard(
        inicioHoy,
        finHoy,
        inicioAyer
      );

    const ventasHoy =
      Math.round(
        datos.pagosHoy.reduce(
          (total, pago) =>
            total +
            Number(pago.monto),
          0
        ) * 100
      ) / 100;

    const ventasAyer =
      Math.round(
        datos.pagosAyer.reduce(
          (total, pago) =>
            total +
            Number(pago.monto),
          0
        ) * 100
      ) / 100;

    const atencionesPagadas =
      datos.atencionesHoy.length;

    const ticketPromedio =
      atencionesPagadas > 0
        ? Math.round(
            (ventasHoy /
              atencionesPagadas) *
              100
          ) / 100
        : 0;

    const mesasAtendidas =
      new Set(
        datos.atencionesHoy.map(
          (atencion) =>
            atencion.mesaId
        )
      ).size;

    const variacionVsAyer =
      ventasAyer > 0
        ? Math.round(
            ((ventasHoy -
              ventasAyer) /
              ventasAyer) *
              10000
          ) / 100
        : ventasHoy > 0
          ? 100
          : 0;

    const ventasPorHora = Array.from(
      {
        length: 24,
      },
      (_, hora) => ({
        hora,
        etiqueta: `${String(
          hora
        ).padStart(2, "0")}:00`,
        total: 0,
      })
    );

    for (
      const pago of
      datos.pagosHoy
    ) {
      const horaPeru =
        Number(
          new Intl.DateTimeFormat(
            "en-US",
            {
              timeZone:
                "America/Lima",
              hour:
                "2-digit",
              hourCycle:
                "h23",
            }
          ).format(
            pago.fechaPago
          )
        );

      if (
        Number.isInteger(
          horaPeru
        ) &&
        ventasPorHora[
          horaPeru
        ]
      ) {
        ventasPorHora[
          horaPeru
        ].total =
          Math.round(
            (ventasPorHora[
              horaPeru
            ].total +
              Number(
                pago.monto
              )) *
              100
          ) / 100;
      }
    }

    const metodos = new Map<
      string,
      {
        metodo: string;
        total: number;
        operaciones: number;
      }
    >();

    for (
      const pago of
      datos.pagosHoy
    ) {
      const actual =
        metodos.get(
          pago.metodo
        ) ?? {
          metodo:
            pago.metodo,
          total: 0,
          operaciones: 0,
        };

      actual.total =
        Math.round(
          (actual.total +
            Number(
              pago.monto
            )) *
            100
        ) / 100;

      actual.operaciones +=
        1;

      metodos.set(
        pago.metodo,
        actual
      );
    }

    const metodosPago =
      Array.from(
        metodos.values()
      ).sort(
        (a, b) =>
          b.total - a.total
      );

    const productos = new Map<
      string,
      {
        productoId: string;
        nombre: string;
        cantidad: number;
        total: number;
      }
    >();

    for (
      const detalle of
      datos.detallesHoy
    ) {
      const actual =
        productos.get(
          detalle.producto.id
        ) ?? {
          productoId:
            detalle.producto.id,
          nombre:
            detalle.producto.nombre,
          cantidad: 0,
          total: 0,
        };

      actual.cantidad +=
        Number(
          detalle.cantidad
        );

      actual.total =
        Math.round(
          (actual.total +
            Number(
              detalle.subtotal
            )) *
            100
        ) / 100;

      productos.set(
        detalle.producto.id,
        actual
      );
    }

    const topProductos =
      Array.from(
        productos.values()
      )
        .sort(
          (a, b) =>
            b.cantidad -
            a.cantidad
        )
        .slice(0, 5);

    return {
      fecha:
        inicioHoy.toISOString(),

      ventasHoy,
      ventasAyer,
      variacionVsAyer,

      pedidosHoy:
        datos.pedidosHoy,

      atencionesPagadas,

      mesasAtendidas,

      ticketPromedio,

      ventasPorHora,

      metodosPago,

      topProductos,
    };
  }

}

export const cajaService =
  new CajaService();