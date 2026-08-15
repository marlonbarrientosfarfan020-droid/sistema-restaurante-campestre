"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  BellRing,
  ChefHat,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  MapPin,
  PackageCheck,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBasket,
  UserRound,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";

import { useBandejaPedidos } from "@/hooks/useBandejaPedidos";

import type {
  PedidoResumen,
} from "@/types/pedido";

/*
 * ============================================================
 * TIPOS AUXILIARES
 * ============================================================
 */

type UsuarioResumen = {
  id?: string;
  nombres?: string;
  apellidos?: string;
};

type PedidoBandeja =
  PedidoResumen & {
    registradoPor?: UsuarioResumen | null;
    entregadoPor?: UsuarioResumen | null;

    atencion: PedidoResumen["atencion"] & {
      estado?: string;

      mesa: PedidoResumen["atencion"]["mesa"] & {
        zona?: {
          id?: string;
          nombre?: string;
        } | null;
      };
    };
  };

type EstadoVisual = {
  texto: string;
  clases: string;
};

type FiltroEstado =
  | "TODOS"
  | "PENDIENTE_CONFIRMACION"
  | "NUEVO"
  | "RECIBIDO"
  | "PREPARANDO"
  | "LISTO"
  | "EN_ENTREGA"
  | "ENTREGADO"
  | "ANULADO";

type FiltroOrigen =
  | "TODOS"
  | "CLIENTE_QR"
  | "MOZO"
  | "CAJA";

type FiltroFecha =
  | "HOY"
  | "AYER"
  | "TODOS";

/*
 * ============================================================
 * ESTADOS VISUALES
 * ============================================================
 */

const ESTADOS: Record<
  string,
  EstadoVisual
> = {
  PENDIENTE_CONFIRMACION: {
    texto:
      "Pendiente de confirmar",
    clases:
      "border-red-200 bg-red-50 text-red-700",
  },

  NUEVO: {
    texto: "Nuevo",
    clases:
      "border-orange-200 bg-orange-50 text-orange-700",
  },

  RECIBIDO: {
    texto: "Recibido",
    clases:
      "border-sky-200 bg-sky-50 text-sky-700",
  },

  PREPARANDO: {
    texto: "Preparando",
    clases:
      "border-amber-200 bg-amber-50 text-amber-700",
  },

  LISTO: {
    texto: "Listo",
    clases:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  EN_ENTREGA: {
    texto: "En entrega",
    clases:
      "border-violet-200 bg-violet-50 text-violet-700",
  },

  ENTREGADO: {
    texto: "Entregado",
    clases:
      "border-green-200 bg-green-50 text-green-700",
  },

  ANULADO: {
    texto: "Anulado",
    clases:
      "border-slate-200 bg-slate-100 text-slate-500",
  },
};

/*
 * ============================================================
 * UTILIDADES
 * ============================================================
 */

function formatearHora(
  fecha: string | Date
) {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone:
        "America/Lima",
    }
  ).format(
    new Date(fecha)
  );
}

function formatearFecha(
  fecha: string | Date
) {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone:
        "America/Lima",
    }
  ).format(
    new Date(fecha)
  );
}

function fechaPeruISO(
  fecha: string | Date
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone:
        "America/Lima",
    }
  ).format(
    new Date(fecha)
  );
}

function fechaHoyPeru() {
  return fechaPeruISO(
    new Date()
  );
}

function fechaAyerPeru() {
  const hoy =
    fechaHoyPeru();

  const fecha =
    new Date(
      `${hoy}T12:00:00-05:00`
    );

  fecha.setDate(
    fecha.getDate() - 1
  );

  return fechaPeruISO(
    fecha
  );
}

function formatearOrigen(
  origen: string
) {
  const origenes: Record<
    string,
    string
  > = {
    CLIENTE_QR:
      "Cliente QR",

    MOZO:
      "Registrado por mozo",

    CAJA:
      "Registrado por caja",
  };

  return (
    origenes[origen] ??
    origen
  );
}

function nombreUsuario(
  usuario?:
    | UsuarioResumen
    | null
) {
  if (!usuario) {
    return "No asignado";
  }

  const nombre = [
    usuario.nombres,
    usuario.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    nombre ||
    "No asignado"
  );
}

