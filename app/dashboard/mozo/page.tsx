"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BellRing,
  ChefHat,
  CircleDollarSign,
  LoaderCircle,
  RefreshCcw,
  ShoppingBasket,
  Users,
} from "lucide-react";

type AtencionActual = {
  id: string;
  codigo: string;
  estado: string;
  cantidadPersonas: number;
  metodoPagoPrevisto:
    | string
    | null;
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

  atencionActual:
    | AtencionActual
    | null;
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
  const numero =
    Number(valor ?? 0);

  return `S/ ${numero.toFixed(2)}`;
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
    }
  > = {
    LIBRE: {
      texto: "Libre",
      clases:
        "border-slate-200 bg-white",
      punto:
        "bg-slate-400",
    },

    OCUPADA: {
      texto: "Ocupada",
      clases:
        "border-amber-300 bg-amber-50",
      punto:
        "bg-amber-500",
    },

    PEDIDO_PENDIENTE: {
      texto: "Pedido pendiente",
      clases:
        "border-orange-300 bg-orange-50",
      punto:
        "bg-orange-500",
    },

    CONSUMIENDO: {
      texto: "Consumiendo",
      clases:
        "border-yellow-300 bg-yellow-50",
      punto:
        "bg-yellow-500",
    },

    SOLICITO_CUENTA: {
      texto: "Solicitó cuenta",
      clases:
        "border-blue-300 bg-blue-50",
      punto:
        "bg-blue-500",
    },

    PAGADA: {
      texto: "Pagada",
      clases:
        "border-emerald-300 bg-emerald-50",
      punto:
        "bg-emerald-500",
    },

    LIMPIEZA: {
      texto: "Limpieza",
      clases:
        "border-violet-300 bg-violet-50",
      punto:
        "bg-violet-500",
    },
  };

  return (
    mapa[estado] ?? {
      texto: estado,
      clases:
        "border-slate-200 bg-white",
      punto:
        "bg-slate-400",
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

  const [error, setError] =
    useState("");

  const cargarDatos =
    useCallback(async () => {
      try {
        setCargando(true);
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
      }
    }, []);

  useEffect(() => {
    cargarDatos();

    const intervalo =
      window.setInterval(
        cargarDatos,
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

  const pedidosPendientes =
    useMemo(
      () =>
        mesas.filter(
          (mesa) =>
            mesa.estado ===
            "PEDIDO_PENDIENTE"
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

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <LoaderCircle
            size={48}
            className="mx-auto animate-spin text-amber-500"
          />

          <p className="mt-4 font-black text-slate-700">
            Cargando mesas...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black">
                <Users size={34} />
                Panel del mozo
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                Atiende mesas, registra pedidos y revisa solicitudes QR.
              </p>

              {sucursal && (
                <p className="mt-2 text-xs font-bold text-slate-400">
                  {sucursal.nombre}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/mozo/pedidos"
                className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 font-black text-slate-950"
              >
                <BellRing size={18} />
                Pedidos QR
              </Link>

              <button
                type="button"
                onClick={
                  cargarDatos
                }
                className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-black text-slate-950"
              >
                <RefreshCcw
                  size={18}
                />
                Actualizar
              </button>

              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
              >
                <ArrowLeft size={18} />
                Volver
              </Link>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">
              Libres
            </p>

            <p className="mt-1 text-3xl font-black">
              {mesasLibres}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">
              Ocupadas
            </p>

            <p className="mt-1 text-3xl font-black">
              {mesasOcupadas}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">
              Pedidos pendientes
            </p>

            <p className="mt-1 text-3xl font-black text-orange-600">
              {pedidosPendientes}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">
              Consumo activo
            </p>

            <p className="mt-1 text-2xl font-black text-emerald-600">
              {dinero(consumo)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Mesas
              </h2>

              <p className="text-sm text-slate-500">
                Toca una mesa para atenderla.
              </p>
            </div>

            <ChefHat
              size={28}
              className="text-amber-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mesas.map(
              (mesa) => {
                const visual =
                  estadoVisual(
                    mesa.estado
                  );

                const tieneAtencion =
                  Boolean(
                    mesa.atencionActual
                  );

                return (
                  <Link
                    key={mesa.id}
                    href={
                      tieneAtencion
                        ? `/dashboard/mesas/${mesa.id}`
                        : `/dashboard/mesas/${mesa.id}`
                    }
                    className={`rounded-3xl border-2 p-5 transition hover:-translate-y-0.5 hover:shadow-md ${visual.clases}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                          {
                            mesa.zona
                              .nombre
                          }
                        </p>

                        <h3 className="mt-1 text-3xl font-black text-slate-950">
                          {mesa.nombre}
                        </h3>
                      </div>

                      <span
                        className={`mt-1 h-3 w-3 rounded-full ${visual.punto}`}
                      />
                    </div>

                    <p className="mt-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black text-slate-700">
                      {visual.texto}
                    </p>

                    {mesa.atencionActual ? (
                      <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">
                            Atención
                          </span>

                          <span className="font-black">
                            {
                              mesa
                                .atencionActual
                                .codigo
                            }
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">
                            Pedidos
                          </span>

                          <span className="font-black">
                            {
                              mesa
                                .atencionActual
                                .cantidadPedidos
                            }
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">
                            Total
                          </span>

                          <span className="font-black text-emerald-700">
                            {dinero(
                              mesa
                                .atencionActual
                                .total
                            )}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 font-black text-white">
                          <ShoppingBasket
                            size={16}
                          />
                          Atender mesa
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2 font-black text-slate-950">
                          <Users
                            size={16}
                          />
                          Abrir atención
                        </div>
                      </div>
                    )}
                  </Link>
                );
              }
            )}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <Link
            href="/dashboard/mozo/pedidos"
            className="flex items-center justify-between rounded-3xl bg-slate-950 p-5 text-white"
          >
            <div>
              <p className="text-sm font-bold text-slate-400">
                Pedidos desde QR
              </p>

              <p className="mt-1 text-xl font-black">
                Revisar solicitudes
              </p>
            </div>

            <BellRing size={30} />
          </Link>

          <Link
            href="/dashboard/caja"
            className="flex items-center justify-between rounded-3xl bg-emerald-600 p-5 text-white"
          >
            <div>
              <p className="text-sm font-bold text-emerald-100">
                Cuentas
              </p>

              <p className="mt-1 text-xl font-black">
                Ir a Caja
              </p>
            </div>

            <CircleDollarSign
              size={30}
            />
          </Link>
        </section>
      </div>
    </main>
  );
}