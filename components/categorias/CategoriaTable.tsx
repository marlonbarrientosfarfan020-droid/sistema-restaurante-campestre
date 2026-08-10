"use client";

import {
  Archive,
  Pencil,
  RotateCcw,
} from "lucide-react";

import type { Categoria } from "@/types/categoria";

type Props = {
  categorias: Categoria[];
  guardando: boolean;
  onEditar: (categoria: Categoria) => void;
  onDesactivar: (categoria: Categoria) => void;
};

export default function CategoriaTable({
  categorias,
  guardando,
  onEditar,
  onDesactivar,
}: Props) {
  if (categorias.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-xl font-black text-slate-800">
          No se encontraron categorías
        </p>

        <p className="mt-2 text-slate-500">
          Crea la primera categoría del restaurante.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[850px] w-full">
          <thead className="bg-slate-950 text-white">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider">
                Código
              </th>

              <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider">
                Nombre
              </th>

              <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider">
                Descripción
              </th>

              <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider">
                Estado
              </th>

              <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {categorias.map((categoria) => (
              <tr
                key={categoria.id}
                className="transition hover:bg-amber-50/50"
              >
                <td className="px-5 py-4">
                  <span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm font-bold text-slate-700">
                    {categoria.codigo}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <p className="font-black text-slate-900">
                    {categoria.nombre}
                  </p>
                </td>

                <td className="max-w-md px-5 py-4 text-sm text-slate-500">
                  {categoria.descripcion ||
                    "Sin descripción"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                      categoria.activa
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {categoria.activa
                      ? "Activa"
                      : "Inactiva"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditar(categoria)}
                      disabled={guardando}
                      title="Editar categoría"
                      className="rounded-xl bg-blue-50 p-2.5 text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      <Pencil size={18} />
                    </button>

                    {categoria.activa && (
                      <button
                        type="button"
                        onClick={() =>
                          onDesactivar(categoria)
                        }
                        disabled={guardando}
                        title="Desactivar categoría"
                        className="rounded-xl bg-red-50 p-2.5 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <Archive size={18} />
                      </button>
                    )}

                    {!categoria.activa && (
                      <span
                        title="La reactivación se realizará desde Editar"
                        className="rounded-xl bg-slate-100 p-2.5 text-slate-400"
                      >
                        <RotateCcw size={18} />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}