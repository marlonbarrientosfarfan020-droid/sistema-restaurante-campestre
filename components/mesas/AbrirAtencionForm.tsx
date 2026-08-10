"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  LoaderCircle,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import type {
  MesaResumen,
} from "@/types/mesa";

type MetodoPago =
  | "EFECTIVO"
  | "YAPE"
  | "PLIN"
  | "TARJETA"
  | "MIXTO";

type DatosAtencion = {
  cantidadPersonas: number;
  metodoPagoPrevisto: MetodoPago;
  observacion: string;
};

type Props = {
  mesa: MesaResumen;
  procesando: boolean;
  onAbrir: (
    datos: DatosAtencion
  ) => Promise<boolean>;
};

export default function AbrirAtencionForm({
  mesa,
  procesando,
  onAbrir,
}: Props) {
  const [cantidadPersonas, setCantidadPersonas] =
    useState(
      String(
        Math.min(
          Math.max(mesa.capacidad, 1),
          100
        )
      )
    );

  const [
    metodoPagoPrevisto,
    setMetodoPagoPrevisto,
  ] = useState<MetodoPago>("EFECTIVO");

  const [observacion, setObservacion] =
    useState("");

  const [errorLocal, setErrorLocal] =
    useState("");

  useEffect(() => {
    setCantidadPersonas(
      String(
        Math.min(
          Math.max(mesa.capacidad, 1),
          100
        )
      )
    );
    setMetodoPagoPrevisto("EFECTIVO");
    setObservacion("");
    setErrorLocal("");
  }, [mesa]);

  async function enviarFormulario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    const personas = Number(
      cantidadPersonas
    );

    if (
      !Number.isInteger(personas) ||
      personas < 1 ||
      personas > 100
    ) {
      setErrorLocal(
        "La cantidad de personas debe estar entre 1 y 100."
      );
      return;
    }

    setErrorLocal("");

    await onAbrir({
      cantidadPersonas: personas,
      metodoPagoPrevisto,
      observacion: observacion.trim(),
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

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500 p-3 text-slate-950">
            <UtensilsCrossed size={24} />
          </div>

          <div>
            <p className="text-sm font-bold text-amber-700">
              Nueva atención
            </p>

            <h3 className="text-2xl font-black text-slate-950">
              {mesa.nombre}
            </h3>

            <p className="text-sm text-slate-500">
              {mesa.zona.nombre}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Cantidad de personas
        </label>

        <div className="relative">
          <Users
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={cantidadPersonas}
            onChange={(evento) =>
              setCantidadPersonas(
                evento.target.value
              )
            }
            disabled={procesando}
            className="w-full rounded-2xl border border-slate-300 py-3.5 pl-11 pr-4 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Método de pago previsto
        </label>

        <select
          value={metodoPagoPrevisto}
          onChange={(evento) =>
            setMetodoPagoPrevisto(
              evento.target.value as MetodoPago
            )
          }
          disabled={procesando}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        >
          <option value="EFECTIVO">
            Efectivo
          </option>

          <option value="YAPE">
            Yape
          </option>

          <option value="PLIN">
            Plin
          </option>

          <option value="TARJETA">
            Tarjeta
          </option>

          <option value="MIXTO">
            Pago mixto
          </option>
        </select>

        <p className="mt-2 text-xs text-slate-500">
          Este método puede cambiar al momento
          de realizar el pago.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Observación
        </label>

        <textarea
          value={observacion}
          onChange={(evento) =>
            setObservacion(evento.target.value)
          }
          placeholder="Ejemplo: cliente solicita silla para niño."
          maxLength={300}
          rows={4}
          disabled={procesando}
          className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />

        <p className="mt-1 text-right text-xs text-slate-400">
          {observacion.length}/300
        </p>
      </div>

      <button
        type="submit"
        disabled={procesando}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {procesando ? (
          <>
            <LoaderCircle
              size={20}
              className="animate-spin"
            />
            Abriendo atención...
          </>
        ) : (
          <>
            <UtensilsCrossed size={20} />
            Ocupar mesa
          </>
        )}
      </button>
    </form>
  );
}