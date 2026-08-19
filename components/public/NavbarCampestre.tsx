"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  Phone,
  UtensilsCrossed,
  Sparkles,
  MapPin,
  Clock,
  LogIn,
} from "lucide-react";

interface NavbarCampestreProps {
  empresaNombre?: string;
  telefono?: string;
}

export function NavbarCampestre({
  empresaNombre = "Chinka Chinka",
  telefono = "+51 987 654 321",
}: NavbarCampestreProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const whatsappMessage = encodeURIComponent(
    "¡Hola Restaurante Campestre Chinka Chinka! Deseo información sobre la carta y realizar una reserva."
  );
  const whatsappUrl = `https://wa.me/51987654321?text=${whatsappMessage}`;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-stone-950/90 backdrop-blur-md border-b border-amber-500/20 shadow-2xl shadow-black/60 py-3"
            : "bg-gradient-to-b from-stone-950/90 via-stone-950/50 to-transparent py-5"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo y Marca */}
            <Link
              href="#inicio"
              className="flex items-center gap-3 group transition-transform duration-200 active:scale-95"
            >
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden border border-amber-500/30 bg-stone-900/90 p-1 shadow-lg shadow-amber-500/10 group-hover:border-amber-400 transition">
                <Image
                  src="/img/logo-chinka.png"
                  alt="Restaurante Campestre Chinka Chinka"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition">
                    {empresaNombre}
                  </span>
                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-amber-400/90">
                  Donde te pierdes con el buen sabor
                </p>
              </div>
            </Link>

            {/* Enlaces de Navegación (Desktop) */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href="#inicio"
                className="text-sm font-bold text-stone-300 hover:text-amber-400 transition duration-200"
              >
                Inicio
              </Link>
              <Link
                href="#carta"
                className="text-sm font-bold text-stone-300 hover:text-amber-400 transition duration-200 flex items-center gap-1.5"
              >
                <UtensilsCrossed size={15} className="text-amber-400" />
                Nuestra Carta
              </Link>
              <Link
                href="#experiencia"
                className="text-sm font-bold text-stone-300 hover:text-amber-400 transition duration-200"
              >
                Experiencia
              </Link>
              <Link
                href="#ubicacion"
                className="text-sm font-bold text-stone-300 hover:text-amber-400 transition duration-200 flex items-center gap-1.5"
              >
                <MapPin size={15} className="text-amber-400" />
                Ubicación
              </Link>
            </nav>

            {/* Acciones CTA */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-2xl border border-stone-700 bg-stone-900/80 px-3.5 py-2.5 text-xs font-bold text-stone-300 hover:border-amber-500/40 hover:text-white transition active:scale-95"
                title="Acceso Personal / Sistema POS"
              >
                <LogIn size={14} className="text-amber-400" />
                <span>Acceso POS</span>
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2.5 text-xs font-black text-stone-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                <Phone size={14} className="text-stone-950 fill-stone-950" />
                <span>Reservar Mesa</span>
              </a>
            </div>

            {/* Botón Menú Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-800 bg-stone-900 text-stone-300 hover:text-white hover:border-amber-500/40 transition"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-20 left-4 right-4 rounded-3xl border border-amber-500/30 bg-stone-950/95 p-6 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <nav className="flex flex-col gap-4">
              <Link
                href="#inicio"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl bg-stone-900/60 p-4 text-base font-black hover:bg-amber-500/10 hover:text-amber-400 transition"
              >
                <span>Inicio</span>
                <span className="text-xs text-amber-400">01</span>
              </Link>

              <Link
                href="#carta"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl bg-stone-900/60 p-4 text-base font-black hover:bg-amber-500/10 hover:text-amber-400 transition"
              >
                <span className="flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-amber-400" />
                  Nuestra Carta Digital
                </span>
                <span className="text-xs text-amber-400">02</span>
              </Link>

              <Link
                href="#experiencia"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl bg-stone-900/60 p-4 text-base font-black hover:bg-amber-500/10 hover:text-amber-400 transition"
              >
                <span>Experiencia Campestre</span>
                <span className="text-xs text-amber-400">03</span>
              </Link>

              <Link
                href="#ubicacion"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl bg-stone-900/60 p-4 text-base font-black hover:bg-amber-500/10 hover:text-amber-400 transition"
              >
                <span className="flex items-center gap-2">
                  <MapPin size={18} className="text-amber-400" />
                  Ubicación y Horarios
                </span>
                <span className="text-xs text-amber-400">04</span>
              </Link>

              <div className="pt-2 border-t border-stone-800 flex flex-col gap-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/20"
                >
                  <Phone size={16} />
                  <span>Reservar por WhatsApp</span>
                </a>

                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-stone-700 bg-stone-900 p-3.5 text-xs font-bold text-stone-300"
                >
                  <LogIn size={15} className="text-amber-400" />
                  <span>Acceso Sistema POS</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
