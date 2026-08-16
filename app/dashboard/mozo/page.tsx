"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  BellRing,
  ChefHat,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CookingPot,
  LoaderCircle,
  LogOut,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  Search,
  ShoppingBasket,
  Sparkles,
  Store,
  UserRound,
  Users,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type SesionActual = {
  sub: string;
  sucursalId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol:
    | "SUPERADMIN"
    | "ADMINISTRADOR"
    | "CAJERO"
    | "MOZO"
    | "COCINA"
    | "BARRA"
    | "GERENTE";
  exp: number;
};

type SucursalPrincipal = {
  id: string;
  nombre: string;
  codigo: string;

  empresa: {
    nombre: string;
  };
};

type AtencionActual = {
  id: string;
  codigo: string;
  estado: string;
  cantidadPersonas: number;
  metodoPagoPrevisto:
    | string
    | null;
  subtotal:
    | string
    | number;
  descuento:
    | string
    | number;
  total:
    | string
    | number;
  fechaApertura: string;
  cantidadPedidos?: number;
};

type Mesa = {
  id: string;
  numero: number;
  nombre: string;
  capacidad: number;
  qrCode: string | null;
  estado: string;
  activa: boolean;

  zona: {
    id: string;
    nombre: string;
  };

  atencionActual:
    | AtencionActual
    | null;
};

function dinero(
  valor:
    | string
    | number
    | null
    | undefined
) {
  return `S/ ${Number(
    valor ?? 0
  ).toFixed(2)}`;
}

