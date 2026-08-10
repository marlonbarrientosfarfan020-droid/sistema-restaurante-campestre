"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export type PedidoMozo = {
  id: string;
  numero: string;
  estado: string;
  origen: string;
  observacion: string | null;
  subtotal: number | string;
  fechaPedido: string;

  atencion: {
    id: string;
    codigo: string;

    metodoPagoPrevisto:
      | string
      | null;

    mesa: {
      id: string;
      numero: number;
      nombre: string;

      zona: {
        id: string;
        nombre: string;
      };
    };
  };

  detalles: Array<{
    id: string;

    cantidad:
      | number
      | string;

    precioUnitario:
      | number
      | string;

    subtotal:
      | number
      | string;

    observacion:
      | string
      | null;

    producto: {
      id: string;
      codigo: string;
      nombre: string;

      imagenUrl:
        | string
        | null;
    };
  }>;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export function usePedidosMozo() {
  const [
    pedidos,
    setPedidos,
  ] =
    useState<PedidoMozo[]>(
      []
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    procesandoId,
    setProcesandoId,
  ] =
    useState<string | null>(
      null
    );

  const [
    mensaje,
    setMensaje,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  /*
   * ==========================================
   * CARGAR PEDIDOS QR PENDIENTES
   * ==========================================
   */
  const cargarPedidos =
    useCallback(async () => {
      try {
        setError("");

        const respuesta =
          await fetch(
            "/api/mozo/pedidos",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            PedidoMozo[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar los pedidos QR."
          );
        }

        setPedidos(
          resultado.data ?? []
        );
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof
            Error
            ? errorDesconocido.message
            : "Error cargando pedidos QR."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  /*
   * ==========================================
   * ACTUALIZACIÓN AUTOMÁTICA
   * ==========================================
   *
   * El mozo verá nuevos pedidos QR
   * sin actualizar manualmente.
   */
  useEffect(() => {
    cargarPedidos();

    const intervalo =
      window.setInterval(
        () => {
          cargarPedidos();
        },
        5000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [cargarPedidos]);

  /*
   * ==========================================
   * CONFIRMAR PEDIDO QR
   * ==========================================
   *
   * PENDIENTE_CONFIRMACION
   *          ↓
   *       RECIBIDO
   *
   * Después:
   *
   * - desaparece de la bandeja del mozo
   * - aparece en Cocina
   * - cliente ve "Pedido recibido"
   */
  async function confirmarPedido(
    pedidoId: string
  ) {
    const id =
      pedidoId?.trim();

    if (!id) {
      setError(
        "El pedido no es válido."
      );

      return false;
    }

    try {
      setProcesandoId(
        id
      );

      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          "/api/mozo/pedidos",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id,
            }),
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<unknown>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo confirmar el pedido."
        );
      }

      /*
       * Lo quitamos inmediatamente
       * para que la interfaz responda
       * rápido.
       */
      setPedidos(
        (actuales) =>
          actuales.filter(
            (pedido) =>
              pedido.id !== id
          )
      );

      setMensaje(
        resultado.message ||
          "Pedido confirmado correctamente."
      );

      /*
       * Confirmamos contra BD.
       */
      await cargarPedidos();

      return true;
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "Error confirmando el pedido."
      );

      return false;
    } finally {
      setProcesandoId(
        null
      );
    }
  }

  return {
    pedidos,
    cargando,
    procesandoId,
    mensaje,
    error,

    recargar:
      cargarPedidos,

    confirmarPedido,

    limpiarMensajes() {
      setMensaje("");
      setError("");
    },
  };
}