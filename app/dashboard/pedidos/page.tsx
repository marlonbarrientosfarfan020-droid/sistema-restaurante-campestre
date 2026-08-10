"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChefHat,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  PackageCheck,
  ReceiptText,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react";

import { usePedidos } from "@/hooks/usePedidos";

type EstadoVisual = {
  texto: string;
  clases: string;
};

const ESTADOS_PEDIDO: Record<
  string,
  EstadoVisual
> = {
  NUEVO: {
    texto: "Nuevo",
    clases:
      "bg-orange-100 text-orange-700",
  },
  RECIBIDO: {
    texto: "Recibido",
    clases:
      "bg-sky-100 text-sky-700",
  },
  PREPARANDO: {
    texto: "Preparando",
    clases:
      "bg-amber-100 text-amber-700",
  },
  LISTO: {
    texto: "Listo",
    clases:
      "bg-emerald-100 text-emerald-700",
  },
  EN_ENTREGA: {
    texto: "En entrega",
    clases:
      "bg-violet-100 text-violet-700",
  },
  ENTREGADO: {
    texto: "Entregado",
    clases:
      "bg-green-100 text-green-700",
  },
  ANULADO: {
    texto: "Anulado",
    clases:
      "bg-red-100 text-red-700",
  },
};

const ESTADOS_DETALLE: Record<
  string,
  EstadoVisual
> = {
  NUEVO: {
    texto: "Nuevo",
    clases:
      "bg-orange-100 text-orange-700",
  },
  PREPARANDO: {
    texto: "Preparando",
    clases:
      "bg-amber-100 text-amber-700",
  },
  LISTO: {
    texto: "Listo",
    clases:
      "bg-sky-100 text-sky-700",
  },
  ENTREGADO: {
    texto: "Entregado",
    clases:
      "bg-emerald-100 text-emerald-700",
  },
  ANULADO: {
    texto: "Anulado",
    clases:
      "bg-red-100 text-red-700",
  },
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Lima",
    }
  ).format(new Date(fecha));
}

function formatearOrigen(origen: string) {
  const origenes: Record<
    string,
    string
  > = {
    CLIENTE_QR: "Cliente por QR",
    MOZO: "Registrado por mozo",
    CAJA: "Registrado por caja",
  };

  return origenes[origen] ?? origen;
}

