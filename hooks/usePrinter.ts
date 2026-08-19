"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ImpresionResult } from "@/services/printer.service";

type UsePrinterOptions = {
  /**
   * Si es true y la impresora de red falla o está inactiva, abre automáticamente
   * el diálogo de impresión de navegador sin requerir clic extra.
   */
  autoOpenBrowserFallback?: boolean;
};

export function usePrinter(options: UsePrinterOptions = { autoOpenBrowserFallback: true }) {
  const [imprimiendo, setImprimiendo] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<ImpresionResult | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const procesarRespuesta = useCallback(
    (resultado: ImpresionResult, accionNombre: string) => {
      setUltimoResultado(resultado);

      if (resultado.networkPrinted) {
        toast.success(`${accionNombre} impresa en red`, {
          description: `Enviada con éxito a ${resultado.printerName} (${resultado.ipAddress}).`,
          duration: 4000,
        });
      } else {
        // Fallback a navegador
        const motivo = resultado.error || "Impresora de red no disponible";
        toast.info(`Impresión por navegador activada`, {
          description: `${motivo}. Abriendo vista previa de impresión...`,
          duration: 5000,
        });

        if (options.autoOpenBrowserFallback !== false) {
          setModalAbierto(true);
        }
      }

      return resultado;
    },
    [options.autoOpenBrowserFallback]
  );

  /**
   * Imprime la comanda de cocina para un pedido
   */
  const imprimirComandaCocina = useCallback(
    async (pedidoId: string) => {
      try {
        setImprimiendo(true);
        const res = await fetch("/api/impresion/cocina", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId }),
        });

        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || "Error al solicitar impresión de comanda");
        }

        return procesarRespuesta(json.data as ImpresionResult, "Comanda de Cocina");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al imprimir comanda";
        toast.error("Error al imprimir comanda", { description: msg });
        throw err;
      } finally {
        setImprimiendo(false);
      }
    },
    [procesarRespuesta]
  );

  /**
   * Imprime la pre-cuenta / ticket de consumo de una atención
   */
  const imprimirPrecuenta = useCallback(
    async (atencionId: string) => {
      try {
        setImprimiendo(true);
        const res = await fetch("/api/impresion/ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ atencionId }),
        });

        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || "Error al solicitar impresión de pre-cuenta");
        }

        return procesarRespuesta(json.data as ImpresionResult, "Pre-cuenta de Consumo");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al imprimir pre-cuenta";
        toast.error("Error al imprimir pre-cuenta", { description: msg });
        throw err;
      } finally {
        setImprimiendo(false);
      }
    },
    [procesarRespuesta]
  );

  /**
   * Imprime un comprobante emitido (Boleta, Factura, Nota de Venta)
   */
  const imprimirComprobante = useCallback(
    async (comprobanteId: string) => {
      try {
        setImprimiendo(true);
        const res = await fetch("/api/impresion/comprobante", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comprobanteId }),
        });

        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || "Error al solicitar impresión de comprobante");
        }

        return procesarRespuesta(json.data as ImpresionResult, "Comprobante de Pago");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al imprimir comprobante";
        toast.error("Error al imprimir comprobante", { description: msg });
        throw err;
      } finally {
        setImprimiendo(false);
      }
    },
    [procesarRespuesta]
  );

  /**
   * Imprime un ticket de prueba diagnóstica
   */
  const imprimirPrueba = useCallback(
    async (target: "KITCHEN" | "RECEPTION") => {
      try {
        setImprimiendo(true);
        const res = await fetch("/api/impresion/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target }),
        });

        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || "Error al solicitar prueba de impresión");
        }

        return procesarRespuesta(json.data as ImpresionResult, "Ticket de Prueba");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error en prueba de impresión";
        toast.error("Error en prueba de impresión", { description: msg });
        throw err;
      } finally {
        setImprimiendo(false);
      }
    },
    [procesarRespuesta]
  );

  /**
   * Prueba conectividad IP rápida
   */
  const probarConexionIp = useCallback(
    async (target: "KITCHEN" | "RECEPTION", ipAddress: string, port: number) => {
      try {
        setImprimiendo(true);
        const res = await fetch("/api/impresion/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target, ipAddress, port, onlyPing: true }),
        });

        const json = await res.json();
        if (json.success && json.data?.reachable) {
          toast.success("Impresora conectada", {
            description: `Respuesta exitosa en ${json.data.latencyMs}ms (${ipAddress}:${port})`,
          });
          return true;
        } else {
          toast.warning("Sin respuesta de la impresora", {
            description: json.data?.error || `No se pudo conectar a ${ipAddress}:${port}. Verifique cable/Wi-Fi.`,
          });
          return false;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al verificar conexión";
        toast.error("Error al verificar conexión", { description: msg });
        return false;
      } finally {
        setImprimiendo(false);
      }
    },
    []
  );

  const abrirModalManual = useCallback((resultado?: ImpresionResult) => {
    if (resultado) {
      setUltimoResultado(resultado);
    }
    setModalAbierto(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
  }, []);

  return {
    imprimiendo,
    ultimoResultado,
    modalAbierto,
    abrirModalManual,
    cerrarModal,
    imprimirComandaCocina,
    imprimirPrecuenta,
    imprimirComprobante,
    imprimirPrueba,
    probarConexionIp,
  };
}
