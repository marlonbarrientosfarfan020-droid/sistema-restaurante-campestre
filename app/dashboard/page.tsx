"use client";

import Link from "next/link";

import {
  BarChart3,
  Bell,
  ChefHat,
  CircleDollarSign,
  Clock3,
  FolderTree,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  PackageCheck,
  PackageMinus,
  PackageX,
  ReceiptText,
  Trophy,
  WalletCards,
  RefreshCcw,
  Settings,
  ShoppingBag,
  ShoppingBasket,
  Store,
  TrendingUp,
  UserCog,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useMesas,
} from "@/hooks/useMesas";

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

type ProductoInventario = {
  id: string;
  nombre: string;
  controlaStock: boolean;
  stockActual: string;
  stockMinimo: string;
  disponible: boolean;
  activo: boolean;
  categoria: {
    id: string;
    codigo: string;
    nombre: string;
  };
};

type MetricasDashboard = {
  fecha: string;
  ventasHoy: number;
  ventasAyer: number;
  variacionVsAyer: number;
  pedidosHoy: number;
  atencionesPagadas: number;
  mesasAtendidas: number;
  ticketPromedio: number;

  ventasPorHora: Array<{
    hora: number;
    etiqueta: string;
    total: number;
  }>;

  metodosPago: Array<{
    metodo: string;
    total: number;
    operaciones: number;
  }>;

  topProductos: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    total: number;
  }>;
};

