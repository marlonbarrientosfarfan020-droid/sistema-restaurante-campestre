"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  Clock,
  Sparkles,
  Phone,
  ChefHat,
  Utensils,
  CheckCircle2,
  Wine,
} from "lucide-react";
import type { PublicProduct } from "@/services/public-menu.service";

interface ProductDetailModalProps {
  producto: PublicProduct | null;
  onClose: () => void;
}

export function ProductDetailModal({
  producto,
  onClose,
}: ProductDetailModalProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (producto) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [producto, onClose]);

  if (!producto) return null;

  const precioFormateado = `S/ ${Number(producto.precioVenta).toFixed(2)}`;

  const imagenSrc =
    !imageError && producto.imagenUrl
      ? producto.imagenUrl
      : "/img/chinka-gastronomia.png";

  const whatsappMessage = encodeURIComponent(
    `¡Hola Restaurante Campestre Chinka Chinka! Deseo consultar/pedir el plato: "${producto.nombre}" (${precioFormateado}).`
  );
  const whatsappUrl = `https://wa.me/51987654321?text=${whatsappMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-stone-950/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] sm:max-h-[88vh] w-full sm:max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-stone-950 border border-amber-500/30 text-white shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Foto Grande y Encabezado con Botón Cerrar */}
        <div className="relative aspect-video w-full bg-stone-900 overflow-hidden">
          <Image
            src={imagenSrc}
            alt={producto.nombre}
            fill
            className="object-cover object-center"
            onError={() => setImageError(true)}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/60" />

          {/* Botón de Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-950/80 text-stone-300 hover:text-white border border-stone-800 hover:border-amber-500/50 backdrop-blur-md transition active:scale-95"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>

          {/* Badges superiores */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/85 backdrop-blur-md px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300 border border-amber-500/30">
              <Sparkles size={12} className="text-amber-400" />
              {producto.categoria.nombre}
            </span>

            {producto.disponible ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/85 backdrop-blur-md px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Disponible hoy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/85 backdrop-blur-md px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/30">
                Agotado por hoy
              </span>
            )}
          </div>

          {/* Nombre y Precio sobre la foto inferior */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Especialidad Campestre
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-black text-white drop-shadow-md">
                {producto.nombre}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Precio</span>
              <span className="font-serif text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-md">
                {precioFormateado}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido del Modal (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Descripción Completa */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <Utensils size={14} className="text-amber-400" />
              <span>Descripción del Plato</span>
            </h4>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-light">
              {producto.descripcion ||
                "Exquisita preparación tradicional campestre elaborada con ingredientes frescos seleccionados y el toque maestro de nuestra cocina a la leña."}
            </p>
          </div>

          {/* Tiempo de Preparación y Sello Artesanal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400">Tiempo de Cocina</p>
                <p className="text-sm font-black text-white">{producto.tiempoPreparacion} minutos aprox</p>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ChefHat size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400">Preparación</p>
                <p className="text-sm font-black text-white">100% al momento</p>
              </div>
            </div>
          </div>

          {/* Sugerencia de Maridaje / Bebida Campestre */}
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-stone-900/60 p-4 flex items-start gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
              <Wine size={18} />
            </div>
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-amber-300">Maridaje & Acompañamiento Recomendado</p>
              <p className="text-stone-300 font-light mt-0.5">
                Acompáñalo con nuestra Chicha Morada natural de la casa o un refrescante Maracuyá Sour campestre.
              </p>
            </div>
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="border-t border-stone-800 p-4 sm:p-5 bg-stone-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 py-3.5 px-6 font-black text-stone-950 shadow-xl shadow-amber-500/20 transition-all duration-200 active:scale-95 text-sm"
          >
            <Phone size={17} className="fill-stone-950" />
            <span>Consultar / Pedir por WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-2xl border border-stone-700 bg-stone-800 hover:bg-stone-700 py-3.5 px-6 text-sm font-bold text-stone-300 transition active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
