"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ReceiptText,
  RefreshCcw,
  Smartphone,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  usePedidosMozo,
} from "@/hooks/usePedidosMozo";

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

function formatearPago(
  metodo:
    | string
    | null
) {
  if (!metodo) {
    return "No indicado";
  }

  const mapa: Record<
    string,
    string
  > = {
    EFECTIVO: "Efectivo",
    YAPE: "Yape",
    PLIN: "Plin",
    TARJETA: "Tarjeta",
    MIXTO: "Mixto",
  };

  return mapa[metodo] ?? metodo;
}


function reproducirAlertaPedido() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const contexto =
      new AudioContextClass();

    const ahora =
      contexto.currentTime;

    const ganancia =
      contexto.createGain();

    ganancia.gain.setValueAtTime(
      0.0001,
      ahora
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.22,
      ahora + 0.02
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      ahora + 0.48
    );

    ganancia.connect(
      contexto.destination
    );

    [880, 1174].forEach(
      (frecuencia, indice) => {
        const oscilador =
          contexto.createOscillator();

        oscilador.type =
          "sine";

        oscilador.frequency.setValueAtTime(
          frecuencia,
          ahora +
            indice * 0.16
        );

        oscilador.connect(
          ganancia
        );

        oscilador.start(
          ahora +
            indice * 0.16
        );

        oscilador.stop(
          ahora +
            indice * 0.16 +
            0.22
        );
      }
    );

    window.setTimeout(
      () => {
        contexto.close().catch(
          () => undefined
        );
      },
      900
    );
  } catch {
    // El sonido es una mejora visual/operativa;
    // nunca debe bloquear el flujo del pedido.
  }
}

