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

export function useEntregas() {
  const [pedidos, setPedidos] =
    useState<PedidoResumen[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [
    procesandoId,
    setProcesandoId,
  ] = useState<string | null>(null);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const cargarPedidos =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          "/api/entregas",
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
              "No se pudieron cargar las entregas."
          );
        }

        setPedidos(
          resultado.data ?? []
        );
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Ocurrió un error cargando las entregas."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarPedidos();

    const intervalo =
      window.setInterval(() => {
        cargarPedidos();
      }, 15000);

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [cargarPedidos]);

  async function cambiarEstado(
    pedidoId: string,
    estado:
      | "EN_ENTREGA"
      | "ENTREGADO",
    usuarioId?: string
  ) {
    try {
      setProcesandoId(pedidoId);
      setMensaje("");
      setError("");

      const respuesta = await fetch(
        "/api/entregas",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: pedidoId,
            estado,
            usuarioId,
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
            "No se pudo actualizar la entrega."
        );
      }

      setMensaje(resultado.message);

      await cargarPedidos();

      return true;
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error actualizando la entrega."
      );

      return false;
    } finally {
      setProcesandoId(null);
    }
  }

  return {
    pedidos,
    cargando,
    procesandoId,
    mensaje,
    error,
    recargar: cargarPedidos,
    cambiarEstado,

    limpiarMensajes() {
      setMensaje("");
      setError("");
    },
  };
}