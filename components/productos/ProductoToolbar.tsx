"use client";

import {
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";

type Props = {
  busqueda: string;
  categoriaId: string;
  categorias: Array<{
    id: string;
    nombre: string;
  }>;
  cargando: boolean;
  onCambiarBusqueda: (valor: string) => void;
  onCambiarCategoria: (valor: string) => void;
  onNuevo: () => void;
  onRecargar: () => void;
};

export default function ProductoToolbar({
  busqueda,
  categoriaId,
  categorias,
  cargando,
  onCambiarBusqueda,
  onCambiarCategoria,
  onNuevo,
  onRecargar,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px_auto]">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={busqueda}
            onChange={(evento) =>
              onCambiarBusqueda(evento.target.value)
            }
            placeholder="Buscar plato por nombre, código o descripción..."
            className="w-full rounded-2xl border border-slate-300 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>

        <select
          value={categoriaId}
          onChange={(evento) =>
            onCambiarCategoria(evento.target.value)
          }
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        >
          <option value="">Todas las categorías</option>

          {categorias.map((categoria) => (
            <option
              key={categoria.id}
              value={categoria.id}
            >
              {categoria.nombre}
            </option>
          ))}
        </select>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRecargar}
            disabled={cargando}
            className="flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            title="Actualizar productos"
          >
            <RefreshCcw
              size={20}
              className={cargando ? "animate-spin" : ""}
            />
          </button>

          <button
            type="button"
            onClick={onNuevo}
            className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-amber-500 px-5 py-3.5 font-black text-slate-950 transition hover:bg-amber-400"
          >
            <Plus size={20} />
            Nuevo producto
          </button>
        </div>
      </div>
    </section>
  );
}