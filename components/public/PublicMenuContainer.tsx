"use client";

import { useState, useMemo } from "react";
import { CategoryFilterBar } from "./CategoryFilterBar";
import { MenuGrid } from "./MenuGrid";
import { ProductDetailModal } from "./ProductDetailModal";
import type {
  PublicCategory,
  PublicProduct,
} from "@/services/public-menu.service";

interface PublicMenuContainerProps {
  categorias: PublicCategory[];
  productos: PublicProduct[];
}

export function PublicMenuContainer({
  categorias,
  productos,
}: PublicMenuContainerProps) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("TODOS");
  const [busqueda, setBusqueda] = useState<string>("");
  const [productoModal, setProductoModal] = useState<PublicProduct | null>(
    null
  );

  // Filtrado reactivo en tiempo real
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // Filtro por categoría
      const coincideCategoria =
        categoriaSeleccionada === "TODOS" ||
        p.categoria.id === categoriaSeleccionada;

      // Filtro por búsqueda de texto (nombre, descripción, categoría)
      const termino = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !termino ||
        p.nombre.toLowerCase().includes(termino) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(termino)) ||
        p.categoria.nombre.toLowerCase().includes(termino);

      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, categoriaSeleccionada, busqueda]);

  const handleResetFiltros = () => {
    setCategoriaSeleccionada("TODOS");
    setBusqueda("");
  };

  return (
    <section id="carta" className="relative bg-stone-950 min-h-screen py-10">
      {/* Barra de Filtros y Búsqueda */}
      <CategoryFilterBar
        categorias={categorias}
        categoriaSeleccionada={categoriaSeleccionada}
        onSelectCategoria={setCategoriaSeleccionada}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        totalPlatos={productos.length}
      />

      {/* Contenedor de la Cuadrícula de Platos */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Mostrando {productosFiltrados.length} de {productos.length} platos
          </p>

          {categoriaSeleccionada !== "TODOS" && (
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada("TODOS")}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              Ver todas las categorías
            </button>
          )}
        </div>

        {/* Grid de Platos */}
        <MenuGrid
          productos={productosFiltrados}
          onOpenDetail={(prod) => setProductoModal(prod)}
          onResetFiltros={handleResetFiltros}
        />
      </div>

      {/* Modal de Detalle */}
      <ProductDetailModal
        producto={productoModal}
        onClose={() => setProductoModal(null)}
      />
    </section>
  );
}
