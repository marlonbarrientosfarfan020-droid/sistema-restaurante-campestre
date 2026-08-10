"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  onCerrar: () => void;
};

export default function CategoriaModal({
  abierto,
  titulo,
  descripcion,
  children,
  onCerrar,
}: Props) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
              Restaurante Chinka Chinka
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {titulo}
            </h2>

            {descripcion && (
              <p className="mt-1 text-sm text-slate-500">
                {descripcion}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
            aria-label="Cerrar ventana"
          >
            <X size={21} />
          </button>
        </header>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}