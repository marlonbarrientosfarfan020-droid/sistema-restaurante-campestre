"use client";

import React, { useRef, useEffect } from "react";
import { X, Printer, Check, Copy } from "lucide-react";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  ticketHtml: string;
  titulo?: string;
  autoPrint?: boolean;
  paperWidth?: "58mm" | "80mm";
  networkPrinted?: boolean;
  networkError?: string;
};

export function ThermalReceiptModal({
  isOpen,
  onClose,
  ticketHtml,
  titulo = "Vista Previa de Ticket",
  autoPrint = false,
  paperWidth = "80mm",
  networkPrinted = false,
  networkError,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copiado, setCopiado] = React.useState(false);

  const ejecutarImpresionNavegador = () => {
    if (iframeRef.current?.contentWindow) {
      const cw = iframeRef.current.contentWindow;
      cw.focus();
      cw.print();
    }
  };

  useEffect(() => {
    if (isOpen && autoPrint && !networkPrinted) {
      const timer = setTimeout(() => {
        ejecutarImpresionNavegador();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, networkPrinted]);

  const copiarContenido = () => {
    try {
      if (iframeRef.current?.contentDocument?.body) {
        const texto = iframeRef.current.contentDocument.body.innerText;
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        toast.success("Texto del ticket copiado al portapapeles");
        setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      toast.error("No se pudo copiar el texto");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight text-white sm:text-lg">
                {titulo}
              </h3>
              <p className="text-xs text-amber-200/80">
                Formato térmico {paperWidth}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notificación de estado si falló red */}
        {networkError && !networkPrinted && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900">
            ⚠️ Impresora de red no respondió. Modo de impresión por navegador activo.
          </div>
        )}

        {networkPrinted && (
          <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
            ✓ Ticket enviado con éxito a la impresora de red.
          </div>
        )}

        {/* Visor térmico (Simulación de rollo de papel) */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div
            className={`mx-auto rounded-xl bg-white p-2 shadow-md ring-1 ring-slate-200 ${
              paperWidth === "58mm" ? "max-w-[260px]" : "max-w-[340px]"
            }`}
          >
            <iframe
              ref={iframeRef}
              srcDoc={ticketHtml}
              title="Ticket térmico"
              className="h-[400px] w-full border-0 sm:h-[450px]"
            />
          </div>
        </div>

        {/* Acciones inferiores */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 p-4">
          <button
            type="button"
            onClick={copiarContenido}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
          >
            {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copiado ? "Copiado" : "Copiar texto"}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={ejecutarImpresionNavegador}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-amber-600/20 transition hover:from-amber-500 hover:to-amber-600 active:scale-95 sm:text-sm"
            >
              <Printer size={16} />
              Imprimir ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