function saludoActual() {
  const hora =
    new Date().getHours();

  if (hora < 12) {
    return "Buenos días";
  }

  if (hora < 19) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

function estadoMesaVisual(
  estado: string
) {
  const mapa: Record<
    string,
    {
      texto: string;
      punto: string;
      tarjeta: string;
      badge: string;
      accion: string;
    }
  > = {
    LIBRE: {
      texto:
        "Libre",
      punto:
        "bg-slate-400",
      tarjeta:
        "border-slate-200 bg-white",
      badge:
        "bg-slate-100 text-slate-700",
      accion:
        "Abrir y pedir",
    },

    OCUPADA: {
      texto:
        "Ocupada",
      punto:
        "bg-amber-500",
      tarjeta:
        "border-amber-200 bg-amber-50",
      badge:
        "bg-amber-100 text-amber-800",
      accion:
        "Atender",
    },

    PEDIDO_PENDIENTE: {
      texto:
        "Pedido pendiente",
      punto:
        "bg-orange-500",
      tarjeta:
        "border-orange-200 bg-orange-50",
      badge:
        "bg-orange-100 text-orange-800",
      accion:
        "Atender",
    },

    CONSUMIENDO: {
      texto:
        "Consumiendo",
      punto:
        "bg-yellow-500",
      tarjeta:
        "border-yellow-200 bg-yellow-50",
      badge:
        "bg-yellow-100 text-yellow-800",
      accion:
        "Nuevo pedido",
    },

    SOLICITO_CUENTA: {
      texto:
        "Cuenta solicitada",
      punto:
        "bg-blue-500",
      tarjeta:
        "border-blue-200 bg-blue-50",
      badge:
        "bg-blue-100 text-blue-800",
      accion:
        "Ver cuenta",
    },

    PAGADA: {
      texto:
        "Pagada",
      punto:
        "bg-emerald-500",
      tarjeta:
        "border-emerald-200 bg-emerald-50",
      badge:
        "bg-emerald-100 text-emerald-800",
      accion:
        "Revisar",
    },

    LIMPIEZA: {
      texto:
        "Limpieza",
      punto:
        "bg-violet-500",
      tarjeta:
        "border-violet-200 bg-violet-50",
      badge:
        "bg-violet-100 text-violet-800",
      accion:
        "Revisar",
    },
  };

  return (
    mapa[estado] ?? {
      texto:
        estado,
      punto:
        "bg-slate-400",
      tarjeta:
        "border-slate-200 bg-white",
      badge:
        "bg-slate-100 text-slate-700",
      accion:
        "Atender",
    }
  );
}

export default function MozoHomePage() {
  const [
    sesion,
    setSesion,
  ] =
    useState<SesionActual | null>(
      null
    );

  const [
    sucursal,
    setSucursal,
  ] =
    useState<SucursalPrincipal | null>(
      null
    );

  const [
    mesas,
    setMesas,
  ] =
    useState<Mesa[]>([]);

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    actualizando,
    setActualizando,
  ] =
    useState(false);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");

  const [
    filtro,
    setFiltro,
  ] =
    useState<
      | "TODAS"
      | "LIBRES"
      | "OCUPADAS"
      | "CUENTAS"
    >("TODAS");

  const cargarDatos =
    useCallback(
      async (
        cargaInicial =
          false
      ) => {
        try {
          if (
            cargaInicial
          ) {
            setCargando(
              true
            );
          } else {
            setActualizando(
              true
            );
          }

          setError("");

          const [
            respuestaSesion,
            respuestaSucursal,
          ] =
            await Promise.all([
              fetch(
                "/api/auth/me",
                {
                  method:
                    "GET",
                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/sucursales/principal",
                {
                  method:
                    "GET",
                  cache:
                    "no-store",
                }
              ),
            ]);

          const resultadoSesion =
            (await respuestaSesion.json()) as ApiResponse<SesionActual>;

          const resultadoSucursal =
            (await respuestaSucursal.json()) as ApiResponse<SucursalPrincipal>;

          if (
            !respuestaSesion.ok ||
            !resultadoSesion.success ||
            !resultadoSesion.data
          ) {
            window.location.href =
              "/login";

            return;
          }

          if (
            !respuestaSucursal.ok ||
            !resultadoSucursal.success ||
            !resultadoSucursal.data
          ) {
            throw new Error(
              resultadoSucursal.message ||
                "No se pudo cargar la sucursal."
            );
          }

          setSesion(
            resultadoSesion.data
          );

          setSucursal(
            resultadoSucursal.data
          );

          const respuestaMesas =
            await fetch(
              `/api/mesas?sucursalId=${encodeURIComponent(
                resultadoSucursal
                  .data.id
              )}`,
              {
                method:
                  "GET",
                cache:
                  "no-store",
              }
            );

          const resultadoMesas =
            (await respuestaMesas.json()) as ApiResponse<
              Mesa[]
            >;

          if (
            !respuestaMesas.ok ||
            !resultadoMesas.success
          ) {
            throw new Error(
              resultadoMesas.message ||
                "No se pudieron cargar las mesas."
            );
          }

          setMesas(
            resultadoMesas.data ??
              []
          );
        } catch (
          errorDesconocido
        ) {
          setError(
            errorDesconocido instanceof
              Error
              ? errorDesconocido.message
              : "No se pudo cargar el modo mozo."
          );
        } finally {
          setCargando(
            false
          );

          setActualizando(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    cargarDatos(
      true
    );

    const intervalo =
      window.setInterval(
        () => {
          cargarDatos(
            false
          );
        },
        5000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [cargarDatos]);

  async function cerrarSesion() {
    try {
      setCerrandoSesion(
        true
      );

      await fetch(
        "/api/auth/logout",
        {
          method:
            "POST",
        }
      );
    } finally {
      window.location.href =
        "/login";
    }
  }

  const mesasLibres =
    useMemo(
      () =>
        mesas.filter(
          (mesa) =>
            mesa.estado ===
            "LIBRE"
        ).length,
      [mesas]
    );

  const mesasOcupadas =
    useMemo(
      () =>
        mesas.filter(
          (mesa) =>
            mesa.estado !==
            "LIBRE"
        ).length,
      [mesas]
    );

  const cuentasSolicitadas =
    useMemo(
      () =>
        mesas.filter(
          (mesa) =>
            mesa.estado ===
              "SOLICITO_CUENTA" ||
            mesa.estado ===
              "PAGADA"
        ).length,
      [mesas]
    );

  const consumoAbierto =
    useMemo(
      () =>
        mesas.reduce(
          (
            total,
            mesa
          ) =>
            total +
            Number(
              mesa
                .atencionActual
                ?.total ??
                0
            ),
          0
        ),
      [mesas]
    );

  const mesasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLocaleLowerCase(
            "es-PE"
          );

      return mesas.filter(
        (mesa) => {
          const coincideTexto =
            !texto ||
            mesa.nombre
              .toLocaleLowerCase(
                "es-PE"
              )
              .includes(
                texto
              ) ||
            mesa.zona.nombre
              .toLocaleLowerCase(
                "es-PE"
              )
              .includes(
                texto
              ) ||
            String(
              mesa.numero
            ).includes(
              texto
            );

          const coincideFiltro =
            filtro ===
              "TODAS" ||
            (filtro ===
              "LIBRES" &&
              mesa.estado ===
                "LIBRE") ||
            (filtro ===
              "OCUPADAS" &&
              mesa.estado !==
                "LIBRE") ||
            (filtro ===
              "CUENTAS" &&
              [
                "SOLICITO_CUENTA",
                "PAGADA",
              ].includes(
                mesa.estado
              ));

          return (
            coincideTexto &&
            coincideFiltro
          );
        }
      );
    }, [
      mesas,
      busqueda,
      filtro,
    ]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-950 text-amber-400 shadow-xl">
            <UtensilsCrossed
              size={35}
            />
          </div>

          <LoaderCircle
            size={35}
            className="mx-auto mt-6 animate-spin text-amber-500"
          />

          <p className="mt-3 font-black text-slate-700">
            Preparando tu turno...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-28 lg:pb-8">
      <header className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-orange-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1500px] px-4 pb-7 pt-5 md:px-7 md:pb-9 md:pt-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg">
                <UtensilsCrossed
                  size={25}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-400">
                  Restaurante Chinka Chinka
                </p>

                <h1 className="mt-0.5 truncate text-xl font-black md:text-2xl">
                  {saludoActual()},{" "}
                  {sesion?.nombres ??
                    "Mozo"} 👋
                </h1>

                <p className="mt-0.5 truncate text-xs font-bold text-slate-400">
                  {sucursal?.nombre ??
                    "Sucursal Principal"}{" "}
                  · Modo Mozo
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() =>
                  cargarDatos(
                    false
                  )
                }
                disabled={
                  actualizando
                }
                className="rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/15 disabled:opacity-50"
                title="Actualizar"
              >
                <RefreshCcw
                  size={20}
                  className={
                    actualizando
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>

              <button
                type="button"
                onClick={
                  cerrarSesion
                }
                disabled={
                  cerrandoSesion
                }
                className="rounded-2xl bg-red-500/15 p-3 text-red-200 transition hover:bg-red-500/25 disabled:opacity-50"
                title="Cerrar sesión"
              >
                {cerrandoSesion ? (
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut
                    size={20}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2 md:gap-3">
            <button
              type="button"
              onClick={() =>
                setFiltro(
                  "LIBRES"
                )
              }
              className={`rounded-2xl border p-3 text-left backdrop-blur transition ${
                filtro ===
                "LIBRES"
                  ? "border-amber-400 bg-amber-400 text-slate-950"
                  : "border-white/10 bg-white/10 text-white"
              }`}
            >
              <p className="text-[10px] font-black uppercase opacity-70">
                Libres
              </p>

              <p className="mt-1 text-2xl font-black">
                {mesasLibres}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setFiltro(
                  "OCUPADAS"
                )
              }
              className={`rounded-2xl border p-3 text-left backdrop-blur transition ${
                filtro ===
                "OCUPADAS"
                  ? "border-amber-400 bg-amber-400 text-slate-950"
                  : "border-white/10 bg-white/10 text-white"
              }`}
            >
              <p className="text-[10px] font-black uppercase opacity-70">
                Ocupadas
              </p>

              <p className="mt-1 text-2xl font-black">
                {mesasOcupadas}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setFiltro(
                  "CUENTAS"
                )
              }
              className={`rounded-2xl border p-3 text-left backdrop-blur transition ${
                filtro ===
                "CUENTAS"
                  ? "border-amber-400 bg-amber-400 text-slate-950"
                  : "border-white/10 bg-white/10 text-white"
              }`}
            >
              <p className="text-[10px] font-black uppercase opacity-70">
                Cuentas
              </p>

              <p className="mt-1 text-2xl font-black">
                {
                  cuentasSolicitadas
                }
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setFiltro(
                  "TODAS"
                )
              }
              className={`rounded-2xl border p-3 text-left backdrop-blur transition ${
                filtro ===
                "TODAS"
                  ? "border-amber-400 bg-amber-400 text-slate-950"
                  : "border-white/10 bg-white/10 text-white"
              }`}
            >
              <p className="text-[10px] font-black uppercase opacity-70">
                Consumo
              </p>

              <p className="mt-1 truncate text-sm font-black md:text-xl">
                {dinero(
                  consumoAbierto
                )}
              </p>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-7">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
            {error}
          </div>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600">
                Acciones rápidas
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                ¿Qué necesitas hacer?
              </h2>
            </div>

            <Sparkles
              size={27}
              className="text-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <a
              href="#mesas"
              className="group col-span-2 rounded-[28px] bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-slate-950 shadow-lg transition active:scale-[0.98] md:col-span-1 xl:col-span-2"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-2xl bg-white/35 p-3">
                  <Users
                    size={25}
                  />
                </div>

                <ChevronRight
                  size={24}
                  className="transition group-hover:translate-x-1"
                />
              </div>

              <h3 className="mt-5 text-xl font-black">
                Atender mesas
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-800/80">
                Abre una mesa, toma pedidos y continúa una atención.
              </p>
            </a>

            <Link
              href="/dashboard/pedidos"
              className="group rounded-[28px] bg-slate-950 p-5 text-white shadow-lg transition active:scale-[0.98]"
            >
              <ReceiptText
                size={26}
                className="text-violet-300"
              />

              <h3 className="mt-5 font-black">
                Pedidos
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Seguimiento general
              </p>
            </Link>

            <Link
              href="/dashboard/entregas"
              className="group rounded-[28px] bg-violet-600 p-5 text-white shadow-lg transition active:scale-[0.98]"
            >
              <PackageCheck
                size={26}
              />

              <h3 className="mt-5 font-black">
                Entregas
              </h3>

              <p className="mt-1 text-xs text-violet-100">
                Pedidos listos
              </p>
            </Link>

            <Link
              href="/dashboard/cocina"
              className="group rounded-[28px] bg-orange-100 p-5 text-orange-950 shadow-sm transition active:scale-[0.98]"
            >
              <CookingPot
                size={26}
                className="text-orange-600"
              />

              <h3 className="mt-5 font-black">
                Cocina
              </h3>

              <p className="mt-1 text-xs text-orange-700">
                Ver preparación
              </p>
            </Link>

            <Link
              href="/dashboard/caja"
              className="group rounded-[28px] bg-emerald-100 p-5 text-emerald-950 shadow-sm transition active:scale-[0.98]"
            >
              <CircleDollarSign
                size={26}
                className="text-emerald-600"
              />

              <h3 className="mt-5 font-black">
                Caja
              </h3>

              <p className="mt-1 text-xs text-emerald-700">
                Ver cuentas
              </p>
            </Link>
          </div>
        </section>

        <section
          id="mesas"
          className="scroll-mt-5"
        >
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Servicio en vivo
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Mesas del restaurante
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Toca una mesa y atiende de inmediato.
              </p>
            </div>

            <div className="relative md:w-80">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={
                  busqueda
                }
                onChange={(
                  evento
                ) =>
                  setBusqueda(
                    evento.target.value
                  )
                }
                placeholder="Buscar mesa o zona..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 font-bold outline-none shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
            </div>
          </div>

          {mesasFiltradas.length ===
          0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
              <Store
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-black text-slate-700">
                No encontramos mesas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {mesasFiltradas.map(
                (mesa) => {
                  const visual =
                    estadoMesaVisual(
                      mesa.estado
                    );

                  return (
                    <Link
                      key={
                        mesa.id
                      }
                      href={`/dashboard/mozo/mesa/${mesa.id}`}
                      className={`group relative overflow-hidden rounded-[26px] border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${visual.tarjeta}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-black uppercase tracking-wider text-slate-500">
                            {
                              mesa
                                .zona
                                .nombre
                            }
                          </p>

                          <h3 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">
                            {
                              mesa.nombre
                            }
                          </h3>
                        </div>

                        <span
                          className={`mt-1 h-3 w-3 shrink-0 rounded-full ${visual.punto}`}
                        />
                      </div>

                      <span
                        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${visual.badge}`}
                      >
                        {
                          visual.texto
                        }
                      </span>

                      {mesa.atencionActual ? (
                        <>
                          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                Consumo
                              </p>

                              <p className="mt-0.5 text-lg font-black text-emerald-700">
                                {dinero(
                                  mesa
                                    .atencionActual
                                    .total
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                Personas
                              </p>

                              <p className="mt-0.5 text-lg font-black text-slate-950">
                                {
                                  mesa
                                    .atencionActual
                                    .cantidadPersonas
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-950 px-3 py-2.5 text-white">
                            <span className="text-xs font-black">
                              {
                                visual.accion
                              }
                            </span>

                            <ChevronRight
                              size={17}
                              className="transition group-hover:translate-x-1"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="mt-4 text-xs font-semibold text-slate-500">
                            Capacidad:{" "}
                            {
                              mesa.capacidad
                            }{" "}
                            personas
                          </p>

                          <div className="mt-3 flex items-center justify-between rounded-2xl bg-amber-500 px-3 py-2.5 text-slate-950">
                            <span className="text-xs font-black">
                              Abrir y pedir
                            </span>

                            <ChevronRight
                              size={17}
                              className="transition group-hover:translate-x-1"
                            />
                          </div>
                        </>
                      )}
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <Link
            href="/dashboard/productos"
            className="flex items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <ShoppingBasket
                  size={23}
                />
              </div>

              <div>
                <p className="font-black text-slate-950">
                  Productos
                </p>

                <p className="text-xs text-slate-500">
                  Consultar carta
                </p>
              </div>
            </div>

            <ChevronRight
              size={20}
              className="text-slate-400"
            />
          </Link>

          <Link
            href="/dashboard/comprobantes"
            className="flex items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <WalletCards
                  size={23}
                />
              </div>

              <div>
                <p className="font-black text-slate-950">
                  Comprobantes
                </p>

                <p className="text-xs text-slate-500">
                  Boletas y facturas
                </p>
              </div>
            </div>

            <ChevronRight
              size={20}
              className="text-slate-400"
            />
          </Link>

          <div className="flex items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Clock3
                  size={23}
                />
              </div>

              <div>
                <p className="font-black text-slate-950">
                  Actualización automática
                </p>

                <p className="text-xs text-slate-500">
                  Cada 5 segundos
                </p>
              </div>
            </div>

            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
          </div>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          <Link
            href="/dashboard/mozo"
            className="flex flex-col items-center justify-center rounded-2xl bg-slate-950 px-2 py-2 text-[10px] font-black text-white"
          >
            <Sparkles
              size={20}
            />
            Inicio
          </Link>

          <a
            href="#mesas"
            className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black text-slate-600"
          >
            <Users
              size={20}
            />
            Mesas
          </a>

          <Link
            href="/dashboard/pedidos"
            className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black text-slate-600"
          >
            <ReceiptText
              size={20}
            />
            Pedidos
          </Link>

          <Link
            href="/dashboard/caja"
            className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black text-slate-600"
          >
            <CircleDollarSign
              size={20}
            />
            Caja
          </Link>
        </div>
      </nav>
    </main>
  );
}