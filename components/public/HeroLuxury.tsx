"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  UtensilsCrossed,
  MapPin,
  ChevronDown,
  Flame,
  Trees,
  Award,
} from "lucide-react";

export function HeroLuxury() {
  return (
    <section
      id="inicio"
      className="relative min-h-[92vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-stone-950 pt-20"
    >
      {/* Imagen de fondo con optimización y superposición oscura campestre */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/img/hero-campestre.jpg"
          alt="Restaurante Campestre Chinka Chinka - Paisaje y Gastronomía"
          fill
          className="object-cover object-center scale-105 animate-pulse"
          style={{ animationDuration: "12s" }}
          priority
        />
        {/* Degradados sofisticados para garantizar legibilidad de alta gama */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/40" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-stone-950/40 to-stone-950/90" />
      </div>

      {/* Partículas y resplandores dorados ambientales */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Contenido Principal */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-20">
        {/* Badge de Bienvenida */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-stone-900/80 px-4 py-2 text-xs sm:text-sm font-bold text-amber-300 backdrop-blur-md shadow-lg shadow-amber-500/10 mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Sparkles size={16} className="text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
          <span>ALTA COCINA TRADICIONAL & SABOR CAMPESTRE</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        </div>

        {/* Titular Principal */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.08] mb-6 drop-shadow-2xl">
          Donde te pierdes con{" "}
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent italic">
            el buen sabor
          </span>
        </h1>

        {/* Subtítulo de Marca */}
        <p className="mx-auto max-w-2xl text-base sm:text-xl text-stone-300 font-light leading-relaxed mb-10 drop-shadow-md">
          La auténtica sazón de nuestros valles, el aroma inconfundible de la leña y los mejores ingredientes peruanos en un entorno natural y acogedor para compartir en familia.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="#carta"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 px-8 py-4 text-base font-black text-stone-950 shadow-xl shadow-amber-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <UtensilsCrossed size={20} className="text-stone-950" />
            <span>Explorar Nuestra Carta Digital</span>
          </Link>

          <Link
            href="#ubicacion"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-stone-950/60 hover:bg-stone-900/90 hover:border-amber-400 px-7 py-4 text-base font-bold text-stone-200 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <MapPin size={18} className="text-amber-400" />
            <span>Ver Ubicación & Horarios</span>
          </Link>
        </div>

        {/* Estadísticas / Sellos de Calidad */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto border-t border-stone-800/80 pt-8">
          <div className="rounded-2xl border border-stone-800/80 bg-stone-950/50 backdrop-blur-sm p-3 sm:p-4 text-center">
            <Flame className="mx-auto text-amber-400 mb-1" size={22} />
            <p className="font-serif text-lg sm:text-2xl font-black text-amber-300">100%</p>
            <p className="text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Cocina a la Leña
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800/80 bg-stone-950/50 backdrop-blur-sm p-3 sm:p-4 text-center">
            <Trees className="mx-auto text-emerald-400 mb-1" size={22} />
            <p className="font-serif text-lg sm:text-2xl font-black text-emerald-300">Campestre</p>
            <p className="text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Jardines & Valles
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800/80 bg-stone-950/50 backdrop-blur-sm p-3 sm:p-4 text-center">
            <Award className="mx-auto text-amber-400 mb-1" size={22} />
            <p className="font-serif text-lg sm:text-2xl font-black text-amber-300">+15 Años</p>
            <p className="text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Tradición Culinaria
            </p>
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-stone-500 animate-bounce">
        <Link href="#carta" aria-label="Ir a la carta">
          <ChevronDown size={28} className="text-amber-400/80 hover:text-amber-300 transition" />
        </Link>
      </div>
    </section>
  );
}
