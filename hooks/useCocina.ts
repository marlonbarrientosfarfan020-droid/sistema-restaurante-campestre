"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  PedidoResumen,
} from "@/types/pedido";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type EstadoCocina =
  | "PREPARANDO"
  | "ENTREGADO";

export function useCocina() {
  const [pedidos, setPedidos] =
    useState<PedidoResumen[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [
    procesandoId,
    setProcesandoId,
  ] = useState<string | null>(
    null
  );

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  /*
   * =====================================================
   * CARGAR PEDIDOS
   * =====================================================
   */
  const cargarPedidos =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta =
          await fetch(
            "/api/cocina",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            PedidoResumen[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar los pedidos de cocina."
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
            : "Ocurrió un error cargando los pedidos de cocina."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  /*
   * =====================================================
   * ACTUALIZACIÓN AUTOMÁTICA
   * =====================================================
   *
   * Cada 5 segundos revisamos si el mozo
   * confirmó nuevos pedidos.
   *
   * Así cocina no necesita estar
   * presionando Actualizar.
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
   * =====================================================
   * CAMBIAR ESTADO
   * =====================================================
   *
   * Flujo simplificado:
   *
   * RECIBIDO
   *    ↓
   * PREPARANDO
   *    ↓
   * ENTREGADO
   */
  async function cambiarEstado(
    pedidoId: string,
    estado: EstadoCocina
  ) {
    try {
      setProcesandoId(
        pedidoId
      );

      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          "/api/cocina",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: pedidoId,
              estado,
            }),
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<PedidoResumen>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo actualizar el estado del pedido."
        );
      }

      setMensaje(
        resultado.message
      );

      /*
       * Actualizamos inmediatamente.
       *
       * Si pasó a ENTREGADO,
       * desaparecerá de Cocina.
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
          : "Ocurrió un error actualizando el pedido."
      );

      return false;
    } finally {
      setProcesandoId(
        null
      );
    }
  }

  function limpiarMensajes() {
    setMensaje("");
    setError("");
  }

  return {
    pedidos,
    cargando,
    procesandoId,
    mensaje,
    error,

    recargar:
      cargarPedidos,

    cambiarEstado,

    limpiarMensajes,
  };
}