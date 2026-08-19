import { getPublicMenu } from "@/services/public-menu.service";
import { NavbarCampestre } from "@/components/public/NavbarCampestre";
import { HeroLuxury } from "@/components/public/HeroLuxury";
import { ExperienceHighlights } from "@/components/public/ExperienceHighlights";
import { PublicMenuContainer } from "@/components/public/PublicMenuContainer";
import { LocationAndHours } from "@/components/public/LocationAndHours";
import { FooterLuxury } from "@/components/public/FooterLuxury";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Carta Digital Gastronómica | Restaurante Campestre Chinka Chinka",
  description:
    "Descubre nuestra alta cocina campestre peruana, platos tradicionales a la leña, pescados, parrillas y bebidas típicas. Donde te pierdes con el buen sabor.",
  openGraph: {
    title: "Carta Digital Gourmet | Restaurante Campestre Chinka Chinka",
    description: "Donde te pierdes con el buen sabor. Explora nuestra carta gastronómica y reserva tu mesa.",
    images: [
      {
        url: "/img/hero-campestre.jpg",
        width: 1200,
        height: 630,
        alt: "Restaurante Campestre Chinka Chinka",
      },
    ],
  },
};

export default async function CartaPublicaPage() {
  const data = await getPublicMenu();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950">
      {/* Barra de Navegación Fija con Enlaces Ancla y Acciones */}
      <NavbarCampestre
        empresaNombre={data.empresa.nombre}
        telefono={data.empresa.telefono || undefined}
      />

      {/* Hero Header de Lujo */}
      <HeroLuxury />

      {/* 3 Destacados de Experiencia Campestre */}
      <ExperienceHighlights />

      {/* Carta Digital Gastronómica Interactiva (Filtros, Búsqueda, Grid 1 a 4 cols y Modal) */}
      <PublicMenuContainer
        categorias={data.categorias}
        productos={data.productos}
      />

      {/* Horarios, Ubicación y Reservas */}
      <LocationAndHours
        direccion={data.empresa.direccion || undefined}
        telefono={data.empresa.telefono || undefined}
        correo={data.empresa.correo || undefined}
      />

      {/* Pie de Página con Enlace Discreto para Staff */}
      <FooterLuxury
        empresaNombre={data.empresa.nombre}
        direccion={data.empresa.direccion || undefined}
        telefono={data.empresa.telefono || undefined}
        correo={data.empresa.correo || undefined}
        ruc={data.empresa.ruc || undefined}
      />
    </div>
  );
}
