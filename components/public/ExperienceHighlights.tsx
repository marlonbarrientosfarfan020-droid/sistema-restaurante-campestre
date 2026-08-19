"use client";

import { Flame, Trees, HeartHandshake, Sparkles, ChefHat, Compass } from "lucide-react";

export function ExperienceHighlights() {
  const highlights = [
    {
      icon: Flame,
      title: "Sazón Tradicional Campestre",
      description:
        "Fuego de leña, hierbas aromáticas de nuestros valles y recetas ancestrales peruanas elaboradas por maestros cocineros con ingredientes frescos y selectos.",
      accent: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/30 hover:border-amber-400",
      iconColor: "text-amber-400",
    },
    {
      icon: Trees,
      title: "Ambiente Natural & Familiar",
      description:
        "Respira aire puro rodeado de áreas verdes, jardines campestres y vistas panorámicas. El refugio perfecto para desconectar de la ciudad y celebrar en familia.",
      accent: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/30 hover:border-emerald-400",
      iconColor: "text-emerald-400",
    },
    {
      icon: HeartHandshake,
      title: "Atención de Primera & Tecnología",
      description:
        "Hospitalidad cálida desde tu llegada, servicio rápido y pedidos digitales vía QR en cada mesa para que disfrutes de tu estadía sin preocupaciones.",
      accent: "from-amber-500/20 to-yellow-500/10",
      border: "border-amber-500/30 hover:border-amber-400",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <section
      id="experiencia"
      className="relative bg-stone-950 py-20 px-4 sm:px-6 lg:px-8 border-t border-b border-stone-900 overflow-hidden"
    >
      {/* Fondo ambiental */}
      <div className="absolute inset-0 bg-radial-at-t from-stone-900/40 via-stone-950 to-stone-950 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        {/* Encabezado de Sección */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-stone-900/60 px-4 py-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">
            <ChefHat size={14} />
            <span>NUESTRA FILOSOFÍA</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-black text-white tracking-tight">
            Una experiencia campestre diseñada para{" "}
            <span className="text-amber-400 italic">cautivar tus sentidos</span>
          </h2>

          <p className="mt-4 text-stone-400 text-base sm:text-lg leading-relaxed">
            En Restaurante Campestre Chinka Chinka unimos el amor por la tierra, la pasión culinaria y la hospitalidad peruana para brindarte momentos inolvidables.
          </p>
        </div>

        {/* 3 Tarjetas de Experiencia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`relative rounded-3xl border ${item.border} bg-stone-900/60 bg-gradient-to-br ${item.accent} p-8 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl group`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950/80 border border-stone-800 shadow-inner mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={28} className={item.iconColor} />
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-black text-white mb-3 group-hover:text-amber-300 transition">
                  {item.title}
                </h3>

                <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-light">
                  {item.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400/80 group-hover:text-amber-300 transition">
                  <Sparkles size={13} />
                  <span>Calidad Chinka Chinka</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
