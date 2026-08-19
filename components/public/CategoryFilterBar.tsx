"use client";

import { useRef } from "react";
import { Search, X, UtensilsCrossed, Sparkles } from "lucide-react";
import type { PublicCategory } from "@/services/public-menu.service";

interface CategoryFilterBarProps {
  categorias: PublicCategory[];
  categoriaSeleccionada: string;
  onSelectCategoria: (categoriaId: string) => void;
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  totalPlatos: number;
}

export function CategoryFilterBar({
  categorias,
  categoriaSeleccionada,
  onSelectCategoria,
  busqueda,
  onBusquedaChange,
  totalPlatos,
}: CategoryFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-[68px] z-30 bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/80 shadow-2xl py-4 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Fila Superior: Buscador y Contador */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <UtensilsCrossed size={16} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-black text-white">Nuestra Carta Digital</h3>
              <p className="text-xs text-stone-400">
                {totalPlatos} {totalPlatos === 1 ? "plato disponible" : "platos y bebidas disponibles"}
              </p>
            </div>
          </div>

          {/* Input de Búsqueda en Tiempo Real */}
          <div className="relative w-full sm:w-80">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="Buscar por plato, ingrediente..."
              className="w-full rounded-2xl border border-stone-800 bg-stone-900/90 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => onBusquedaChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1"
                aria-label="Limpiar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Fila Inferior: Píldoras de Categorías con Scroll Horizontal */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth"
        >
          {/* Botón "Todos" */}
          <button
            type="button"
            onClick={() => onSelectCategoria("TODOS")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${
              categoriaSeleccionada === "TODOS"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/25 border border-amber-400"
                : "bg-stone-900/80 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-white"
            }`}
          >
            <Sparkles size={14} className={categoriaSeleccionada === "TODOS" ? "text-stone-950" : "text-amber-400"} />
            <span>Todos los Platos</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                categoriaSeleccionada === "TODOS"
                  ? "bg-stone-950/20 text-stone-950"
                  : "bg-stone-800 text-stone-400"
              }`}
            >
              {totalPlatos}
            </span>
          </button>

          {/* Categorías dinámicas desde Prisma */}
          {categorias.map((cat) => {
            const activo = categoriaSeleccionada === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategoria(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${
                  activo
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/25 border border-amber-400"
                    : "bg-stone-900/80 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-white"
                }`}
              >
                <span>{cat.nombre}</span>
                {cat.totalProductos > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activo
                        ? "bg-stone-950/20 text-stone-950"
                        : "bg-stone-800 text-stone-400"
                    }`}
                  >
                    {cat.totalProductos}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
