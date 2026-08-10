"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ActualizarCategoriaDTO,
  Categoria,
  CrearCategoriaDTO,
} from "@/types/categoria";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export function useCategorias() {
  const [categorias, setCategorias] =
    useState<Categoria[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const cargarCategorias =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          "/api/categorias",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            Categoria[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar las categorías."
          );
        }

        setCategorias(
          resultado.data ?? []
        );
      } catch (errorDesconocido) {
        const mensajeError =
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Ocurrió un error inesperado.";

        setError(mensajeError);
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  async function crearCategoria(
    datos: CrearCategoriaDTO
  ) {
    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const respuesta = await fetch(
        "/api/categorias",
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
        (await respuesta.json()) as ApiResponse<Categoria>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo crear la categoría."
        );
      }

      setMensaje(resultado.message);

      await cargarCategorias();

      return resultado.data ?? null;
    } catch (errorDesconocido) {
      const mensajeError =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error inesperado.";

      setError(mensajeError);

      return null;
    } finally {
      setGuardando(false);
    }
  }

  async function actualizarCategoria(
    id: string,
    datos: ActualizarCategoriaDTO
  ) {
    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const respuesta = await fetch(
        "/api/categorias",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id,
            ...datos,
          }),
        }
      );

      const resultado =
        (await respuesta.json()) as ApiResponse<Categoria>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo actualizar la categoría."
        );
      }

      setMensaje(resultado.message);

      await cargarCategorias();

      return resultado.data ?? null;
    } catch (errorDesconocido) {
      const mensajeError =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error inesperado.";

      setError(mensajeError);

      return null;
    } finally {
      setGuardando(false);
    }
  }

  async function desactivarCategoria(
    id: string
  ) {
    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const respuesta = await fetch(
        `/api/categorias?id=${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
        }
      );

      const resultado =
        (await respuesta.json()) as ApiResponse<Categoria>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo desactivar la categoría."
        );
      }

      setMensaje(resultado.message);

      await cargarCategorias();

      return true;
    } catch (errorDesconocido) {
      const mensajeError =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error inesperado.";

      setError(mensajeError);

      return false;
    } finally {
      setGuardando(false);
    }
  }

  return {
    categorias,
    cargando,
    guardando,
    mensaje,
    error,
    recargar: cargarCategorias,
    crearCategoria,
    actualizarCategoria,
    desactivarCategoria,
    limpiarMensajes() {
      setMensaje("");
      setError("");
    },
  };
}