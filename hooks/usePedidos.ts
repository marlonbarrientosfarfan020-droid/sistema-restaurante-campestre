"use client";

import { useCallback, useState } from "react";

import type {
  CrearPedidoDTO,
  PedidoResumen,
} from "@/types/pedido";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export function usePedidos() {
  const [pedidos, setPedidos] = useState<
    PedidoResumen[]
  >([]);

  const [cargando, setCargando] =
    useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const cargarPedidos = useCallback(
    async (atencionId: string) => {
      if (!atencionId) {
        setPedidos([]);
        return;
      }

      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          `/api/pedidos?atencionId=${encodeURIComponent(
            atencionId
          )}`,
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
              "No se pudieron cargar los pedidos."
          );
        }

        setPedidos(resultado.data ?? []);
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Ocurrió un error cargando los pedidos."
        );
      } finally {
        setCargando(false);
      }
    },
    []
  );

  async function crearPedido(
    datos: CrearPedidoDTO
  ) {
    try {
      setEnviando(true);
      setMensaje("");
      setError("");

      const respuesta = await fetch(
        "/api/pedidos",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(datos),
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
            "No se pudo enviar el pedido."
        );
      }

      setMensaje(resultado.message);

      await cargarPedidos(datos.atencionId);

      return resultado.data ?? null;
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error enviando el pedido."
      );

      return null;
    } finally {
      setEnviando(false);
    }
  }

  return {
    pedidos,
    cargando,
    enviando,
    mensaje,
    error,
    cargarPedidos,
    crearPedido,

    limpiarMensajes() {
      setMensaje("");
      setError("");
    },
  };
}