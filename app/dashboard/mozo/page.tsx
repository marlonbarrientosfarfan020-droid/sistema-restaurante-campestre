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
  CircleDollarSign,
  LoaderCircle,
  RefreshCcw,
  Search,
  ShoppingBasket,
  Users,
} from "lucide-react";

type AtencionActual = {
  id: string;
  codigo: string;
  estado: string;
  cantidadPersonas: number;
  metodoPagoPrevisto: string | null;
  subtotal: string | number;
  descuento: string | number;
  total: string | number;
  fechaApertura: string;
  cantidadPedidos: number;
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
  atencionActual: AtencionActual | null;
};

type SucursalPrincipal = {
  id: string;
  nombre: string;
  codigo: string;
  empresa: {
    nombre: string;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

function dinero(
  valor:
    | string
    | number
    | null
    | undefined
) {
  return `S/ ${Number(valor ?? 0).toFixed(2)}`;
}

function estadoVisual(
  estado: string
) {
  const mapa: Record<
    string,
    {
      texto: string;
      clases: string;
      punto: string;
      accion: string;
    }
  > = {
    LIBRE: {
      texto: "Libre",
      clases:
        "border-slate-200 bg-white",
      punto: "bg-slate-400",
      accion: "ABRIR Y PEDIR",
    },

    OCUPADA: {
      texto: "Ocupada",
      clases:
        "border-amber-300 bg-amber-50",
      punto: "bg-amber-500",
      accion: "ATENDER",
    },

    PEDIDO_PENDIENTE: {
      texto: "Pedido pendiente",
      clases:
        "border-orange-300 bg-orange-50",
      punto: "bg-orange-500",
      accion: "ATENDER",
    },

    CONSUMIENDO: {
      texto: "Consumiendo",
      clases:
        "border-yellow-300 bg-yellow-50",
      punto: "bg-yellow-500",
      accion: "NUEVO PEDIDO",
    },

    SOLICITO_CUENTA: {
      texto: "Solicitó cuenta",
      clases:
        "border-blue-300 bg-blue-50",
      punto: "bg-blue-500",
      accion: "VER CUENTA",
    },

    PAGADA: {
      texto: "Pagada",
      clases:
        "border-emerald-300 bg-emerald-50",
      punto: "bg-emerald-500",
      accion: "REVISAR",
    },

    LIMPIEZA: {
      texto: "Limpieza",
      clases:
        "border-violet-300 bg-violet-50",
      punto: "bg-violet-500",
      accion: "REVISAR",
    },
  };

  return (
    mapa[estado] ?? {
      texto: estado,
      clases:
        "border-slate-200 bg-white",
      punto: "bg-slate-400",
      accion: "ATENDER",
    }
  );
}

export default function MozoPage() {
  const [
    sucursal,
    setSucursal,
  ] =
    useState<SucursalPrincipal | null>(
      null
    );

  const [mesas, setMesas] =
    useState<Mesa[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [filtro, setFiltro] =
    useState<
      "TODAS" | "LIBRES" | "OCUPADAS" | "CUENTA"
    >("TODAS");

  const cargarDatos =
    useCallback(async (
      mostrarCargaCompleta = false
    ) => {
      try {
        if (mostrarCargaCompleta) {
          setCargando(true);
        } else {
          setActualizando(true);
        }

        setError("");

        const respuestaSucursal =
          await fetch(
            "/api/sucursales/principal",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultadoSucursal =
          (await respuestaSucursal.json()) as ApiResponse<SucursalPrincipal>;

        if (
          !respuestaSucursal.ok ||
          !resultadoSucursal.success ||
          !resultadoSucursal.data
        ) {
          throw new Error(
            resultadoSucursal.message ||
              "No se pudo obtener la sucursal."
          );
        }

        const sucursalActual =
          resultadoSucursal.data;

        setSucursal(
          sucursalActual
        );

        const respuestaMesas =
          await fetch(
            `/api/mesas?sucursalId=${encodeURIComponent(
              sucursalActual.id
            )}`,
            {
              method: "GET",
              cache: "no-store",
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
          resultadoMesas.data ?? []
        );
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Ocurrió un error cargando el panel del mozo."
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    }, []);

  useEffect(() => {
    cargarDatos(true);

    const intervalo =
      window.setInterval(
        () => {
          cargarDatos(false);
        },
        5000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [cargarDatos]);

  const mesasLibres =
    useMemo(
      () =>
        mesas.filter(
          (mesa) =>
            mesa.estado === "LIBRE"
        ).length,
      [mesas]
    );

  const mesasOcupadas =
    useMemo(
      () =>
        mesas.filter(
          (mesa) =>
            mesa.estado !== "LIBRE"
        ).length,
      [mesas]
    );

  const mesasCuenta =
    useMemo(
      () =>
        mesas.filter(
          (mesa) =>
            mesa.estado ===
              "SOLICITO_CUENTA" ||
            mesa.estado === "PAGADA"
        ).length,
      [mesas]
    );

  const consumo =
    useMemo(
      () =>
        mesas.reduce(
          (total, mesa) =>
            total +
            Number(
              mesa.atencionActual
                ?.total ?? 0
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
          const coincideBusqueda =
            !texto ||
            mesa.nombre
              .toLocaleLowerCase(
                "es-PE"
              )
              .includes(texto) ||
            String(
              mesa.numero
            ).includes(texto) ||
            mesa.zona.nombre
              .toLocaleLowerCase(
                "es-PE"
              )
              .includes(texto);

          const coincideFiltro =
            filtro === "TODAS" ||
            (filtro === "LIBRES" &&
              mesa.estado ===
                "LIBRE") ||
            (filtro === "OCUPADAS" &&
              mesa.estado !==
                "LIBRE") ||
            (filtro === "CUENTA" &&
              [
                "SOLICITO_CUENTA",
                "PAGADA",
              ].includes(
                mesa.estado
              ));

          return (
            coincideBusqueda &&
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
          <LoaderCircle
            size={48}
            className="mx-auto animate-spin text-amber-500"
          />

          <p className="mt-4 font-black text-slate-700">
            Preparando modo mozo...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <header className="sticky top-0 z-30 bg-slate-950 px-4 pb-4 pt-4 text-white shadow-xl md:px-6">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400">
                Chinka Chinka
              </p>

              <h1 className="mt-1 text-2xl font-black md:text-3xl">
                Modo Mozo
              </h1>

              {sucursal && (
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {sucursal.nombre}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                cargarDatos(false)
              }
              disabled={
                actualizando
              }
              className="rounded-2xl bg-white/10 p-3 text-white"
              title="Actualizar"
            >
              <RefreshCcw
                size={21}
                className={
                  actualizando
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>

          <div className="mt-4 relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
              placeholder="Buscar mesa..."
              className="w-full rounded-2xl border border-white/10 bg-white px-11 py-3.5 font-bold text-slate-950 outline-none"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-4 p-4 md:p-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() =>
              setFiltro("LIBRES")
            }
            className={`rounded-2xl p-3 text-left shadow-sm ${
              filtro === "LIBRES"
                ? "bg-slate-950 text-white"
                : "bg-white"
            }`}
          >
            <p className="text-[10px] font-bold opacity-70">
              LIBRES
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
            className={`rounded-2xl p-3 text-left shadow-sm ${
              filtro === "OCUPADAS"
                ? "bg-slate-950 text-white"
                : "bg-white"
            }`}
          >
            <p className="text-[10px] font-bold opacity-70">
              OCUPADAS
            </p>
            <p className="mt-1 text-2xl font-black">
              {mesasOcupadas}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFiltro("CUENTA")
            }
            className={`rounded-2xl p-3 text-left shadow-sm ${
              filtro === "CUENTA"
                ? "bg-slate-950 text-white"
                : "bg-white"
            }`}
          >
            <p className="text-[10px] font-bold opacity-70">
              CUENTA
            </p>
            <p className="mt-1 text-2xl font-black">
              {mesasCuenta}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFiltro("TODAS")
            }
            className={`rounded-2xl p-3 text-left shadow-sm ${
              filtro === "TODAS"
                ? "bg-slate-950 text-white"
                : "bg-white"
            }`}
          >
            <p className="text-[10px] font-bold opacity-70">
              CONSUMO
            </p>
            <p className="mt-1 text-base font-black">
              {dinero(consumo)}
            </p>
          </button>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Mesas
              </h2>
              <p className="text-xs text-slate-500">
                Toca una mesa y atiende.
              </p>
            </div>

            <ChefHat
              size={26}
              className="text-amber-500"
            />
          </div>

          {mesasFiltradas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No encontramos mesas.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {mesasFiltradas.map(
                (mesa) => {
                  const visual =
                    estadoVisual(
                      mesa.estado
                    );

                  return (
                    <Link
                      key={mesa.id}
                      href={`/dashboard/mozo/mesa/${mesa.id}`}
                      className={`relative overflow-hidden rounded-3xl border-2 p-4 transition active:scale-[0.98] ${visual.clases}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            {
                              mesa.zona
                                .nombre
                            }
                          </p>

                          <h3 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">
                            {mesa.nombre}
                          </h3>
                        </div>

                        <span
                          className={`mt-1 h-3 w-3 shrink-0 rounded-full ${visual.punto}`}
                        />
                      </div>

                      <span className="mt-3 inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black text-slate-700">
                        {visual.texto}
                      </span>

                      {mesa.atencionActual ? (
                        <div className="mt-3 border-t border-slate-200 pt-3">
                          <div className="flex items-end justify-between gap-2">
                            <div>
                              <p className="text-[10px] font-bold text-slate-500">
                                Consumo
                              </p>

                              <p className="text-lg font-black text-emerald-700">
                                {dinero(
                                  mesa
                                    .atencionActual
                                    .total
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-500">
                                Pedidos
                              </p>

                              <p className="font-black">
                                {
                                  mesa
                                    .atencionActual
                                    .cantidadPedidos
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white">
                            <ShoppingBasket
                              size={15}
                            />
                            {visual.accion}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 border-t border-slate-200 pt-3">
                          <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-black text-slate-950">
                            <Users
                              size={15}
                            />
                            ABRIR Y PEDIR
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <Link
            href="/dashboard/mozo"
            className="flex flex-col items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white"
          >
            <Users size={20} />
            MESAS
          </Link>

          <Link
            href="/dashboard/mozo/pedidos"
            className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-[10px] font-black text-slate-700"
          >
            <BellRing size={20} />
            QR
          </Link>

          <Link
            href="/dashboard/caja"
            className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-[10px] font-black text-slate-700"
          >
            <CircleDollarSign
              size={20}
            />
            CUENTAS
          </Link>
        </div>
      </nav>
    </main>
  );
}
