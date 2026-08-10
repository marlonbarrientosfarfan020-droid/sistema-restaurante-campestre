"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ActualizarProductoDTO,
  CrearProductoDTO,
  Producto,
} from "@/types/producto";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export function useProductos() {
  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const cargarProductos =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          "/api/productos",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            Producto[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar los productos."
          );
        }

        setProductos(resultado.data ?? []);
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Ocurrió un error inesperado."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  async function ejecutarPeticion(
    metodo: "POST" | "PUT" | "PATCH",
    datos: object
  ) {
    try {
      setGuardando(true);
      setMensaje("");
      setError("");

      const respuesta = await fetch(
        "/api/productos",
        {
          method: metodo,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(datos),
        }
      );

      const resultado =
        (await respuesta.json()) as ApiResponse<Producto>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo completar la operación."
        );
      }

      setMensaje(resultado.message);

      await cargarProductos();

      return resultado.data ?? null;
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error inesperado."
      );

      return null;
    } finally {
      setGuardando(false);
    }
  }

  function crearProducto(
    datos: CrearProductoDTO
  ) {
    return ejecutarPeticion(
      "POST",
      datos
    );
  }

  function actualizarProducto(
    id: string,
    datos: ActualizarProductoDTO
  ) {
    return ejecutarPeticion("PUT", {
      id,
      ...datos,
    });
  }

  function cambiarDisponibilidad(
    id: string,
    disponible: boolean
  ) {
    return ejecutarPeticion("PATCH", {
      id,
      disponible,
    });
  }

  async function desactivarProducto(
    id: string
  ) {
    try {
      setGuardando(true);
      setMensaje("");
      setError("");

      const respuesta = await fetch(
        `/api/productos?id=${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
        }
      );

      const resultado =
        (await respuesta.json()) as ApiResponse<Producto>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo desactivar el producto."
        );
      }

      setMensaje(resultado.message);

      await cargarProductos();

      return true;
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error inesperado."
      );

      return false;
    } finally {
      setGuardando(false);
    }
  }

  return {
    productos,
    cargando,
    guardando,
    mensaje,
    error,
    recargar: cargarProductos,
    crearProducto,
    actualizarProducto,
    cambiarDisponibilidad,
    desactivarProducto,
    limpiarMensajes() {
      setMensaje("");
      setError("");
    },
  };
}