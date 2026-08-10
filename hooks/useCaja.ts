"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type MetodoPago =
  | "EFECTIVO"
  | "YAPE"
  | "PLIN"
  | "TARJETA"
  | "MIXTO";

export type CuentaCaja = {
  id: string;
  codigo: string;
  estado: string;

  subtotal: number;
  descuento: number;
  total: number;

  metodoPagoPrevisto:
    | MetodoPago
    | null;

  fechaApertura: string;
  fechaSolicitudCuenta:
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

  mozo: {
    id: string;
    nombres: string;
    apellidos: string;
  } | null;

  pedidos: Array<{
    id: string;
    numero: string;
    estado: string;
    subtotal: number;
    fechaPedido: string;

    detalles: Array<{
      id: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
      observacion: string | null;

      producto: {
        id: string;
        codigo: string;
        nombre: string;
        imagenUrl: string | null;
      };
    }>;
  }>;

  pagos: Array<{
    id: string;
    metodo: MetodoPago;
    monto: number;
    montoRecibido: number | null;
    vuelto: number | null;
    referencia: string | null;
    fechaPago: string;
  }>;
};

type ResultadoPago = {
  atencionId: string;
  codigo: string;
  totalAtencion: number;
  totalPagado: number;
  saldoPendiente: number;
  pagoCompleto: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type RegistrarPagoDatos = {
  atencionId: string;
  metodo:
    | "EFECTIVO"
    | "YAPE"
    | "PLIN"
    | "TARJETA";
  monto?: number;
  montoRecibido?: number;
  referencia?: string;
  observacion?: string;
};

export function useCaja() {
  const [cuentas, setCuentas] =
    useState<CuentaCaja[]>([]);

  const [cuentaSeleccionada, setCuentaSeleccionada] =
    useState<CuentaCaja | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const cargarCuentas =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta =
          await fetch("/api/caja", {
            method: "GET",
            cache: "no-store",
          });

        const resultado =
          (await respuesta.json()) as ApiResponse<
            CuentaCaja[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar las cuentas."
          );
        }

        const nuevasCuentas =
          resultado.data ?? [];

        setCuentas(nuevasCuentas);

        setCuentaSeleccionada(
          (actual) => {
            if (!actual) {
              return (
                nuevasCuentas[0] ??
                null
              );
            }

            return (
              nuevasCuentas.find(
                (cuenta) =>
                  cuenta.id ===
                  actual.id
              ) ??
              nuevasCuentas[0] ??
              null
            );
          }
        );
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof
            Error
            ? errorDesconocido.message
            : "Ocurrió un error cargando Caja."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarCuentas();
  }, [cargarCuentas]);

  async function seleccionarCuenta(
    atencionId: string
  ) {
    try {
      setError("");

      const respuesta =
        await fetch(
          `/api/caja?atencionId=${encodeURIComponent(
            atencionId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<CuentaCaja>;

      if (
        !respuesta.ok ||
        !resultado.success ||
        !resultado.data
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo cargar la cuenta."
        );
      }

      setCuentaSeleccionada(
        resultado.data
      );

      return resultado.data;
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "No se pudo cargar la cuenta."
      );

      return null;
    }
  }

  async function registrarPago(
    datos: RegistrarPagoDatos
  ) {
    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          "/api/caja/pagar",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              datos
            ),
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<ResultadoPago>;

      if (
        !respuesta.ok ||
        !resultado.success ||
        !resultado.data
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo registrar el pago."
        );
      }

      setMensaje(
        resultado.message
      );

      if (
        resultado.data
          .pagoCompleto
      ) {
        await seleccionarCuenta(
          datos.atencionId
        );
      }

      await cargarCuentas();

      return resultado.data;
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "Ocurrió un error registrando el pago."
      );

      return null;
    } finally {
      setProcesando(false);
    }
  }

  async function liberarMesa(
    atencionId: string
  ) {
    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          "/api/caja/liberar",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              atencionId,
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
            "No se pudo liberar la mesa."
        );
      }

      setMensaje(
        resultado.message
      );

      setCuentaSeleccionada(
        null
      );

      await cargarCuentas();

      return true;
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "Ocurrió un error liberando la mesa."
      );

      return false;
    } finally {
      setProcesando(false);
    }
  }

  return {
    cuentas,
    cuentaSeleccionada,
    cargando,
    procesando,
    mensaje,
    error,

    recargar:
      cargarCuentas,

    seleccionarCuenta,
    registrarPago,
    liberarMesa,

    limpiarMensajes() {
      setMensaje("");
      setError("");
    },
  };
}