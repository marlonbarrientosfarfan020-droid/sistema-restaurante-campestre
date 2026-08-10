"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { LoaderCircle, Save } from "lucide-react";

import type { Categoria } from "@/types/categoria";

type Props = {
  categoria?: Categoria | null;
  guardando: boolean;
  onGuardar: (datos: {
    nombre: string;
    descripcion: string;
    activa: boolean;
  }) => Promise<boolean>;
};

export default function CategoriaForm({
  categoria,
  guardando,
  onGuardar,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activa, setActiva] = useState(true);
  const [errorLocal, setErrorLocal] = useState("");

  useEffect(() => {
    setNombre(categoria?.nombre ?? "");
    setDescripcion(categoria?.descripcion ?? "");
    setActiva(categoria?.activa ?? true);
    setErrorLocal("");
  }, [categoria]);

  async function enviarFormulario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      setErrorLocal(
        "Debes ingresar el nombre de la categoría."
      );
      return;
    }

    if (nombreLimpio.length < 2) {
      setErrorLocal(
        "El nombre debe tener al menos 2 caracteres."
      );
      return;
    }

    setErrorLocal("");

    await onGuardar({
      nombre: nombreLimpio,
      descripcion: descripcion.trim(),
      activa,
    });
  }

  return (
    <form
      onSubmit={enviarFormulario}
      className="space-y-5"
    >
      {errorLocal && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorLocal}
        </div>
      )}

      <div>
        <label
          htmlFor="categoria-nombre"
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          Nombre de la categoría
        </label>

        <input
          id="categoria-nombre"
          value={nombre}
          onChange={(evento) =>
            setNombre(evento.target.value)
          }
          placeholder="Ejemplo: Parrillas"
          maxLength={80}
          disabled={guardando}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label
          htmlFor="categoria-descripcion"
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          Descripción
        </label>

        <textarea
          id="categoria-descripcion"
          value={descripcion}
          onChange={(evento) =>
            setDescripcion(evento.target.value)
          }
          placeholder="Descripción opcional"
          maxLength={250}
          rows={4}
          disabled={guardando}
          className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:bg-slate-100"
        />

        <p className="mt-1 text-right text-xs text-slate-400">
          {descripcion.length}/250
        </p>
      </div>

      {categoria && (
        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="font-bold text-slate-900">
              Categoría activa
            </p>

            <p className="text-sm text-slate-500">
              Las categorías inactivas no aparecerán en el
              menú.
            </p>
          </div>

          <input
            type="checkbox"
            checked={activa}
            onChange={(evento) =>
              setActiva(evento.target.checked)
            }
            disabled={guardando}
            className="h-5 w-5 accent-amber-500"
          />
        </label>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {guardando ? (
          <>
            <LoaderCircle
              size={20}
              className="animate-spin"
            />
            Guardando...
          </>
        ) : (
          <>
            <Save size={20} />
            {categoria
              ? "Guardar cambios"
              : "Crear categoría"}
          </>
        )}
      </button>
    </form>
  );
}