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

export function useBandejaPedidos() {
  const [pedidos, setPedidos] = useState<
    PedidoResumen[]
  >([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizandoId, setActualizandoId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const cargarPedidos =
    useCallback(async () => {
      try {
        setError("");

        const respuesta = await fetch(
          "/api/pedidos",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const texto =
          await respuesta.text();

        let resultado: ApiResponse<
          PedidoResumen[]
        >;

        try {
          resultado = JSON.parse(texto);
        } catch {
          throw new Error(
            "La API de pedidos no devolvió una respuesta válida."
          );
        }

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar los pedidos."
          );
        }

        setPedidos(
          resultado.data ?? []
        );
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Ocurrió un error cargando los pedidos."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  const actualizarEstado =
    useCallback(
      async (
        pedidoId: string,
        estado: string
      ) => {
        try {
          setActualizandoId(pedidoId);
          setError("");
          setMensaje("");

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

          const texto =
            await respuesta.text();

          let resultado: ApiResponse<
            PedidoResumen
          >;

          try {
            resultado =
              JSON.parse(texto);
          } catch {
            throw new Error(
              "La API de cocina no devolvió una respuesta válida."
            );
          }

          if (
            !respuesta.ok ||
            !resultado.success
          ) {
            throw new Error(
              resultado.message ||
                "No se pudo actualizar el pedido."
            );
          }

          setMensaje(
            resultado.message ||
              "Pedido actualizado correctamente."
          );

          await cargarPedidos();

          return true;
        } catch (errorDesconocido) {
          setError(
            errorDesconocido instanceof Error
              ? errorDesconocido.message
              : "Ocurrió un error actualizando el pedido."
          );

          return false;
        } finally {
          setActualizandoId(null);
        }
      },
      [cargarPedidos]
    );

  useEffect(() => {
    cargarPedidos();

    const intervalo =
      window.setInterval(
        cargarPedidos,
        5000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [cargarPedidos]);

  return {
    pedidos,
    cargando,
    actualizandoId,
    error,
    mensaje,
    cargarPedidos,
    actualizarEstado,

    limpiarMensajes() {
      setError("");
      setMensaje("");
    },
  };
}