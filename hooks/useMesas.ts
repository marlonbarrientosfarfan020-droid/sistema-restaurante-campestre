"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  AbrirAtencionDTO,
  MesaResumen,
} from "@/types/mesa";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type OpcionesUseMesas = {
  sucursalId: string | null;
};

export function useMesas({
  sucursalId,
}: OpcionesUseMesas) {
  const [mesas, setMesas] = useState<
    MesaResumen[]
  >([]);

  const [cargando, setCargando] =
    useState(false);

  const [procesando, setProcesando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const cargarMesas =
    useCallback(async () => {
      if (!sucursalId) {
        setMesas([]);
        return;
      }

      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          `/api/mesas?sucursalId=${encodeURIComponent(
            sucursalId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            MesaResumen[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar las mesas."
          );
        }

        setMesas(resultado.data ?? []);
      } catch (errorDesconocido) {
        const texto =
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Ocurrió un error cargando las mesas.";

        setError(texto);
        setMesas([]);
      } finally {
        setCargando(false);
      }
    }, [sucursalId]);

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  async function abrirAtencion(
    datos: Omit<
      AbrirAtencionDTO,
      "sucursalId"
    >
  ) {
    if (!sucursalId) {
      setError(
        "No se encontró la sucursal activa."
      );
      return null;
    }

    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const respuesta = await fetch(
        "/api/mesas",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...datos,
            sucursalId,
          }),
        }
      );

      const resultado =
        (await respuesta.json()) as ApiResponse<{
          id: string;
          codigo: string;
        }>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo abrir la atención."
        );
      }

      setMensaje(resultado.message);

      await cargarMesas();

      return resultado.data ?? null;
    } catch (errorDesconocido) {
      const texto =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error abriendo la atención.";

      setError(texto);

      return null;
    } finally {
      setProcesando(false);
    }
  }

  const mesasLibres = mesas.filter(
    (mesa) => mesa.estado === "LIBRE"
  ).length;

  const mesasOcupadas = mesas.filter(
    (mesa) => mesa.estado !== "LIBRE"
  ).length;

  const mesasConCuentaSolicitada =
    mesas.filter(
      (mesa) =>
        mesa.estado === "SOLICITO_CUENTA"
    ).length;

  const totalAtencionesAbiertas =
    mesas.filter(
      (mesa) =>
        mesa.atencionActual !== null
    ).length;

  return {
    mesas,
    cargando,
    procesando,
    mensaje,
    error,

    mesasLibres,
    mesasOcupadas,
    mesasConCuentaSolicitada,
    totalAtencionesAbiertas,

    recargar: cargarMesas,
    abrirAtencion,

    limpiarMensajes() {
      setMensaje("");
      setError("");
    },
  };
}