"use client";

import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Car,
  Compass,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

interface LocationAndHoursProps {
  direccion?: string;
  telefono?: string;
  correo?: string;
}

export function LocationAndHours({
  direccion = "Valle Campestre Chinka Chinka, Km 14.5, Perú",
  telefono = "+51 987 654 321",
  correo = "contacto@chinkachinka.pe",
}: LocationAndHoursProps) {
  const whatsappUrl = `https://wa.me/51987654321?text=${encodeURIComponent(
    "¡Hola Restaurante Campestre Chinka Chinka! Deseo información de cómo llegar y realizar una reserva."
  )}`;

  return (
    <section
      id="ubicacion"
      className="relative bg-stone-950 py-20 px-4 sm:px-6 lg:px-8 border-t border-stone-900 overflow-hidden"
    >
      {/* Luz ambiental dorada */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-stone-900/60 px-4 py-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">
            <Compass size={14} />
            <span>VISÍTANOS EN EL VALLE</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ubicación, Horarios y{" "}
            <span className="text-amber-400 italic">Reservas</span>
          </h2>

          <p className="mt-4 text-stone-400 text-base sm:text-lg font-light leading-relaxed">
            Estamos ubicados en un entorno natural privilegiado, de fácil acceso y con amplio estacionamiento privado para la tranquilidad de tu familia.
          </p>
        </div>

        {/* Grid de 2 Columnas: Info y Tarjeta de Ubicación */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Columna Izquierda: Horarios y Contacto */}
          <div className="flex flex-col justify-between space-y-6 rounded-3xl border border-stone-800/80 bg-stone-900/60 p-6 sm:p-8 backdrop-blur-md">
            <div>
              <h3 className="font-serif text-2xl font-black text-white mb-6 flex items-center gap-2.5">
                <Clock className="text-amber-400" size={24} />
                <span>Horarios de Atención Campestre</span>
              </h3>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-950/60 border border-stone-800">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="font-bold text-white text-sm">Martes a Viernes</p>
                      <p className="text-xs text-stone-400">Almuerzos campestres</p>
                    </div>
                  </div>
                  <span className="font-serif font-black text-amber-400 text-sm">
                    11:30 AM – 5:30 PM
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <div>
                      <p className="font-bold text-amber-200 text-sm">Sábados, Domingos y Feriados</p>
                      <p className="text-xs text-amber-300/80">Experiencia familiar y parrillas</p>
                    </div>
                  </div>
                  <span className="font-serif font-black text-amber-400 text-base">
                    10:30 AM – 6:30 PM
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-950/60 border border-stone-800/60 text-stone-400">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-stone-600" />
                    <div>
                      <p className="font-bold text-stone-400 text-sm">Lunes</p>
                      <p className="text-xs text-stone-500">Mantenimiento de jardines</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-stone-500 uppercase">Cerrado</span>
                </div>
              </div>
            </div>

            {/* Datos de Contacto y Servicios */}
            <div className="pt-6 border-t border-stone-800/80 space-y-4">
              <div className="flex items-center gap-3 text-stone-300 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-950 border border-stone-800 text-amber-400 shrink-0">
                  <MapPin size={17} />
                </div>
                <span>{direccion}</span>
              </div>

              <div className="flex items-center gap-3 text-stone-300 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-950 border border-stone-800 text-amber-400 shrink-0">
                  <Car size={17} />
                </div>
                <span>Estacionamiento privado y gratuito para comensales</span>
              </div>

              <div className="flex items-center gap-3 text-stone-300 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-950 border border-stone-800 text-amber-400 shrink-0">
                  <Phone size={17} />
                </div>
                <span>Atención y Reservas: {telefono}</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Mapa / Reserva Directa */}
          <div className="flex flex-col justify-between rounded-3xl border border-amber-500/30 bg-gradient-to-br from-stone-900/80 via-stone-900/40 to-amber-950/20 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30 mb-4">
                <Sparkles size={12} />
                <span>EXPERIENCIA CAMPESTRE EXCLUSIVA</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-black text-white mb-4">
                Planifica tu visita o reserva para grupos y eventos
              </h3>

              <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed mb-6">
                Contamos con amplias zonas familiares, terraza al aire libre y zonas campestres ideales para cumpleaños, reuniones familiares y fechas especiales.
              </p>

              {/* Vista simulada de mapa estilizado */}
              <div className="relative rounded-2xl border border-stone-800 bg-stone-950/80 p-6 text-center overflow-hidden mb-6">
                <div className="absolute inset-0 bg-radial-at-c from-amber-500/10 via-transparent to-stone-950" />
                <MapPin className="mx-auto text-amber-400 mb-2 animate-bounce" size={32} />
                <p className="font-serif font-black text-white text-base">
                  Restaurante Campestre Chinka Chinka
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Valle Campestre, Perú • A sólo 20 min del centro
                </p>
              </div>
            </div>

            {/* Botón de Acción WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 p-4 text-base font-black text-stone-950 shadow-xl shadow-amber-500/25 transition-all duration-200 active:scale-95"
            >
              <CalendarCheck size={20} className="text-stone-950" />
              <span>Reservar Mesa o Consultar por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