function claseOrigen(
  origen: string
) {
  if (
    origen ===
    "CLIENTE_QR"
  ) {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  if (
    origen ===
    "MOZO"
  ) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

/*
 * ============================================================
 * PÁGINA
 * ============================================================
 */

export default function PedidosPage() {
  const {
    pedidos,
    cargando,
    actualizandoId,
    error,
    mensaje,
    cargarPedidos,
    actualizarEstado,
  } =
    useBandejaPedidos();

  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState<FiltroEstado>(
      "TODOS"
    );

  const [
    filtroOrigen,
    setFiltroOrigen,
  ] =
    useState<FiltroOrigen>(
      "TODOS"
    );

  const [
    filtroMesa,
    setFiltroMesa,
  ] =
    useState(
      "TODAS"
    );

  const [
    filtroFecha,
    setFiltroFecha,
  ] =
    useState<FiltroFecha>(
      "HOY"
    );

  /*
   * ==========================================================
   * BANDEJA
   * ==========================================================
   */

  const bandeja =
    pedidos as PedidoBandeja[];

  /*
   * ==========================================================
   * FILTRO BASE POR FECHA
   * ==========================================================
   */

  const pedidosPorFecha =
    useMemo(() => {
      const hoy =
        fechaHoyPeru();

      const ayer =
        fechaAyerPeru();

      return bandeja.filter(
        (pedido) => {
          if (
            filtroFecha ===
            "TODOS"
          ) {
            return true;
          }

          const fechaPedido =
            fechaPeruISO(
              pedido.fechaPedido
            );

          if (
            filtroFecha ===
            "HOY"
          ) {
            return (
              fechaPedido ===
              hoy
            );
          }

          return (
            fechaPedido ===
            ayer
          );
        }
      );
    }, [
      bandeja,
      filtroFecha,
    ]);

  /*
   * ==========================================================
   * RESUMEN
   * ==========================================================
   */

  const resumen =
    useMemo(() => {
      const contar = (
        estado: string
      ) =>
        pedidosPorFecha.filter(
          (pedido) =>
            pedido.estado ===
            estado
        ).length;

      const pendientes =
        contar(
          "PENDIENTE_CONFIRMACION"
        ) +
        contar(
          "NUEVO"
        );

      const recibidos =
        contar(
          "RECIBIDO"
        );

      const preparando =
        contar(
          "PREPARANDO"
        );

      const listos =
        contar(
          "LISTO"
        ) +
        contar(
          "EN_ENTREGA"
        );

      const entregados =
        contar(
          "ENTREGADO"
        );

      const totalVentas =
        pedidosPorFecha
          .filter(
            (pedido) =>
              pedido.estado !==
              "ANULADO"
          )
          .reduce(
            (
              total,
              pedido
            ) =>
              total +
              Number(
                pedido.subtotal
              ),
            0
          );

      return {
        pendientes,
        recibidos,
        preparando,
        listos,
        entregados,
        totalVentas,
        total:
          pedidosPorFecha.length,
      };
    }, [
      pedidosPorFecha,
    ]);

  /*
   * ==========================================================
   * MESAS
   * ==========================================================
   */

  const mesas =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          string
        >();

      pedidosPorFecha.forEach(
        (pedido) => {
          mapa.set(
            pedido.atencion.mesa.id,
            pedido.atencion.mesa
              .nombre
          );
        }
      );

      return Array.from(
        mapa.entries()
      ).sort(
        (
          [, nombreA],
          [, nombreB]
        ) =>
          nombreA.localeCompare(
            nombreB,
            "es"
          )
      );
    }, [
      pedidosPorFecha,
    ]);

  /*
   * ==========================================================
   * FILTRADO COMPLETO
   * ==========================================================
   */

  const pedidosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return pedidosPorFecha.filter(
        (pedido) => {
          const coincideTexto =
            !texto ||
            pedido.numero
              .toLowerCase()
              .includes(
                texto
              ) ||
            pedido.atencion.codigo
              .toLowerCase()
              .includes(
                texto
              ) ||
            pedido.atencion.mesa.nombre
              .toLowerCase()
              .includes(
                texto
              ) ||
            pedido.detalles.some(
              (detalle) =>
                detalle.producto.nombre
                  .toLowerCase()
                  .includes(
                    texto
                  )
            );

          const coincideEstado =
            filtroEstado ===
              "TODOS" ||
            pedido.estado ===
              filtroEstado;

          const coincideOrigen =
            filtroOrigen ===
              "TODOS" ||
            pedido.origen ===
              filtroOrigen;

          const coincideMesa =
            filtroMesa ===
              "TODAS" ||
            pedido.atencion.mesa
              .id ===
              filtroMesa;

          return (
            coincideTexto &&
            coincideEstado &&
            coincideOrigen &&
            coincideMesa
          );
        }
      );
    }, [
      pedidosPorFecha,
      busqueda,
      filtroEstado,
      filtroOrigen,
      filtroMesa,
    ]);

  /*
   * ==========================================================
   * CAMBIO DE ESTADO
   * ==========================================================
   */

  async function cambiarEstado(
    pedidoId: string,
    estado: string
  ) {
    await actualizarEstado(
      pedidoId,
      estado
    );
  }

  /*
   * ==========================================================
   * ANULAR
   * ==========================================================
   */

  async function anularPedido(
    pedido: PedidoBandeja
  ) {
    const confirmar =
      window.confirm(
        `¿Estás seguro de anular ${pedido.numero}?\n\nEsta acción actualizará el pedido y, si ya había descontado inventario, el stock será devuelto automáticamente.`
      );

    if (!confirmar) {
      return;
    }

    await cambiarEstado(
      pedido.id,
      "ANULADO"
    );
  }

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (
    cargando &&
    pedidos.length === 0
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">

          <LoaderCircle
            size={52}
            className="mx-auto animate-spin text-orange-500"
          />

          <h1 className="mt-5 text-xl font-black text-slate-900">
            Cargando centro de
            pedidos...
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Restaurante Chinka
            Chinka
          </p>

        </div>
      </main>
    );
  }

  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 md:px-7 md:py-7">

      <div className="mx-auto max-w-[1600px] space-y-5">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <header className="overflow-hidden rounded-[30px] bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950 text-white shadow-xl">

          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">
                Restaurante
                Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">

                <ShoppingBasket
                  size={38}
                />

                Centro de Pedidos

              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                Supervisa en tiempo
                real todos los
                pedidos del
                restaurante, desde
                su recepción hasta
                la entrega.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  cargarPedidos()
                }
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/20"
              >
                <RefreshCw
                  size={18}
                />

                Actualizar
              </button>

              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-slate-100"
              >
                <MapPin
                  size={18}
                />

                Ver mesas
              </Link>

            </div>

          </div>

          <div className="border-t border-white/10 bg-black/20 px-6 py-3 md:px-8">

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">

              <span className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />

                Actualización automática

              </span>

              <span>
                Cada 5 segundos
              </span>

              <span>
                •
              </span>

              <span>
                {resumen.total} pedidos en el periodo
              </span>

            </div>

          </div>

        </header>

        {/* ===================================================
            MENSAJES
        ==================================================== */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {mensaje}
          </div>
        )}

        {/* ===================================================
            KPI
        ==================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">

          <ResumenCard
            titulo="Por confirmar"
            valor={
              resumen.pendientes
            }
            icono={
              <BellRing
                size={24}
              />
            }
            clases="border-red-200 bg-red-50 text-red-700"
          />

          <ResumenCard
            titulo="Recibidos"
            valor={
              resumen.recibidos
            }
            icono={
              <ReceiptText
                size={24}
              />
            }
            clases="border-sky-200 bg-sky-50 text-sky-700"
          />

          <ResumenCard
            titulo="Preparando"
            valor={
              resumen.preparando
            }
            icono={
              <ChefHat
                size={24}
              />
            }
            clases="border-amber-200 bg-amber-50 text-amber-700"
          />

          <ResumenCard
            titulo="Listos"
            valor={
              resumen.listos
            }
            icono={
              <PackageCheck
                size={24}
              />
            }
            clases="border-violet-200 bg-violet-50 text-violet-700"
          />

          <ResumenCard
            titulo="Entregados"
            valor={
              resumen.entregados
            }
            icono={
              <CheckCircle2
                size={24}
              />
            }
            clases="border-emerald-200 bg-emerald-50 text-emerald-700"
          />

          <ResumenCard
            titulo="Venta pedidos"
            valor={`S/ ${resumen.totalVentas.toFixed(
              2
            )}`}
            icono={
              <CircleDollarSign
                size={24}
              />
            }
            clases="border-slate-200 bg-slate-950 text-white"
          />

        </section>

        {/* ===================================================
            FILTROS
        ==================================================== */}

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]">

            {/* BUSCADOR */}

            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">

              <Search
                size={19}
                className="shrink-0 text-slate-400"
              />

              <input
                value={
                  busqueda
                }
                onChange={(
                  evento
                ) =>
                  setBusqueda(
                    evento.target
                      .value
                  )
                }
                placeholder="Buscar pedido, mesa, atención o producto..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />

            </div>

            {/* FECHA */}

            <select
              value={
                filtroFecha
              }
              onChange={(
                evento
              ) => {
                setFiltroFecha(
                  evento.target
                    .value as FiltroFecha
                );

                setFiltroMesa(
                  "TODAS"
                );
              }}
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
            >
              <option value="HOY">
                Pedidos de hoy
              </option>

              <option value="AYER">
                Pedidos de ayer
              </option>

              <option value="TODOS">
                Todo el historial
              </option>
            </select>

            {/* ESTADO */}

            <select
              value={
                filtroEstado
              }
              onChange={(
                evento
              ) =>
                setFiltroEstado(
                  evento.target
                    .value as FiltroEstado
                )
              }
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
            >

              <option value="TODOS">
                Todos los estados
              </option>

              <option value="PENDIENTE_CONFIRMACION">
                Por confirmar
              </option>

              <option value="NUEVO">
                Nuevos antiguos
              </option>

              <option value="RECIBIDO">
                Recibidos
              </option>

              <option value="PREPARANDO">
                Preparando
              </option>

              <option value="LISTO">
                Listos
              </option>

              <option value="EN_ENTREGA">
                En entrega
              </option>

              <option value="ENTREGADO">
                Entregados
              </option>

              <option value="ANULADO">
                Anulados
              </option>

            </select>

            {/* ORIGEN */}

            <select
              value={
                filtroOrigen
              }
              onChange={(
                evento
              ) =>
                setFiltroOrigen(
                  evento.target
                    .value as FiltroOrigen
                )
              }
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
            >

              <option value="TODOS">
                Todos los orígenes
              </option>

              <option value="CLIENTE_QR">
                Cliente QR
              </option>

              <option value="MOZO">
                Mozo
              </option>

              <option value="CAJA">
                Caja
              </option>

            </select>

            {/* MESA */}

            <select
              value={
                filtroMesa
              }
              onChange={(
                evento
              ) =>
                setFiltroMesa(
                  evento.target
                    .value
                )
              }
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
            >

              <option value="TODAS">
                Todas las mesas
              </option>

              {mesas.map(
                ([
                  id,
                  nombre,
                ]) => (
                  <option
                    key={id}
                    value={id}
                  >
                    {nombre}
                  </option>
                )
              )}

            </select>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

            <p className="text-sm font-semibold text-slate-500">

              Mostrando{" "}

              <strong className="text-slate-950">
                {
                  pedidosFiltrados.length
                }
              </strong>{" "}

              pedidos

            </p>

            <button
              type="button"
              onClick={() => {
                setBusqueda(
                  ""
                );

                setFiltroFecha(
                  "HOY"
                );

                setFiltroEstado(
                  "TODOS"
                );

                setFiltroOrigen(
                  "TODOS"
                );

                setFiltroMesa(
                  "TODAS"
                );
              }}
              className="text-sm font-black text-orange-600 hover:text-orange-700"
            >
              Limpiar filtros
            </button>

          </div>

        </section>

        {/* ===================================================
            PEDIDOS
        ==================================================== */}

        {pedidosFiltrados.length ===
        0 ? (

          <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">

            <ShoppingBasket
              size={56}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              No encontramos pedidos
            </h2>

            <p className="mt-2 text-slate-500">
              No existen pedidos que
              coincidan con los
              filtros seleccionados.
            </p>

          </section>

        ) : (

          <section className="grid gap-5 xl:grid-cols-2">

            {pedidosFiltrados.map(
              (pedido) => {
                const visual =
                  ESTADOS[
                    pedido.estado
                  ] ?? {
                    texto:
                      pedido.estado,

                    clases:
                      "border-slate-200 bg-slate-50 text-slate-700",
                  };

                const procesando =
                  actualizandoId ===
                  pedido.id;

                const puedeAnular =
                  [
                    "PENDIENTE_CONFIRMACION",
                    "NUEVO",
                    "RECIBIDO",
                    "PREPARANDO",
                    "LISTO",
                    "EN_ENTREGA",
                  ].includes(
                    pedido.estado
                  );

                return (
                  <article
                    key={
                      pedido.id
                    }
                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >

                    {/* CABECERA */}

                    <div className="border-b border-slate-100 bg-slate-50/80 p-5 md:p-6">

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${visual.clases}`}
                            >
                              {
                                visual.texto
                              }
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${claseOrigen(
                                pedido.origen
                              )}`}
                            >
                              {pedido.origen ===
                              "CLIENTE_QR" ? (

                                <span className="flex items-center gap-1.5">

                                  <QrCode
                                    size={
                                      13
                                    }
                                  />

                                  QR

                                </span>

                              ) : (

                                formatearOrigen(
                                  pedido.origen
                                )

                              )}
                            </span>

                          </div>

                          <h2 className="mt-3 text-2xl font-black text-slate-950">
                            {
                              pedido.numero
                            }
                          </h2>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">

                            <span className="flex items-center gap-1.5">

                              <Clock3
                                size={
                                  15
                                }
                              />

                              {formatearHora(
                                pedido.fechaPedido
                              )}

                            </span>

                            <span>
                              {formatearFecha(
                                pedido.fechaPedido
                              )}
                            </span>

                          </div>

                        </div>

                        <div className="sm:text-right">

                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Total
                          </p>

                          <p className="mt-1 text-3xl font-black text-emerald-600">

                            S/{" "}

                            {Number(
                              pedido.subtotal
                            ).toFixed(
                              2
                            )}

                          </p>

                        </div>

                      </div>

                    </div>

                    {/* INFORMACIÓN */}

                    <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-3 md:p-6">

                      <InfoMini
                        icono={
                          <MapPin
                            size={
                              17
                            }
                          />
                        }
                        titulo="Mesa"
                        valor={
                          pedido
                            .atencion
                            .mesa
                            .nombre
                        }
                      />

                      <InfoMini
                        icono={
                          <UserRound
                            size={
                              17
                            }
                          />
                        }
                        titulo="Responsable"
                        valor={nombreUsuario(
                          pedido.registradoPor
                        )}
                      />

                      <InfoMini
                        icono={
                          <ReceiptText
                            size={
                              17
                            }
                          />
                        }
                        titulo="Atención"
                        valor={
                          pedido
                            .atencion
                            .codigo
                        }
                      />

                    </div>

                    {/* PRODUCTOS */}

                    <div className="p-5 md:p-6">

                      <div className="mb-4 flex items-center justify-between">

                        <h3 className="flex items-center gap-2 font-black text-slate-950">

                          <UtensilsCrossed
                            size={
                              18
                            }
                            className="text-orange-500"
                          />

                          Productos

                        </h3>

                        <span className="text-xs font-bold text-slate-400">

                          {
                            pedido
                              .detalles
                              .length
                          }{" "}

                          líneas

                        </span>

                      </div>

                      <div className="space-y-2">

                        {pedido.detalles.map(
                          (
                            detalle
                          ) => (

                            <div
                              key={
                                detalle.id
                              }
                              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                            >

                              <div className="flex min-w-0 items-center gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-black text-orange-700">

                                  {Number(
                                    detalle.cantidad
                                  )}

                                </div>

                                <div className="min-w-0">

                                  <p className="truncate font-black text-slate-900">

                                    {
                                      detalle
                                        .producto
                                        .nombre
                                    }

                                  </p>

                                  {detalle.observacion && (

                                    <p className="mt-0.5 truncate text-xs font-semibold text-amber-700">
                                      {
                                        detalle.observacion
                                      }
                                    </p>

                                  )}

                                </div>

                              </div>

                              <p className="shrink-0 font-black text-slate-900">

                                S/{" "}

                                {Number(
                                  detalle.subtotal
                                ).toFixed(
                                  2
                                )}

                              </p>

                            </div>

                          )
                        )}

                      </div>

                      {pedido.observacion && (

                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                          <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                            Observación
                          </p>

                          <p className="mt-1 text-sm font-semibold text-amber-900">
                            {
                              pedido.observacion
                            }
                          </p>

                        </div>

                      )}

                    </div>

                    {/* ACCIONES */}

                    <div className="border-t border-slate-100 bg-slate-50 p-4 md:p-5">

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <Link
                          href={`/dashboard/ticket/${pedido.atencion.id}`}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        >

                          <ReceiptText
                            size={
                              17
                            }
                          />

                          Ver ticket

                          <ChevronRight
                            size={
                              16
                            }
                          />

                        </Link>

                        <div className="flex flex-1 flex-wrap justify-end gap-2">

                          {/* CONFIRMAR */}

                         {(String(pedido.estado) ===
  "PENDIENTE_CONFIRMACION" ||
  pedido.estado ===
    "NUEVO") && (

                            <BotonEstado
                              procesando={
                                procesando
                              }
                              texto="Confirmar pedido"
                              icono={
                                <CheckCircle2
                                  size={
                                    18
                                  }
                                />
                              }
                              clases="bg-sky-600 text-white hover:bg-sky-700"
                              onClick={() =>
                                cambiarEstado(
                                  pedido.id,
                                  "RECIBIDO"
                                )
                              }
                            />

                          )}

                          {/* PREPARAR */}

                          {pedido.estado ===
                            "RECIBIDO" && (

                            <BotonEstado
                              procesando={
                                procesando
                              }
                              texto="Iniciar preparación"
                              icono={
                                <ChefHat
                                  size={
                                    18
                                  }
                                />
                              }
                              clases="bg-amber-500 text-white hover:bg-amber-600"
                              onClick={() =>
                                cambiarEstado(
                                  pedido.id,
                                  "PREPARANDO"
                                )
                              }
                            />

                          )}

                          {/* ENTREGAR */}

                          {(pedido.estado ===
                            "PREPARANDO" ||
                            pedido.estado ===
                              "LISTO" ||
                            pedido.estado ===
                              "EN_ENTREGA") && (

                            <BotonEstado
                              procesando={
                                procesando
                              }
                              texto="Marcar entregado"
                              icono={
                                <PackageCheck
                                  size={
                                    18
                                  }
                                />
                              }
                              clases="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() =>
                                cambiarEstado(
                                  pedido.id,
                                  "ENTREGADO"
                                )
                              }
                            />

                          )}

                          {/* ANULAR */}

                          {puedeAnular && (

                            <button
                              type="button"
                              disabled={
                                procesando
                              }
                              onClick={() =>
                                anularPedido(
                                  pedido
                                )
                              }
                              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {procesando ? (

                                <LoaderCircle
                                  size={
                                    18
                                  }
                                  className="animate-spin"
                                />

                              ) : (

                                <XCircle
                                  size={
                                    18
                                  }
                                />

                              )}

                              Anular

                            </button>

                          )}

                          {/* ENTREGADO */}

                          {pedido.estado ===
                            "ENTREGADO" && (

                            <div className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-100 px-4 font-black text-emerald-700">

                              <CheckCircle2
                                size={
                                  18
                                }
                              />

                              Entregado

                            </div>

                          )}

                          {/* ANULADO */}

                          {pedido.estado ===
                            "ANULADO" && (

                            <div className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-200 px-4 font-black text-slate-500">

                              <XCircle
                                size={
                                  18
                                }
                              />

                              Pedido anulado

                            </div>

                          )}

                        </div>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </section>

        )}

      </div>

    </main>
  );
}

