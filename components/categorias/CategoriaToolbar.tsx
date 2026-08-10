"use client";

import {
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";

type Props = {
  busqueda: string;
  cargando: boolean;
  onCambiarBusqueda: (valor: string) => void;
  onNuevaCategoria: () => void;
  onRecargar: () => void;
};

export default function CategoriaToolbar({
  busqueda,
  cargando,
  onCambiarBusqueda,
  onNuevaCategoria,
  onRecargar,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-md">
        <Search
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={busqueda}
          onChange={(evento) =>
            onCambiarBusqueda(evento.target.value)
          }
          placeholder="Buscar por código, nombre o descripción..."
          className="w-full rounded-2xl border border-slate-300 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRecargar}
          disabled={cargando}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3.5 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCcw
            size={19}
            className={
              cargando ? "animate-spin" : ""
            }
          />
          Actualizar
        </button>

        <button
          type="button"
          onClick={onNuevaCategoria}
          className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3.5 font-black text-slate-950 transition hover:bg-amber-400"
        >
          <Plus size={20} />
          Nueva categoría
        </button>
      </div>
    </div>
  );
}