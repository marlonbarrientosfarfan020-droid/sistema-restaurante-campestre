"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Save,
  RotateCcw,
  ChefHat,
  ReceiptText,
  Sliders,
  HelpCircle,
  FileCode,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { usePrinter } from "@/hooks/usePrinter";
import { ThermalReceiptModal } from "@/components/impresion/ThermalReceiptModal";

type PrinterConfigItem = {
  id: string;
  target: "KITCHEN" | "RECEPTION";
  name: string;
  ipAddress: string;
  port: number;
  paperWidth: "58mm" | "80mm";
  isActive: boolean;
  autoPrint: boolean;
  updatedAt?: string;
};

export default function ImpresorasConfigPage() {
  const [configs, setConfigs] = useState<Record<"KITCHEN" | "RECEPTION", PrinterConfigItem>>({
    KITCHEN: {
      id: "",
      target: "KITCHEN",
      name: "Impresora Cocina (Comandas)",
      ipAddress: "192.168.1.200",
      port: 9100,
      paperWidth: "80mm",
      isActive: true,
      autoPrint: true,
    },
    RECEPTION: {
      id: "",
      target: "RECEPTION",
      name: "Impresora Caja / Recepción (Pre-cuentas y Comprobantes)",
      ipAddress: "192.168.1.201",
      port: 9100,
      paperWidth: "80mm",
      isActive: true,
      autoPrint: true,
    },
  });

  const [cargando, setCargando] = useState(true);
  const [guardandoTarget, setGuardandoTarget] = useState<string | null>(null);
  const [probandoTarget, setProbandoTarget] = useState<string | null>(null);
  const [estadoConexion, setEstadoConexion] = useState<{
    KITCHEN?: { ok: boolean; msg: string; latency?: number };
    RECEPTION?: { ok: boolean; msg: string; latency?: number };
  }>({});

  const {
    imprimiendo,
    ultimoResultado,
    modalAbierto,
    cerrarModal,
    imprimirPrueba,
    probarConexionIp,
  } = usePrinter();

  const cargarConfiguraciones = useCallback(async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/configuracion/impresoras", {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        const mapa: Partial<Record<"KITCHEN" | "RECEPTION", PrinterConfigItem>> = {};
        for (const item of json.data) {
          if (item.target === "KITCHEN" || item.target === "RECEPTION") {
            mapa[item.target as "KITCHEN" | "RECEPTION"] = item;
          }
        }
        setConfigs((prev) => ({
          ...prev,
          ...(mapa as Record<"KITCHEN" | "RECEPTION", PrinterConfigItem>),
        }));
      }
    } catch (err) {
      toast.error("No se pudo cargar la configuración de impresoras.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarConfiguraciones();
  }, [cargarConfiguraciones]);

  const handleChange = (
    target: "KITCHEN" | "RECEPTION",
    campo: keyof PrinterConfigItem,
    valor: string | number | boolean
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [target]: {
        ...prev[target],
        [campo]: valor,
      },
    }));
  };

  const handleGuardar = async (target: "KITCHEN" | "RECEPTION") => {
    try {
      setGuardandoTarget(target);
      const item = configs[target];
      const res = await fetch("/api/configuracion/impresoras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Error al guardar");
      }
      toast.success(`Configuración de ${target === "KITCHEN" ? "Cocina" : "Recepción"} guardada`);
      setConfigs((prev) => ({
        ...prev,
        [target]: json.data,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast.error(msg);
    } finally {
      setGuardandoTarget(null);
    }
  };

  const handleProbarPing = async (target: "KITCHEN" | "RECEPTION") => {
    const item = configs[target];
    setProbandoTarget(target);
    const ok = await probarConexionIp(target, item.ipAddress, item.port);
    setEstadoConexion((prev) => ({
      ...prev,
      [target]: {
        ok,
        msg: ok ? "Conexión TCP activa" : "Sin respuesta en puerto 9100",
      },
    }));
    setProbandoTarget(null);
  };

  const handleImprimirPrueba = async (target: "KITCHEN" | "RECEPTION") => {
    await imprimirPrueba(target);
  };

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="text-center">
          <LoaderCircle size={44} className="mx-auto animate-spin text-amber-500" />
          <p className="mt-4 font-black text-slate-700">Cargando configuración de impresoras...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Cabecera Principal */}
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Campestre Chinka Chinka
              </p>
              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <Printer size={36} className="text-amber-400" />
                Configuración de Impresoras Térmicas
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Administra las impresoras térmicas de red (ESC/POS vía TCP puerto 9100) para comandas de cocina, pre-cuentas y comprobantes con modo fallback por navegador.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/configuracion"
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <ArrowLeft size={18} />
                Volver
              </Link>
              <button
                type="button"
                onClick={cargarConfiguraciones}
                className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-md transition hover:bg-slate-100 active:scale-95"
              >
                <RotateCcw size={16} />
                Recargar
              </button>
            </div>
          </div>
        </header>

        {/* Tarjetas de Configuración */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. Impresora de Cocina */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md md:p-7">
            <div>
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
                    <ChefHat size={30} />
                  </div>
                  <div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800">
                      Destino: Cocina
                    </span>
                    <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                      Impresora de Comandas
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                      configs.KITCHEN.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {configs.KITCHEN.isActive ? (
                      <>
                        <Wifi size={13} />
                        Red Activa
                      </>
                    ) : (
                      <>
                        <WifiOff size={13} />
                        Inactiva
                      </>
                    )}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                Recibe y emite automáticamente las comandas de platos y bebidas pedidos por los mozos o clientes vía QR.
              </p>

              {/* Formulario */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Nombre Descriptivo
                  </label>
                  <input
                    type="text"
                    value={configs.KITCHEN.name}
                    onChange={(e) => handleChange("KITCHEN", "name", e.target.value)}
                    placeholder="Ej. Impresora Cocina Central"
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Dirección IP (Red Local)
                    </label>
                    <input
                      type="text"
                      value={configs.KITCHEN.ipAddress}
                      onChange={(e) => handleChange("KITCHEN", "ipAddress", e.target.value)}
                      placeholder="192.168.1.200"
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Puerto TCP
                    </label>
                    <input
                      type="number"
                      value={configs.KITCHEN.port}
                      onChange={(e) => handleChange("KITCHEN", "port", Number(e.target.value))}
                      placeholder="9100"
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Ancho de papel */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Ancho de Bobina / Papel
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("KITCHEN", "paperWidth", "80mm")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-black transition ${
                        configs.KITCHEN.paperWidth === "80mm"
                          ? "border-amber-600 bg-amber-50 text-amber-900 shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <ReceiptText size={18} />
                      80mm (Estándar 48 col)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("KITCHEN", "paperWidth", "58mm")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-black transition ${
                        configs.KITCHEN.paperWidth === "58mm"
                          ? "border-amber-600 bg-amber-50 text-amber-900 shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <ReceiptText size={18} />
                      58mm (Compacto 32 col)
                    </button>
                  </div>
                </div>

                {/* Switches de Activación */}
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Habilitar impresión directa por red (TCP/IP)
                      </p>
                      <p className="text-xs text-slate-500">
                        Envía los comandos ESC/POS al puerto 9100.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configs.KITCHEN.isActive}
                      onChange={(e) => handleChange("KITCHEN", "isActive", e.target.checked)}
                      className="h-5 w-5 rounded-md accent-amber-600"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Auto-imprimir al confirmar pedido
                      </p>
                      <p className="text-xs text-slate-500">
                        Emite la comanda inmediatamente cuando entra el pedido.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configs.KITCHEN.autoPrint}
                      onChange={(e) => handleChange("KITCHEN", "autoPrint", e.target.checked)}
                      className="h-5 w-5 rounded-md accent-amber-600"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Acciones de Cocina */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={probandoTarget === "KITCHEN"}
                  onClick={() => handleProbarPing("KITCHEN")}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 active:scale-95 disabled:opacity-60"
                >
                  {probandoTarget === "KITCHEN" ? (
                    <LoaderCircle size={15} className="animate-spin text-amber-600" />
                  ) : (
                    <Wifi size={15} />
                  )}
                  Probar Ping
                </button>

                <button
                  type="button"
                  disabled={imprimiendo}
                  onClick={() => handleImprimirPrueba("KITCHEN")}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-900 shadow-xs transition hover:bg-amber-100 active:scale-95 disabled:opacity-60"
                >
                  <Zap size={15} className="text-amber-600" />
                  Test ESC/POS
                </button>
              </div>

              <button
                type="button"
                disabled={guardandoTarget === "KITCHEN"}
                onClick={() => handleGuardar("KITCHEN")}
                className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-slate-800 active:scale-95 disabled:opacity-60"
              >
                {guardandoTarget === "KITCHEN" ? (
                  <LoaderCircle size={16} className="animate-spin text-white" />
                ) : (
                  <Save size={16} />
                )}
                Guardar Cocina
              </button>
            </div>
          </div>

          {/* 2. Impresora de Recepción / Caja */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md md:p-7">
            <div>
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
                    <ReceiptText size={30} />
                  </div>
                  <div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
                      Destino: Caja / Recepción
                    </span>
                    <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                      Impresora de Caja y Cuentas
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                      configs.RECEPTION.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {configs.RECEPTION.isActive ? (
                      <>
                        <Wifi size={13} />
                        Red Activa
                      </>
                    ) : (
                      <>
                        <WifiOff size={13} />
                        Inactiva
                      </>
                    )}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                Emite las pre-cuentas para los comensales, notas de venta, boletas electrónicas y facturas al cerrar atenciones.
              </p>

              {/* Formulario */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Nombre Descriptivo
                  </label>
                  <input
                    type="text"
                    value={configs.RECEPTION.name}
                    onChange={(e) => handleChange("RECEPTION", "name", e.target.value)}
                    placeholder="Ej. Impresora Caja Principal"
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Dirección IP (Red Local)
                    </label>
                    <input
                      type="text"
                      value={configs.RECEPTION.ipAddress}
                      onChange={(e) => handleChange("RECEPTION", "ipAddress", e.target.value)}
                      placeholder="192.168.1.201"
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Puerto TCP
                    </label>
                    <input
                      type="number"
                      value={configs.RECEPTION.port}
                      onChange={(e) => handleChange("RECEPTION", "port", Number(e.target.value))}
                      placeholder="9100"
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Ancho de papel */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Ancho de Bobina / Papel
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("RECEPTION", "paperWidth", "80mm")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-black transition ${
                        configs.RECEPTION.paperWidth === "80mm"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <ReceiptText size={18} />
                      80mm (Estándar 48 col)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("RECEPTION", "paperWidth", "58mm")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-black transition ${
                        configs.RECEPTION.paperWidth === "58mm"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <ReceiptText size={18} />
                      58mm (Compacto 32 col)
                    </button>
                  </div>
                </div>

                {/* Switches de Activación */}
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Habilitar impresión directa por red (TCP/IP)
                      </p>
                      <p className="text-xs text-slate-500">
                        Envía los comandos ESC/POS al puerto 9100.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configs.RECEPTION.isActive}
                      onChange={(e) => handleChange("RECEPTION", "isActive", e.target.checked)}
                      className="h-5 w-5 rounded-md accent-emerald-600"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Auto-imprimir al emitir comprobante
                      </p>
                      <p className="text-xs text-slate-500">
                        Imprime el ticket y activa la gaveta de dinero inmediatamente.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configs.RECEPTION.autoPrint}
                      onChange={(e) => handleChange("RECEPTION", "autoPrint", e.target.checked)}
                      className="h-5 w-5 rounded-md accent-emerald-600"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Acciones de Recepción */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={probandoTarget === "RECEPTION"}
                  onClick={() => handleProbarPing("RECEPTION")}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 active:scale-95 disabled:opacity-60"
                >
                  {probandoTarget === "RECEPTION" ? (
                    <LoaderCircle size={15} className="animate-spin text-emerald-600" />
                  ) : (
                    <Wifi size={15} />
                  )}
                  Probar Ping
                </button>

                <button
                  type="button"
                  disabled={imprimiendo}
                  onClick={() => handleImprimirPrueba("RECEPTION")}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-900 shadow-xs transition hover:bg-emerald-100 active:scale-95 disabled:opacity-60"
                >
                  <Zap size={15} className="text-emerald-600" />
                  Test ESC/POS
                </button>
              </div>

              <button
                type="button"
                disabled={guardandoTarget === "RECEPTION"}
                onClick={() => handleGuardar("RECEPTION")}
                className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-slate-800 active:scale-95 disabled:opacity-60"
              >
                {guardandoTarget === "RECEPTION" ? (
                  <LoaderCircle size={16} className="animate-spin text-white" />
                ) : (
                  <Save size={16} />
                )}
                Guardar Caja
              </button>
            </div>
          </div>
        </div>

        {/* Guía Rápida de Conexión y Diagnóstico */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950 sm:text-xl">
                Guía de Conectividad e Impresión Térmica
              </h3>
              <p className="text-xs text-slate-500 sm:text-sm">
                Información técnica para conectar impresoras térmicas (EPSON, Xprinter, Rongta, Star, etc.) a la red Wi-Fi o cable Ethernet del restaurante.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                1. Dirección IP Estática
              </p>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Asigna una dirección IP fija a cada impresora en el router del restaurante (ej. <code className="rounded-sm bg-white px-1.5 py-0.5 font-bold text-slate-900 ring-1 ring-slate-200">192.168.1.200</code> para Cocina y <code className="rounded-sm bg-white px-1.5 py-0.5 font-bold text-slate-900 ring-1 ring-slate-200">192.168.1.201</code> para Caja).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                2. Puerto Estándar 9100
              </p>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Casi todas las impresoras térmicas de red utilizan el puerto TCP <code className="rounded-sm bg-white px-1.5 py-0.5 font-bold text-slate-900 ring-1 ring-slate-200">9100</code> (protocolo RAW socket).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                3. Modo Fallback Transparente
              </p>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Si la impresora se apaga o se queda sin papel, el sistema activará automáticamente la ventana de impresión térmica del navegador para no detener las ventas.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Vista Previa y Fallback */}
      <ThermalReceiptModal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        ticketHtml={ultimoResultado?.ticketHtml || ""}
        titulo={ultimoResultado?.titulo || "Ticket Térmico"}
        paperWidth={ultimoResultado?.paperWidth || "80mm"}
        networkPrinted={ultimoResultado?.networkPrinted}
        networkError={ultimoResultado?.error}
      />
    </main>
  );
}
