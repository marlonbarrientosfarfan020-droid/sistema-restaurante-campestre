"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Heart,
  Lock,
  UtensilsCrossed,
  Clock,
} from "lucide-react";

interface FooterLuxuryProps {
  empresaNombre?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  ruc?: string;
}

export function FooterLuxury({
  empresaNombre = "Restaurante Campestre Chinka Chinka",
  direccion = "Valle Campestre Chinka Chinka, Perú",
  telefono = "+51 987 654 321",
  correo = "contacto@chinkachinka.pe",
  ruc = "20600000001",
}: FooterLuxuryProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-950 border-t border-stone-900 text-stone-300 pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Columna 1: Marca & Eslogan */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden border border-amber-500/30 bg-stone-900 p-1">
                <Image
                  src="/img/logo-chinka.png"
                  alt={empresaNombre}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h4 className="font-serif text-xl font-black text-white">{empresaNombre}</h4>
                <p className="text-[10px] uppercase font-bold text-amber-400">
                  RUC: {ruc}
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-400 font-light leading-relaxed">
              &quot;Donde te pierdes con el buen sabor&quot;. Alta gastronomía campestre peruana, tradición a la leña y hospitalidad en el corazón del valle.
            </p>

            <div className="flex items-center gap-2 text-xs text-amber-400/90 font-semibold">
              <Sparkles size={14} />
              <span>Experiencia 100% familiar</span>
            </div>
          </div>

          {/* Columna 2: Navegación Rápida */}
          <div>
            <h5 className="font-serif text-base font-black text-white mb-4 uppercase tracking-wider">
              Navegación
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#inicio" className="hover:text-amber-400 transition">
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="#carta"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <UtensilsCrossed size={14} className="text-amber-400" />
                  <span>Nuestra Carta Digital</span>
                </Link>
              </li>
              <li>
                <Link href="#experiencia" className="hover:text-amber-400 transition">
                  Nuestra Experiencia
                </Link>
              </li>
              <li>
                <Link href="#ubicacion" className="hover:text-amber-400 transition">
                  Ubicación & Horarios
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto Directo */}
          <div>
            <h5 className="font-serif text-base font-black text-white mb-4 uppercase tracking-wider">
              Contacto & Reservas
            </h5>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-stone-400">{direccion}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-amber-400 shrink-0" />
                <a
                  href={`tel:${telefono.replace(/\s+/g, "")}`}
                  className="hover:text-amber-400 transition text-stone-300"
                >
                  {telefono}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-amber-400 shrink-0" />
                <a
                  href={`mailto:${correo}`}
                  className="hover:text-amber-400 transition text-stone-300"
                >
                  {correo}
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Horarios y Ambiente */}
          <div className="space-y-3">
            <h5 className="font-serif text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <span>Horarios de Atención</span>
            </h5>
            <p className="text-xs text-stone-300 leading-relaxed">
              <strong className="text-white">Martes a Viernes:</strong> 11:30 AM – 5:30 PM
            </p>
            <p className="text-xs text-stone-300 leading-relaxed">
              <strong className="text-amber-400">Sábados, Domingos y Feriados:</strong> 10:30 AM – 6:30 PM
            </p>
            <p className="text-xs text-stone-500 italic">
              Lunes cerrado por mantenimiento de jardines.
            </p>
          </div>
        </div>

        {/* Barra Inferior de Copyright y Acceso Discreto */}
        <div className="pt-8 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {currentYear} {empresaNombre}. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-6">
            <p className="flex items-center gap-1.5">
              <span>Sabor campestre peruano</span>
              <Heart size={13} className="text-amber-400 fill-amber-400 inline" />
            </p>

            {/* Enlace sutil y minimalista para el personal */}
            <Link
              href="/login"
              className="text-stone-500 hover:text-amber-400 text-xs transition-colors py-1 inline-flex items-center gap-1.5"
              title="Acceso exclusivo para el personal"
            >
              <Lock size={13} className="text-stone-500 hover:text-amber-400" />
              <span>🔒 Acceso Personal / Staff</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
