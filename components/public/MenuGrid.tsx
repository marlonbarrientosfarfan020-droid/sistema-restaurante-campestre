"use client";

import { UtensilsCrossed, RotateCcw } from "lucide-react";
import { ProductCardLuxury } from "./ProductCardLuxury";
import type { PublicProduct } from "@/services/public-menu.service";

interface MenuGridProps {
  productos: PublicProduct[];
  onOpenDetail: (producto: PublicProduct) => void;
  onResetFiltros: () => void;
}

export function MenuGrid({
  productos,
  onOpenDetail,
  onResetFiltros,
}: MenuGridProps) {
  if (productos.length === 0) {
    return (
      <div className="rounded-3xl border border-stone-800/80 bg-stone-900/40 p-12 text-center max-w-lg mx-auto my-12 backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto mb-4">
          <UtensilsCrossed size={32} />
        </div>
        <h4 className="font-serif text-xl font-black text-white mb-2">
          No se encontraron platos
        </h4>
        <p className="text-sm text-stone-400 font-light mb-6">
          No encontramos opciones que coincidan con tu búsqueda o filtro seleccionado.
        </p>
        <button
          type="button"
          onClick={onResetFiltros}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-xs font-black text-stone-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          <RotateCcw size={15} />
          <span>Ver todos los platos</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 sm:gap-7">
      {productos.map((producto) => (
        <ProductCardLuxury
          key={producto.id}
          producto={producto}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}