function PedidosContent() {
  const searchParams =
    useSearchParams();

  const atencionId =
    searchParams.get("atencionId") ?? "";

  const {
    pedidos,
    cargando,
    error,
    cargarPedidos,
  } = usePedidos();

  useEffect(() => {
    if (atencionId) {
      cargarPedidos(atencionId);
    }
  }, [
    atencionId,
    cargarPedidos,
  ]);

  const resumen = useMemo(() => {
    const total = pedidos.reduce(
      (acumulado, pedido) =>
        acumulado +
        Number(pedido.subtotal),
      0
    );

    const cantidadProductos =
      pedidos.reduce(
        (acumulado, pedido) =>
          acumulado +
          pedido.detalles.reduce(
            (
              totalDetalle,
              detalle
            ) =>
              totalDetalle +
              Number(detalle.cantidad),
            0
          ),
        0
      );

    const pedidosPendientes =
      pedidos.filter(
        (pedido) =>
          ![
            "ENTREGADO",
            "ANULADO",
          ].includes(pedido.estado)
      ).length;

    const pedidosEntregados =
      pedidos.filter(
        (pedido) =>
          pedido.estado ===
          "ENTREGADO"
      ).length;

    return {
      total,
      cantidadProductos,
      pedidosPendientes,
      pedidosEntregados,
    };
  }, [pedidos]);

  const atencion =
    pedidos[0]?.atencion ?? null;

  if (!atencionId) {
    return (
      <main className="min-h-screen bg-slate-100 p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <ReceiptText
              size={50}
              className="mx-auto text-red-400"
            />

            <h1 className="mt-4 text-2xl font-black text-slate-950">
              Atención no indicada
            </h1>

            <p className="mt-2 text-slate-500">
              Abre una mesa desde el
              dashboard y presiona Ver
              ticket.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white"
            >
              <ArrowLeft size={19} />
              Volver al dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <ReceiptText size={38} />
                Ticket acumulado
              </h1>

              <p className="mt-3 text-slate-300">
                Todos los pedidos realizados
                durante la misma atención.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-slate-100"
            >
              <ArrowLeft size={19} />
              Volver a mesas
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoaderCircle
                size={46}
                className="mx-auto animate-spin text-amber-500"
              />

              <p className="mt-4 font-bold text-slate-600">
                Cargando ticket...
              </p>
            </div>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <ShoppingBasket
              size={50}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-2xl font-black text-slate-900">
              Esta atención todavía no
              tiene pedidos
            </h2>

            <p className="mt-2 text-slate-500">
              Regresa al mapa de mesas y
              agrega productos.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-bold text-slate-500">
                  Atención
                </p>

                <p className="mt-2 break-all text-xl font-black text-slate-950">
                  {atencion?.codigo}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {atencion?.mesa.nombre}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Pedidos
                    </p>

                    <p className="mt-2 text-3xl font-black text-slate-950">
                      {pedidos.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-3 text-white">
                    <ChefHat size={24} />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Productos
                    </p>

                    <p className="mt-2 text-3xl font-black text-amber-600">
                      {resumen.cantidadProductos}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <UtensilsCrossed
                      size={24}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Total acumulado
                    </p>

                    <p className="mt-2 text-3xl font-black text-emerald-600">
                      S/{" "}
                      {resumen.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <CircleDollarSign
                      size={24}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 rounded-3xl border border-orange-200 bg-orange-50 p-5">
                <div className="rounded-2xl bg-orange-500 p-3 text-white">
                  <Clock3 size={24} />
                </div>

                <div>
                  <p className="text-sm font-bold text-orange-700">
                    Pedidos pendientes
                  </p>

                  <p className="text-3xl font-black text-orange-800">
                    {resumen.pedidosPendientes}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="rounded-2xl bg-emerald-600 p-3 text-white">
                  <PackageCheck size={24} />
                </div>

                <div>
                  <p className="text-sm font-bold text-emerald-700">
                    Pedidos entregados
                  </p>

                  <p className="text-3xl font-black text-emerald-800">
                    {resumen.pedidosEntregados}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-5">
              {pedidos.map(
                (pedido, indice) => {
                  const estadoPedido =
                    ESTADOS_PEDIDO[
                      pedido.estado
                    ] ?? {
                      texto:
                        pedido.estado,
                      clases:
                        "bg-slate-100 text-slate-700",
                    };

                  return (
                    <article
                      key={pedido.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 md:flex-row md:items-center md:px-7">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
                            Pedido{" "}
                            {indice + 1}
                          </p>

                          <h2 className="mt-1 text-2xl font-black text-slate-950">
                            {pedido.numero}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatearFecha(
                              pedido.fechaPedido
                            )}
                            {" · "}
                            {formatearOrigen(
                              pedido.origen
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full px-4 py-2 text-sm font-black ${estadoPedido.clases}`}
                          >
                            {estadoPedido.texto}
                          </span>

                          <span className="text-2xl font-black text-slate-950">
                            S/{" "}
                            {Number(
                              pedido.subtotal
                            ).toFixed(2)}
                          </span>
                        </div>
                      </header>

                      {pedido.observacion && (
                        <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800 md:px-7">
                          Observación general:{" "}
                          {pedido.observacion}
                        </div>
                      )}

                      <div className="space-y-3 p-5 md:p-7">
                        {pedido.detalles.map(
                          (detalle) => {
                            const estado =
                              ESTADOS_DETALLE[
                                detalle.estado
                              ] ?? {
                                texto:
                                  detalle.estado,
                                clases:
                                  "bg-slate-100 text-slate-700",
                              };

                            return (
                              <div
                                key={detalle.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl font-black text-amber-700">
                                    {Number(
                                      detalle.cantidad
                                    )}
                                  </div>

                                  <div>
                                    <p className="font-black text-slate-950">
                                      {
                                        detalle
                                          .producto
                                          .nombre
                                      }
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                      S/{" "}
                                      {Number(
                                        detalle.precioUnitario
                                      ).toFixed(
                                        2
                                      )}{" "}
                                      por unidad
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

                                <div className="flex items-center justify-between gap-4 md:justify-end">
                                  <span
                                    className={`rounded-full px-3 py-1.5 text-xs font-black ${estado.clases}`}
                                  >
                                    {estado.texto}
                                  </span>

                                  <p className="min-w-24 text-right text-lg font-black text-slate-950">
                                    S/{" "}
                                    {Number(
                                      detalle.subtotal
                                    ).toFixed(
                                      2
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </section>

            <section className="sticky bottom-4 rounded-3xl bg-slate-950 p-5 text-white shadow-2xl md:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold text-slate-400">
                    Cuenta pendiente de pago
                  </p>

                  <p className="mt-1 text-4xl font-black">
                    S/{" "}
                    {resumen.total.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white">
                  <Clock3 size={20} />
                  Pago pendiente
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function PedidosPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <LoaderCircle
            size={46}
            className="animate-spin text-amber-500"
          />
        </main>
      }
    >
      <PedidosContent />
    </Suspense>
  );
}