function Tarjeta({
  titulo,
  valor,
  descripcion,
  icono,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {valor}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {descripcion}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950 p-3 text-white">
          {icono}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [
    sucursal,
    setSucursal,
  ] =
    useState<SucursalPrincipal | null>(
      null
    );

  const [
    cargandoSucursal,
    setCargandoSucursal,
  ] =
    useState(true);

  const [
    sesion,
    setSesion,
  ] =
    useState<SesionActual | null>(
      null
    );

  const [
    cargandoSesion,
    setCargandoSesion,
  ] =
    useState(true);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] =
    useState(false);

  const [
    metricas,
    setMetricas,
  ] =
    useState<MetricasDashboard | null>(
      null
    );

  const [
    cargandoMetricas,
    setCargandoMetricas,
  ] =
    useState(true);

  const [
    errorMetricas,
    setErrorMetricas,
  ] =
    useState("");

  const [
    productos,
    setProductos,
  ] = useState<ProductoInventario[]>(
    []
  );

  const [
    cargandoProductos,
    setCargandoProductos,
  ] = useState(true);

  const [
    errorProductos,
    setErrorProductos,
  ] = useState("");

  const {
    mesas,
    cargando,
    mesasLibres,
    mesasOcupadas,
    mesasConCuentaSolicitada,
    totalAtencionesAbiertas,
    recargar,
  } = useMesas({
    sucursalId:
      sucursal?.id ?? null,
  });

  useEffect(() => {
    async function cargarSesionActual() {
      try {
        setCargandoSesion(true);

        const respuesta =
          await fetch(
            "/api/auth/me",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<SesionActual>;

        if (
          !respuesta.ok ||
          !resultado.success ||
          !resultado.data
        ) {
          window.location.href =
            "/login";

          return;
        }

        setSesion(
          resultado.data
        );
      } catch {
        window.location.href =
          "/login";
      } finally {
        setCargandoSesion(false);
      }
    }

    cargarSesionActual();
  }, []);

  useEffect(() => {
    async function cargarSucursal() {
      try {
        setCargandoSucursal(true);

        const respuesta =
          await fetch(
            "/api/sucursales/principal",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<SucursalPrincipal>;

        if (
          respuesta.ok &&
          resultado.success &&
          resultado.data
        ) {
          setSucursal(
            resultado.data
          );
        }
      } finally {
        setCargandoSucursal(false);
      }
    }

    cargarSucursal();
  }, []);

  useEffect(() => {
    async function cargarMetricas() {
      try {
        setCargandoMetricas(
          true
        );

        setErrorMetricas(
          ""
        );

        const respuesta =
          await fetch(
            "/api/dashboard/metricas",
            {
              method:
                "GET",
              cache:
                "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<MetricasDashboard>;

        if (
          !respuesta.ok ||
          !resultado.success ||
          !resultado.data
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar las métricas."
          );
        }

        setMetricas(
          resultado.data
        );
      } catch (
        errorDesconocido
      ) {
        setErrorMetricas(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudieron cargar las métricas."
        );
      } finally {
        setCargandoMetricas(
          false
        );
      }
    }

    cargarMetricas();

    const intervalo =
      window.setInterval(
        cargarMetricas,
        15000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, []);

  useEffect(() => {
    async function cargarProductos() {
      try {
        setCargandoProductos(true);
        setErrorProductos("");

        const respuesta =
          await fetch(
            "/api/productos",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            ProductoInventario[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar los productos."
          );
        }

        setProductos(
          resultado.data ?? []
        );
      } catch (
        errorDesconocido
      ) {
        setErrorProductos(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar el inventario."
        );
      } finally {
        setCargandoProductos(false);
      }
    }

    cargarProductos();

    const intervalo =
      window.setInterval(
        cargarProductos,
        10000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, []);

  const consumoAbierto =
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
      [
        mesas,
      ]
    );

  const pedidosPendientes =
    useMemo(
      () =>
        mesas.filter(
          (mesa) =>
            mesa.estado ===
            "PEDIDO_PENDIENTE"
        ).length,
      [
        mesas,
      ]
    );

  const productosActivos =
    useMemo(
      () =>
        productos.filter(
          (producto) =>
            producto.activo
        ),
      [
        productos,
      ]
    );

  const productosConStock =
    useMemo(
      () =>
        productosActivos.filter(
          (producto) =>
            producto.controlaStock
        ),
      [
        productosActivos,
      ]
    );

  const productosAgotados =
    useMemo(
      () =>
        productosConStock.filter(
          (producto) =>
            Number(
              producto.stockActual
            ) <= 0
        ),
      [
        productosConStock,
      ]
    );

  const productosStockBajo =
    useMemo(
      () =>
        productosConStock.filter(
          (producto) => {
            const actual =
              Number(
                producto.stockActual
              );

            const minimo =
              Number(
                producto.stockMinimo
              );

            return (
              actual > 0 &&
              actual <= minimo
            );
          }
        ),
      [
        productosConStock,
      ]
    );

  const productosStockNormal =
    productosConStock.length -
    productosAgotados.length -
    productosStockBajo.length;

  const requierenReposicion =
    useMemo(
      () =>
        [
          ...productosAgotados,
          ...productosStockBajo,
        ].sort(
          (a, b) =>
            Number(
              a.stockActual
            ) -
            Number(
              b.stockActual
            )
        ),
      [
        productosAgotados,
        productosStockBajo,
      ]
    );

  async function actualizarTodo() {
    recargar();

    try {
      const respuestaMetricas =
        await fetch(
          "/api/dashboard/metricas",
          {
            method:
              "GET",
            cache:
              "no-store",
          }
        );

      const resultadoMetricas =
        (await respuestaMetricas.json()) as ApiResponse<MetricasDashboard>;

      if (
        respuestaMetricas.ok &&
        resultadoMetricas.success &&
        resultadoMetricas.data
      ) {
        setMetricas(
          resultadoMetricas.data
        );
      }
    } catch {
      // La actualización del inventario continúa aunque falle la analítica.
    }

    try {
      setCargandoProductos(true);
      setErrorProductos("");

      const respuesta =
        await fetch(
          "/api/productos",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<
          ProductoInventario[]
        >;

      if (
        respuesta.ok &&
        resultado.success
      ) {
        setProductos(
          resultado.data ?? []
        );
      } else {
        setErrorProductos(
          resultado.message ||
            "No se pudo actualizar el inventario."
        );
      }
    } catch (
      errorDesconocido
    ) {
      setErrorProductos(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo actualizar el inventario."
      );
    } finally {
      setCargandoProductos(false);
    }
  }

  const puedeAdministrar =
    sesion?.rol ===
      "SUPERADMIN" ||
    sesion?.rol ===
      "ADMINISTRADOR";

  async function cerrarSesion() {
    try {
      setCerrandoSesion(true);

      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );
    } finally {
      window.location.href =
        "/login";
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 px-5 py-6 text-white lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500 p-3 text-slate-950">
              <UtensilsCrossed
                size={26}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Restaurante Campestre
              </p>

              <h1 className="text-xl font-black">
                Chinka Chinka
              </h1>

              <p className="mt-1 text-xs italic text-slate-400">
                Donde te pierdes con el buen sabor
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sesión actual
            </p>

            <p className="mt-2 truncate font-black text-white">
              {cargandoSesion
                ? "Cargando usuario..."
                : sesion
                  ? `${sesion.nombres} ${sesion.apellidos}`
                  : "Sin sesión"}
            </p>

            <p className="mt-1 text-xs font-bold text-amber-400">
              {sesion?.rol ?? ""}
            </p>

            {sesion?.correo && (
              <p className="mt-1 truncate text-xs text-slate-400">
                {sesion.correo}
              </p>
            )}
          </div>

          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="flex w-full items-center gap-3 rounded-2xl bg-amber-500 px-4 py-3 font-bold text-slate-950"
            >
              <LayoutDashboard
                size={20}
              />
              Panel principal
            </Link>

            <Link
              href="/dashboard/mesas"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <UtensilsCrossed
                size={20}
              />
              Mesas y atención
            </Link>

            <Link
              href="/dashboard/cocina"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <ChefHat size={20} />
              Cocina
            </Link>

            <Link
              href="/dashboard/entregas"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <ShoppingBag size={20} />
              Entregas
            </Link>

            <Link
              href="/dashboard/categorias"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <FolderTree
                size={20}
              />
              Categorías
            </Link>

            <Link
              href="/dashboard/productos"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <ShoppingBasket
                size={20}
              />
              Productos
            </Link>

            <Link
              href="/dashboard/pedidos"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <ReceiptText
                size={20}
              />
              Pedidos
            </Link>

            <Link
              href="/dashboard/caja"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <CircleDollarSign
                size={20}
              />
              Caja
            </Link>

            <Link
              href="/dashboard/comprobantes"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <ReceiptText
                size={20}
              />
              Comprobantes
            </Link>

            {puedeAdministrar && (
              <>
                <div className="my-4 border-t border-slate-800" />

                <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Administración
                </p>

                <Link
                  href="/dashboard/configuracion/usuarios"
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
                >
                  <UserCog
                    size={20}
                  />
                  Usuarios
                </Link>

                <Link
                  href="/dashboard/configuracion"
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
                >
                  <Settings
                    size={20}
                  />
                  Configuración
                </Link>
              </>
            )}

            <div className="my-4 border-t border-slate-800" />

            <button
              type="button"
              onClick={
                cerrarSesion
              }
              disabled={
                cerrandoSesion
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
            >
              <LogOut
                size={20}
              />

              {cerrandoSesion
                ? "Cerrando..."
                : "Cerrar sesión"}
            </button>
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-4 md:p-7">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl md:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
                    Restaurante Chinka Chinka
                  </p>

                  <h2 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                    <BarChart3
                      size={38}
                    />
                    Panel principal
                  </h2>

                  <p className="mt-3 max-w-2xl text-slate-300">
                    Resumen operativo e inventario en tiempo real. Controla mesas, pedidos, consumo abierto y productos que necesitan reposición.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="rounded-2xl bg-white/10 px-5 py-3">
                    <p className="text-xs text-slate-300">
                      Sucursal
                    </p>

                    <p className="font-black">
                      {cargandoSucursal
                        ? "Cargando..."
                        : sucursal?.nombre ??
                          "No disponible"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      actualizarTodo
                    }
                    disabled={
                      cargando ||
                      cargandoProductos
                    }
                    className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 disabled:opacity-50"
                  >
                    <RefreshCcw
                      size={19}
                      className={
                        cargando ||
                        cargandoProductos
                          ? "animate-spin"
                          : ""
                      }
                    />
                    Actualizar
                  </button>
                </div>
              </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Tarjeta
                titulo="Mesas ocupadas"
                valor={String(
                  mesasOcupadas
                )}
                descripcion={`${mesasLibres} mesas libres`}
                icono={
                  <Users
                    size={24}
                  />
                }
              />

              <Tarjeta
                titulo="Atenciones abiertas"
                valor={String(
                  totalAtencionesAbiertas
                )}
                descripcion="Atenciones activas ahora"
                icono={
                  <Store
                    size={24}
                  />
                }
              />

              <Tarjeta
                titulo="Pedidos pendientes"
                valor={String(
                  pedidosPendientes
                )}
                descripcion={`${mesasConCuentaSolicitada} cuenta(s) solicitada(s)`}
                icono={
                  <Bell
                    size={24}
                  />
                }
              />

              <Tarjeta
                titulo="Consumo abierto"
                valor={`S/ ${consumoAbierto.toFixed(
                  2
                )}`}
                descripcion="Consumo de atenciones aún abiertas"
                icono={
                  <CircleDollarSign
                    size={24}
                  />
                }
              />
            </section>

            <section className="space-y-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-600">
                    Inventario
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-slate-950">
                    Estado del stock en tiempo real
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Productos con control de stock registrados en el catálogo.
                  </p>
                </div>

                <Link
                  href="/dashboard/productos"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-slate-800"
                >
                  Ver catálogo
                </Link>
              </div>

              {errorProductos && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
                  {errorProductos}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-emerald-700">
                        Stock normal
                      </p>

                      <p className="mt-2 text-3xl font-black text-emerald-700">
                        {cargandoProductos
                          ? "..."
                          : productosStockNormal}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <PackageCheck
                        size={25}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-orange-700">
                        Stock bajo
                      </p>

                      <p className="mt-2 text-3xl font-black text-orange-700">
                        {cargandoProductos
                          ? "..."
                          : productosStockBajo.length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                      <PackageMinus
                        size={25}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-red-700">
                        Agotados
                      </p>

                      <p className="mt-2 text-3xl font-black text-red-700">
                        {cargandoProductos
                          ? "..."
                          : productosAgotados.length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-red-100 p-3 text-red-700">
                      <PackageX
                        size={25}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
                      Reposición
                    </p>

                    <h4 className="mt-1 text-xl font-black text-slate-950">
                      Productos que requieren atención
                    </h4>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                    {requierenReposicion.length} producto
                    {requierenReposicion.length === 1
                      ? ""
                      : "s"}
                  </span>
                </div>

                {cargandoProductos ? (
                  <div className="flex min-h-40 items-center justify-center">
                    <LoaderCircle
                      size={34}
                      className="animate-spin text-amber-500"
                    />
                  </div>
                ) : requierenReposicion.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-7 text-center">
                    <PackageCheck
                      size={38}
                      className="mx-auto text-emerald-600"
                    />

                    <p className="mt-3 font-black text-emerald-800">
                      Todo el inventario está en niveles normales.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {requierenReposicion
                      .slice(0, 9)
                      .map(
                        (producto) => {
                          const actual =
                            Number(
                              producto.stockActual
                            );

                          const minimo =
                            Number(
                              producto.stockMinimo
                            );

                          const agotado =
                            actual <= 0;

                          return (
                            <Link
                              key={
                                producto.id
                              }
                              href="/dashboard/productos"
                              className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                                agotado
                                  ? "border-red-200 bg-red-50"
                                  : "border-orange-200 bg-orange-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p
                                    className={`text-xs font-black uppercase tracking-wider ${
                                      agotado
                                        ? "text-red-600"
                                        : "text-orange-600"
                                    }`}
                                  >
                                    {agotado
                                      ? "Agotado"
                                      : "Stock bajo"}
                                  </p>

                                  <h5 className="mt-1 font-black text-slate-950">
                                    {producto.nombre}
                                  </h5>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {producto.categoria.nombre}
                                  </p>
                                </div>

                                {agotado ? (
                                  <PackageX
                                    size={22}
                                    className="shrink-0 text-red-600"
                                  />
                                ) : (
                                  <PackageMinus
                                    size={22}
                                    className="shrink-0 text-orange-600"
                                  />
                                )}
                              </div>

                              <div className="mt-4 flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold text-slate-500">
                                    Stock actual
                                  </p>

                                  <p
                                    className={`text-2xl font-black ${
                                      agotado
                                        ? "text-red-700"
                                        : "text-orange-700"
                                    }`}
                                  >
                                    {actual}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-xs font-bold text-slate-500">
                                    Mínimo
                                  </p>

                                  <p className="font-black text-slate-700">
                                    {minimo}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        }
                      )}
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2 space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                        Analítica comercial
                      </p>

                      <h3 className="mt-1 text-2xl font-black text-slate-950">
                        Ventas de hoy en tiempo real
                      </h3>
                    </div>

                    <TrendingUp
                      size={32}
                      className="text-blue-600"
                    />
                  </div>

                  {errorMetricas && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700">
                      {errorMetricas}
                    </div>
                  )}

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-blue-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-blue-700">
                        Ventas hoy
                      </p>

                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {cargandoMetricas
                          ? "..."
                          : `S/ ${(metricas?.ventasHoy ?? 0).toFixed(2)}`}
                      </p>

                      <p className={`mt-1 text-xs font-black ${
                        (metricas?.variacionVsAyer ?? 0) >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}>
                        {(metricas?.variacionVsAyer ?? 0) >= 0
                          ? "+"
                          : ""}
                        {(metricas?.variacionVsAyer ?? 0).toFixed(2)}% vs ayer
                      </p>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                        Pedidos hoy
                      </p>

                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {cargandoMetricas
                          ? "..."
                          : metricas?.pedidosHoy ?? 0}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Pedidos de cuentas pagadas
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                        Ticket promedio
                      </p>

                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {cargandoMetricas
                          ? "..."
                          : `S/ ${(metricas?.ticketPromedio ?? 0).toFixed(2)}`}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Por atención pagada
                      </p>
                    </div>

                    <div className="rounded-2xl bg-violet-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                        Mesas atendidas
                      </p>

                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {cargandoMetricas
                          ? "..."
                          : metricas?.mesasAtendidas ?? 0}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Con pago registrado hoy
                      </p>
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="font-black text-slate-950">
                          Ventas por hora
                        </p>

                        <p className="text-sm text-slate-500">
                          Monto cobrado en cada hora del día
                        </p>
                      </div>

                      <p className="text-sm font-black text-blue-600">
                        S/ {(metricas?.ventasHoy ?? 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-5 flex h-56 items-end gap-1 overflow-x-auto rounded-2xl bg-slate-50 p-4">
                      {(metricas?.ventasPorHora ?? []).map(
                        (punto) => {
                          const maximo =
                            Math.max(
                              1,
                              ...(
                                metricas?.ventasPorHora ??
                                []
                              ).map(
                                (item) =>
                                  item.total
                              )
                            );

                          const alto =
                            punto.total > 0
                              ? Math.max(
                                  8,
                                  (punto.total /
                                    maximo) *
                                    170
                                )
                              : 2;

                          return (
                            <div
                              key={punto.hora}
                              className="flex min-w-8 flex-1 flex-col items-center justify-end"
                              title={`${punto.etiqueta} · S/ ${punto.total.toFixed(2)}`}
                            >
                              <span className="mb-1 text-[9px] font-bold text-slate-500">
                                {punto.total > 0
                                  ? `S/${Math.round(punto.total)}`
                                  : ""}
                              </span>

                              <div
                                className="w-full max-w-7 rounded-t-lg bg-blue-600"
                                style={{
                                  height:
                                    `${alto}px`,
                                }}
                              />

                              <span className="mt-2 text-[9px] font-bold text-slate-400">
                                {String(
                                  punto.hora
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                        <Trophy
                          size={24}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-amber-600">
                          Ranking
                        </p>

                        <h4 className="text-xl font-black text-slate-950">
                          Platos más vendidos
                        </h4>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {(metricas?.topProductos ?? []).length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                          Aún no hay ventas pagadas hoy.
                        </div>
                      ) : (
                        metricas?.topProductos.map(
                          (
                            producto,
                            indice
                          ) => (
                            <div
                              key={
                                producto.productoId
                              }
                              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                                  {indice + 1}
                                </span>

                                <div>
                                  <p className="font-black text-slate-950">
                                    {producto.nombre}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    S/ {producto.total.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-800">
                                {producto.cantidad} und.
                              </span>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <WalletCards
                          size={24}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-emerald-600">
                          Cobros
                        </p>

                        <h4 className="text-xl font-black text-slate-950">
                          Métodos de pago
                        </h4>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {(metricas?.metodosPago ?? []).length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                          Aún no hay pagos registrados hoy.
                        </div>
                      ) : (
                        metricas?.metodosPago.map(
                          (metodo) => {
                            const porcentaje =
                              (metricas?.ventasHoy ?? 0) > 0
                                ? (metodo.total /
                                    (metricas?.ventasHoy ?? 1)) *
                                  100
                                : 0;

                            return (
                              <div
                                key={
                                  metodo.metodo
                                }
                              >
                                <div className="flex items-center justify-between gap-4 text-sm">
                                  <span className="font-black text-slate-700">
                                    {metodo.metodo}
                                  </span>

                                  <span className="font-black text-slate-950">
                                    S/ {metodo.total.toFixed(2)}
                                  </span>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{
                                      width:
                                        `${Math.min(
                                          100,
                                          porcentaje
                                        )}%`,
                                    }}
                                  />
                                </div>

                                <p className="mt-1 text-right text-xs text-slate-400">
                                  {porcentaje.toFixed(1)}% · {metodo.operaciones} operación
                                  {metodo.operaciones === 1
                                    ? ""
                                    : "es"}
                                </p>
                              </div>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wider text-amber-600">
                  Acceso rápido
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  Operación
                </h3>

                <div className="mt-5 space-y-3">
                  <Link
                    href="/dashboard/mesas"
                    className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-4 font-black text-amber-800 transition hover:bg-amber-100"
                  >
                    <span className="flex items-center gap-3">
                      <UtensilsCrossed
                        size={20}
                      />
                      Mesas y atención
                    </span>
                    →
                  </Link>

                  <Link
                    href="/dashboard/cocina"
                    className="flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-4 font-black text-orange-800 transition hover:bg-orange-100"
                  >
                    <span className="flex items-center gap-3">
                      <ChefHat
                        size={20}
                      />
                      Cocina
                    </span>
                    →
                  </Link>

                  <Link
                    href="/dashboard/caja"
                    className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-4 font-black text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <span className="flex items-center gap-3">
                      <CircleDollarSign
                        size={20}
                      />
                      Caja
                    </span>
                    →
                  </Link>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-600">
                  <Clock3
                    size={18}
                  />
                  Datos operativos actuales
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}