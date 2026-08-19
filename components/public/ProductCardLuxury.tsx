"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, Sparkles, ChevronRight, Eye, Phone } from "lucide-react";
import type { PublicProduct } from "@/services/public-menu.service";

interface ProductCardLuxuryProps {
  producto: PublicProduct;
  onOpenDetail: (producto: PublicProduct) => void;
}

export function ProductCardLuxury({
  producto,
  onOpenDetail,
}: ProductCardLuxuryProps) {
  const [imageError, setImageError] = useState(false);

  // Formateador de dinero
  const precioFormateado = `S/ ${Number(producto.precioVenta).toFixed(2)}`;

  // Imagen fallback inteligente
  const imagenSrc =
    !imageError && producto.imagenUrl
      ? producto.imagenUrl
      : "/img/chinka-gastronomia.png";

  return (
    <article
      onClick={() => onOpenDetail(producto)}
      className="group relative flex flex-col justify-between rounded-3xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-md overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer"
    >
      {/* Contenedor de Imagen con Efecto Zoom */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-950">
        <Image
          src={imagenSrc}
          alt={producto.nombre}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
          onError={() => setImageError(true)}
        />
        {/* Degradado sutil sobre la foto */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30" />

        {/* Badge de Categoría Superior Izquierdo */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/85 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/30 shadow-md">
            <Sparkles size={10} className="text-amber-400" />
            {producto.categoria.nombre}
          </span>
        </div>

        {/* Badge de Disponibilidad Superior Derecho */}
        <div className="absolute top-3 right-3 z-10">
          {producto.disponible ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Disponible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-rose-400 border border-rose-500/30">
              Agotado por hoy
            </span>
          )}
        </div>

        {/* Indicador de Tiempo de Preparación en la esquina inferior */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-[11px] font-bold text-stone-300 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-stone-800">
          <Clock size={12} className="text-amber-400" />
          <span>{producto.tiempoPreparacion} min aprox</span>
        </div>
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          {/* Nombre del Plato */}
          <h4 className="font-serif text-lg sm:text-xl font-black text-white group-hover:text-amber-400 transition-colors duration-200 line-clamp-1 mb-2">
            {producto.nombre}
          </h4>

          {/* Descripción */}
          <p className="text-xs sm:text-sm text-stone-400 line-clamp-2 leading-relaxed font-light mb-4">
            {producto.descripcion ||
              "Plato tradicional preparado al momento con los más selectos ingredientes campestres."}
          </p>
        </div>

        {/* Fila de Precio y Acción */}
        <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Precio</p>
            <p className="font-serif text-xl sm:text-2xl font-black text-amber-400 drop-shadow-sm">
              {precioFormateado}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(producto);
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 border border-stone-700 hover:border-amber-400 px-3.5 py-2 text-xs font-black text-stone-200 transition-all duration-200 active:scale-95 group/btn"
          >
            <span>Ver Detalle</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </article>
  );
}