/*
 * ============================================================
 * COMPONENTES
 * ============================================================
 */

function ResumenCard({
  titulo,
  valor,
  icono,
  clases,
}: {
  titulo: string;

  valor:
    | number
    | string;

  icono:
    React.ReactNode;

  clases: string;
}) {
  return (
    <div
      className={`rounded-[24px] border p-5 shadow-sm ${clases}`}
    >

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-xs font-black uppercase tracking-wide opacity-70">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-black">
            {valor}
          </p>

        </div>

        <div className="rounded-2xl bg-white/60 p-3 text-current shadow-sm">
          {icono}
        </div>

      </div>

    </div>
  );
}

function InfoMini({
  icono,
  titulo,
  valor,
}: {
  icono:
    React.ReactNode;

  titulo: string;

  valor: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">

      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">

        {icono}

        {titulo}

      </div>

      <p className="mt-1 truncate text-sm font-black text-slate-900">
        {valor}
      </p>

    </div>
  );
}

function BotonEstado({
  texto,
  icono,
  clases,
  procesando,
  onClick,
}: {
  texto: string;

  icono:
    React.ReactNode;

  clases: string;

  procesando: boolean;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={
        procesando
      }
      onClick={
        onClick
      }
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${clases}`}
    >

      {procesando ? (

        <LoaderCircle
          size={
            18
          }
          className="animate-spin"
        />

      ) : (

        icono

      )}

      {procesando
        ? "Procesando..."
        : texto}

    </button>
  );
}