export default function PedidosMozoPage() {
  const {
    pedidos,
    cargando,
    procesandoId,
    mensaje,
    error,
    recargar,
    confirmarPedido,
  } = usePedidosMozo();

  const idsConocidosRef =
    useRef<Set<string> | null>(
      null
    );

  const [
    sonidoActivo,
    setSonidoActivo,
  ] =
    useState(false);

  const [
    nuevosIds,
    setNuevosIds,
  ] =
    useState<Set<string>>(
      new Set()
    );

  const [
    avisoNuevo,
    setAvisoNuevo,
  ] =
    useState("");

  useEffect(() => {
    const guardado =
      window.localStorage.getItem(
        "chinka_mozo_sonido"
      );

    setSonidoActivo(
      guardado === "1"
    );
  }, []);

  useEffect(() => {
    if (cargando) {
      return;
    }

    const idsActuales =
      new Set(
        pedidos.map(
          (pedido) =>
            pedido.id
        )
      );

    /*
     * Primera carga:
     * tomamos los pedidos existentes como conocidos.
     * No hacemos sonar toda la bandeja al abrir.
     */
    if (
      idsConocidosRef.current ===
      null
    ) {
      idsConocidosRef.current =
        idsActuales;

      return;
    }

    const idsNuevos =
      pedidos
        .filter(
          (pedido) =>
            !idsConocidosRef.current?.has(
              pedido.id
            )
        )
        .map(
          (pedido) =>
            pedido.id
        );

    if (
      idsNuevos.length >
      0
    ) {
      setNuevosIds(
        new Set(
          idsNuevos
        )
      );

      const pedidoMasNuevo =
        pedidos.find(
          (pedido) =>
            idsNuevos.includes(
              pedido.id
            )
        );

      setAvisoNuevo(
        pedidoMasNuevo
          ? `Nuevo pedido QR · ${pedidoMasNuevo.atencion.mesa.nombre}`
          : "Llegó un nuevo pedido QR."
      );

      if (sonidoActivo) {
        reproducirAlertaPedido();
      }

      document.title =
        `(${idsNuevos.length}) Nuevo pedido QR · Chinka Chinka`;
    }

    idsConocidosRef.current =
      idsActuales;
  }, [
    pedidos,
    cargando,
    sonidoActivo,
  ]);

  useEffect(() => {
    if (
      nuevosIds.size ===
      0
    ) {
      document.title =
        "Pedidos QR · Chinka Chinka";
    }
  }, [
    nuevosIds,
  ]);

  function alternarSonido() {
    const nuevoEstado =
      !sonidoActivo;

    setSonidoActivo(
      nuevoEstado
    );

    window.localStorage.setItem(
      "chinka_mozo_sonido",
      nuevoEstado
        ? "1"
        : "0"
    );

    if (nuevoEstado) {
      reproducirAlertaPedido();
    }
  }

  async function confirmarPedidoConAviso(
    pedidoId: string
  ) {
    const correcto =
      await confirmarPedido(
        pedidoId
      );

    if (correcto) {
      setNuevosIds(
        (actuales) => {
          const siguiente =
            new Set(
              actuales
            );

          siguiente.delete(
            pedidoId
          );

          return siguiente;
        }
      );
    }

    return correcto;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <BellRing
                  size={38}
                />
                Pedidos QR
              </h1>

              <p className="mt-3 text-slate-300">
                Pedidos enviados por los clientes pendientes de confirmación.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white"
              >
                <ArrowLeft
                  size={19}
                />
                Volver
              </Link>

              <button
                type="button"
                onClick={
                  alternarSonido
                }
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 font-black transition ${
                  sonidoActivo
                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title={
                  sonidoActivo
                    ? "Desactivar sonido"
                    : "Activar sonido"
                }
              >
                {sonidoActivo ? (
                  <Volume2
                    size={19}
                  />
                ) : (
                  <VolumeX
                    size={19}
                  />
                )}

                {sonidoActivo
                  ? "Sonido activo"
                  : "Activar sonido"}
              </button>

              <button
                type="button"
                onClick={
                  recargar
                }
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950"
              >
                <RefreshCcw
                  size={19}
                />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {avisoNuevo && (
          <section className="flex flex-col justify-between gap-4 rounded-3xl border-2 border-blue-300 bg-blue-50 px-5 py-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-blue-600 p-3 text-white">
                <BellRing
                  size={23}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  Pedido nuevo
                </p>

                <p className="mt-1 text-lg font-black text-slate-950">
                  {avisoNuevo}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAvisoNuevo("");
                setNuevosIds(
                  new Set()
                );
                document.title =
                  "Pedidos QR · Chinka Chinka";
              }}
              className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-blue-700 shadow-sm"
            >
              Marcar como visto
            </button>
          </section>
        )}

        {(mensaje || error) && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 font-bold ${
              mensaje
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensaje ? (
              <CheckCircle2
                size={21}
              />
            ) : (
              <AlertCircle
                size={21}
              />
            )}

            {mensaje || error}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Pendientes de confirmar
              </p>

              <div className="mt-1 flex items-center gap-3">
                <p className="text-4xl font-black text-slate-950">
                  {pedidos.length}
                </p>

                {nuevosIds.size > 0 && (
                  <span className="animate-pulse rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                    {nuevosIds.size} nuevo
                    {nuevosIds.size === 1
                      ? ""
                      : "s"}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-blue-100 p-4 text-blue-700">
              <Smartphone
                size={30}
              />
            </div>
          </div>
        </section>

        {cargando ? (
          <div className="flex min-h-96 items-center justify-center rounded-3xl bg-white">
            <LoaderCircle
              size={45}
              className="animate-spin text-blue-600"
            />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <CheckCircle2
              size={55}
              className="mx-auto text-emerald-500"
            />

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Todo atendido
            </h2>

            <p className="mt-2 text-slate-500">
              No hay pedidos QR pendientes de confirmación.
            </p>
          </div>
        ) : (
          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {pedidos.map(
              (pedido) => (
                <article
                  key={
                    pedido.id
                  }
                  className={`overflow-hidden rounded-3xl border-2 bg-white shadow-sm transition ${
                    nuevosIds.has(
                      pedido.id
                    )
                      ? "border-red-400 ring-4 ring-red-100"
                      : "border-blue-200"
                  }`}
                >
                  <header className="bg-blue-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                          Pedido QR
                        </p>

                        <h2 className="mt-1 text-3xl font-black text-slate-950">
                          {
                            pedido.atencion
                              .mesa.nombre
                          }
                        </h2>

                        <p className="mt-1 font-bold text-slate-500">
                          {pedido.numero}
                          {" · "}
                          {
                            pedido.atencion
                              .codigo
                          }
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black text-white">
                        NUEVO QR
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Clock3
                        size={17}
                      />

                      Hace{" "}
                      {minutosDesde(
                        pedido.fechaPedido
                      )}{" "}
                      min
                    </div>
                  </header>

                  <div className="space-y-4 p-5">
                    {pedido.detalles.map(
                      (detalle) => (
                        <div
                          key={
                            detalle.id
                          }
                          className="flex justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                        >
                          <div>
                            <p className="font-black text-slate-950">
                              {
                                detalle.cantidad
                              }
                              ×{" "}
                              {
                                detalle.producto
                                  .nombre
                              }
                            </p>

                            {detalle.observacion && (
                              <p className="mt-1 text-xs font-bold text-amber-700">
                                {
                                  detalle.observacion
                                }
                              </p>
                            )}
                          </div>

                          <p className="font-black">
                            S/{" "}
                            {detalle.subtotal.toFixed(
                              2
                            )}
                          </p>
                        </div>
                      )
                    )}

                    <div className="rounded-2xl bg-slate-950 p-4 text-white">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-400">
                          Total pedido
                        </span>

                        <span className="text-2xl font-black">
                          S/{" "}
                          {pedido.subtotal.toFixed(
                            2
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-sm">
                        <span className="text-slate-400">
                          Pago previsto
                        </span>

                        <span className="font-black">
                          {formatearPago(
                            pedido.atencion
                              .metodoPagoPrevisto
                          )}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/ticket/${pedido.atencion.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 font-black text-slate-700"
                    >
                      <ReceiptText
                        size={19}
                      />
                      Ver cuenta
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        confirmarPedidoConAviso(
                          pedido.id
                        )
                      }
                      disabled={
                        procesandoId ===
                        pedido.id
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {procesandoId ===
                      pedido.id ? (
                        <>
                          <LoaderCircle
                            size={20}
                            className="animate-spin"
                          />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={20}
                          />
                          CONFIRMAR PEDIDO
                        </>
                      )}
                    </button>
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}