"use client";

import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  PackageCheck,
  RefreshCcw,
  Route,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import { useEntregas } from "@/hooks/useEntregas";

import type {
  PedidoResumen,
} from "@/types/pedido";

function minutosDesde(
  fecha: string
) {
  return Math.max(
    0,
    Math.floor(
      (Date.now() -
        new Date(fecha).getTime()) /
        60000
    )
  );
}

function PedidoEntregaCard({
  pedido,
  procesando,
  onCambiarEstado,
}: {
  pedido: PedidoResumen;
  procesando: boolean;
  onCambiarEstado: (
    pedidoId: string,
    estado:
      | "EN_ENTREGA"
      | "ENTREGADO"
  ) => Promise<boolean>;
}) {
  const enEntrega =
    pedido.estado === "EN_ENTREGA";

  return (
    <article
      className={`overflow-hidden rounded-3xl border-2 bg-white shadow-sm ${
        enEntrega
          ? "border-violet-300"
          : "border-emerald-300"
      }`}
    >
      <header
        className={`p-5 ${
          enEntrega
            ? "bg-violet-50"
            : "bg-emerald-50"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {pedido.numero}
            </p>

            <h2 className="mt-1 text-3xl font-black text-slate-950">
              {
                pedido.atencion
                  .mesa.nombre
              }
            </h2>

            <p className="mt-1 text-sm font-bold text-slate-500">
              Atención{" "}
              {
                pedido.atencion
                  .codigo
              }
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-black text-white ${
              enEntrega
                ? "bg-violet-600"
                : "bg-emerald-600"
            }`}
          >
            {enEntrega
              ? "En entrega"
              : "Listo"}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 font-bold text-slate-700">
          <Clock3 size={18} />
          Hace{" "}
          {minutosDesde(
            pedido.fechaPedido
          )}{" "}
          min
        </div>
      </header>

      <div className="space-y-3 p-5">
        {pedido.detalles.map(
          (detalle) => (
            <div
              key={detalle.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-black text-amber-700">
                  {Number(
                    detalle.cantidad
                  )}
                </div>

                <div>
                  <p className="font-black text-slate-950">
                    {
                      detalle.producto
                        .nombre
                    }
                  </p>

                  {detalle.observacion && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
                      {
                        detalle.observacion
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {pedido.observacion && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-black uppercase text-orange-700">
              Observación general
            </p>

            <p className="mt-2 font-bold text-orange-800">
              {pedido.observacion}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            onCambiarEstado(
              pedido.id,
              enEntrega
                ? "ENTREGADO"
                : "EN_ENTREGA"
            )
          }
          disabled={procesando}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black text-white transition disabled:opacity-50 ${
            enEntrega
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-violet-600 hover:bg-violet-500"
          }`}
        >
          {procesando ? (
            <>
              <LoaderCircle
                size={20}
                className="animate-spin"
              />
              Procesando...
            </>
          ) : enEntrega ? (
            <>
              <CheckCircle2 size={20} />
              Confirmar entrega
            </>
          ) : (
            <>
              <Route size={20} />
              Recoger pedido
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default function EntregasPage() {
  const {
    pedidos,
    cargando,
    procesandoId,
    mensaje,
    error,
    recargar,
    cambiarEstado,
  } = useEntregas();

  const listos =
    pedidos.filter(
      (pedido) =>
        pedido.estado === "LISTO"
    );

  const enEntrega =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "EN_ENTREGA"
    );

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-300">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <ShoppingBag size={38} />
                Entregas del mozo
              </h1>

              <p className="mt-3 text-slate-300">
                Recoge los pedidos listos y
                confirma la entrega en cada mesa.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white"
              >
                <ArrowLeft size={19} />
                Volver
              </Link>

              <button
                type="button"
                onClick={recargar}
                disabled={cargando}
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                <RefreshCcw
                  size={19}
                  className={
                    cargando
                      ? "animate-spin"
                      : ""
                  }
                />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {(mensaje || error) && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 font-bold ${
              mensaje
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensaje ? (
              <CheckCircle2 size={21} />
            ) : (
              <AlertCircle size={21} />
            )}

            {mensaje || error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Listos para recoger
            </p>

            <p className="mt-2 text-4xl font-black text-emerald-600">
              {listos.length}
            </p>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              En camino
            </p>

            <p className="mt-2 text-4xl font-black text-violet-600">
              {enEntrega.length}
            </p>
          </div>
        </section>

        {cargando ? (
          <div className="flex min-h-96 items-center justify-center rounded-3xl bg-white">
            <LoaderCircle
              size={46}
              className="animate-spin text-violet-500"
            />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <UtensilsCrossed
              size={52}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              No hay pedidos para entregar
            </h2>

            <p className="mt-2 text-slate-500">
              Los pedidos marcados como listos
              en Cocina aparecerán aquí.
            </p>
          </div>
        ) : (
          <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {pedidos.map(
              (pedido) => (
                <PedidoEntregaCard
                  key={pedido.id}
                  pedido={pedido}
                  procesando={
                    procesandoId ===
                    pedido.id
                  }
                  onCambiarEstado={
                    cambiarEstado
                  }
                />
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}