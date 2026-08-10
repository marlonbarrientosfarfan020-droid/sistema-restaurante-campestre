"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Bell,
  ShoppingBag,
  CheckCircle2,
  ChefHat,
  CircleDollarSign,
  Clock3,
  FolderTree,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  ReceiptText,
  RefreshCcw,
  QrCode,
  ShoppingBasket,
  Settings,
  Store,
  UserCog,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";

import AbrirAtencionForm from "@/components/mesas/AbrirAtencionForm";
import AgregarPedidoForm from "@/components/pedidos/AgregarPedidoForm";

import { useMesas } from "@/hooks/useMesas";
import { usePedidos } from "@/hooks/usePedidos";

import type { MesaResumen } from "@/types/mesa";

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

type DatosNuevoPedido = {
  observacion: string;
  detalles: Array<{
    productoId: string;
    cantidad: number;
    observacion?: string;
  }>;
};

const estilosEstado = {
  LIBRE: {
    texto: "Libre",
    fondo: "bg-white",
    borde: "border-slate-200",
    punto: "bg-slate-400",
  },

  OCUPADA: {
    texto: "Ocupada",
    fondo: "bg-amber-50",
    borde: "border-amber-300",
    punto: "bg-amber-500",
  },

  PEDIDO_PENDIENTE: {
    texto: "Pedido pendiente",
    fondo: "bg-orange-50",
    borde: "border-orange-300",
    punto: "bg-orange-500",
  },

  CONSUMIENDO: {
    texto: "Consumiendo",
    fondo: "bg-yellow-50",
    borde: "border-yellow-300",
    punto: "bg-yellow-500",
  },

  SOLICITO_CUENTA: {
    texto: "Solicitó cuenta",
    fondo: "bg-blue-50",
    borde: "border-blue-300",
    punto: "bg-blue-500",
  },

  PAGADA: {
    texto: "Pagada",
    fondo: "bg-emerald-50",
    borde: "border-emerald-300",
    punto: "bg-emerald-500",
  },

  LIMPIEZA: {
    texto: "En limpieza",
    fondo: "bg-violet-50",
    borde: "border-violet-300",
    punto: "bg-violet-500",
  },
};

function calcularTiempo(
  fechaApertura: string | undefined,
  referenciaTiempo: number
) {
  if (!fechaApertura) {
    return "00:00";
  }

  const inicio = new Date(fechaApertura).getTime();

  const diferencia = Math.max(
    0,
    referenciaTiempo - inicio
  );

  const totalMinutos = Math.floor(
    diferencia / 60000
  );

  const horas = Math.floor(
    totalMinutos / 60
  );

  const minutos =
    totalMinutos % 60;

  return `${String(horas).padStart(
    2,
    "0"
  )}:${String(minutos).padStart(
    2,
    "0"
  )}`;
}

function formatearMetodoPago(
  metodo: string | null | undefined
) {
  const textos: Record<string, string> = {
    EFECTIVO: "Efectivo",
    YAPE: "Yape",
    PLIN: "Plin",
    TARJETA: "Tarjeta",
    MIXTO: "Pago mixto",
  };

  if (!metodo) {
    return "No indicado";
  }

  return textos[metodo] ?? metodo;
}

function TarjetaResumen({
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

export default function MesasPage() {
  const [sucursal, setSucursal] =
    useState<SucursalPrincipal | null>(
      null
    );

  const [
    cargandoSucursal,
    setCargandoSucursal,
  ] = useState(true);

  const [
    errorSucursal,
    setErrorSucursal,
  ] = useState("");

  const [
    sesion,
    setSesion,
  ] = useState<SesionActual | null>(
    null
  );

  const [
    cargandoSesion,
    setCargandoSesion,
  ] = useState(true);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] = useState(false);

  const [
    mesaSeleccionada,
    setMesaSeleccionada,
  ] = useState<MesaResumen | null>(
    null
  );

  const [
    mostrarAgregarPedido,
    setMostrarAgregarPedido,
  ] = useState(false);

  const [
    zonaFiltro,
    setZonaFiltro,
  ] = useState("");

  const [ahora, setAhora] =
    useState(Date.now());

  const {
    mesas,
    cargando,
    procesando,
    mensaje,
    error,
    mesasLibres,
    mesasOcupadas,
    mesasConCuentaSolicitada,
    totalAtencionesAbiertas,
    recargar,
    abrirAtencion,
    limpiarMensajes,
  } = useMesas({
    sucursalId:
      sucursal?.id ?? null,
  });

  const {
    enviando: enviandoPedido,
    mensaje: mensajePedido,
    error: errorPedido,
    crearPedido,
    limpiarMensajes:
      limpiarMensajesPedido,
  } = usePedidos();

  useEffect(() => {
    async function cargarSesionActual() {
      try {
        setCargandoSesion(true);

        const respuesta = await fetch(
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
        setErrorSucursal("");

        const respuesta = await fetch(
          "/api/sucursales/principal",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const resultado =
          (await respuesta.json()) as ApiResponse<SucursalPrincipal>;

        if (
          !respuesta.ok ||
          !resultado.success ||
          !resultado.data
        ) {
          throw new Error(
            resultado.message ||
              "No se pudo cargar la sucursal."
          );
        }

        setSucursal(resultado.data);
      } catch (errorDesconocido) {
        setErrorSucursal(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar la sucursal."
        );
      } finally {
        setCargandoSucursal(false);
      }
    }

    cargarSucursal();
  }, []);

  useEffect(() => {
    const intervalo =
      window.setInterval(() => {
        setAhora(Date.now());
      }, 60000);

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, []);

  const zonas = useMemo(() => {
    return Array.from(
      new Map(
        mesas.map((mesa) => [
          mesa.zona.id,
          mesa.zona,
        ])
      ).values()
    ).sort((a, b) =>
      a.nombre.localeCompare(
        b.nombre,
        "es-PE"
      )
    );
  }, [mesas]);

  const mesasFiltradas =
    useMemo(() => {
      if (!zonaFiltro) {
        return mesas;
      }

      return mesas.filter(
        (mesa) =>
          mesa.zona.id ===
          zonaFiltro
      );
    }, [mesas, zonaFiltro]);

  const ventaAcumulada =
    mesas.reduce(
      (total, mesa) =>
        total +
        Number(
          mesa.atencionActual
            ?.total ?? 0
        ),
      0
    );

  const pedidosPendientes =
    mesas.reduce(
      (total, mesa) =>
        total +
        (mesa.estado ===
        "PEDIDO_PENDIENTE"
          ? 1
          : 0),
      0
    );

  async function confirmarApertura(
    datos: {
      cantidadPersonas: number;
      metodoPagoPrevisto:
        | "EFECTIVO"
        | "YAPE"
        | "PLIN"
        | "TARJETA"
        | "MIXTO";
      observacion: string;
    }
  ) {
    if (!mesaSeleccionada) {
      return false;
    }

    const resultado =
      await abrirAtencion({
        mesaId:
          mesaSeleccionada.id,

        cantidadPersonas:
          datos.cantidadPersonas,

        metodoPagoPrevisto:
          datos.metodoPagoPrevisto,

        observacion:
          datos.observacion,
      });

    if (!resultado) {
      return false;
    }

    setMesaSeleccionada(null);

    return true;
  }

  async function enviarPedidoReal(
    datos: DatosNuevoPedido
  ) {
    const atencion =
      mesaSeleccionada
        ?.atencionActual;

    if (!sucursal || !atencion) {
      return false;
    }

    const resultado =
      await crearPedido({
        atencionId: atencion.id,
        sucursalId: sucursal.id,
        origen: "MOZO",
        observacion:
          datos.observacion,
        detalles: datos.detalles,
      });

    if (!resultado) {
      return false;
    }

    await recargar();

    setMostrarAgregarPedido(
      false
    );

    setMesaSeleccionada(null);

    return true;
  }

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

  const puedeAdministrar =
    sesion?.rol ===
      "SUPERADMIN" ||
    sesion?.rol ===
      "ADMINISTRADOR";

  function cerrarMesaSeleccionada() {
    if (
      procesando ||
      enviandoPedido
    ) {
      return;
    }

    setMesaSeleccionada(null);
    setMostrarAgregarPedido(false);
  }

  const mensajeVisible =
    mensajePedido ||
    mensaje ||
    errorPedido ||
    error ||
    errorSucursal;

  const mensajeExitoso =
    Boolean(
      mensajePedido || mensaje
    );

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
                Donde te pierdes con
                el buen sabor
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
              {sesion?.rol ??
                ""}
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
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <LayoutDashboard
                size={20}
              />
              Panel principal
            </Link>

            <Link
              href="/dashboard/mesas"
              className="flex w-full items-center gap-3 rounded-2xl bg-amber-500 px-4 py-3 font-bold text-slate-950"
            >
              <UtensilsCrossed
                size={20}
              />
              Mesas y atención
            </Link>

            <Link
              href="/dashboard/mesas/qr"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              <QrCode
                size={20}
              />
              QR de mesas
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
  <CircleDollarSign size={20} />
  Caja
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
                  <UserCog size={20} />
                  Usuarios
                </Link>

                <Link
                  href="/dashboard/configuracion"
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900"
                >
                  <Settings size={20} />
                  Configuración
                </Link>
              </>
            )}

            <div className="my-4 border-t border-slate-800" />

            <button
              type="button"
              onClick={cerrarSesion}
              disabled={cerrandoSesion}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
            >
              <LogOut size={20} />
              {cerrandoSesion
                ? "Cerrando..."
                : "Cerrar sesión"}
            </button>
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-4 md:p-7">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                    Restaurante
                    Chinka Chinka
                  </p>

                  <h2 className="mt-2 text-3xl font-black md:text-4xl">
                    Mapa visual del
                    restaurante
                  </h2>

                  <p className="mt-3 max-w-2xl text-slate-300">
                    Controla mesas,
                    atenciones, pedidos y
                    cuentas directamente
                    desde PostgreSQL.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
                    <p className="text-xs text-slate-300">
                      Sucursal activa
                    </p>

                    <p className="font-black">
                      {cargandoSucursal
                        ? "Cargando..."
                        : sucursal?.nombre ??
                          "No disponible"}
                    </p>
                  </div>

                  <Link
                    href="/dashboard/mesas/qr"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-slate-950 transition hover:bg-amber-400"
                  >
                    <QrCode
                      size={19}
                    />
                    QR de mesas
                  </Link>

                  <button
                    type="button"
                    onClick={recargar}
                    disabled={
                      cargando ||
                      cargandoSucursal
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-slate-100 disabled:opacity-50"
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

            {mensajeVisible && (
              <div
                className={`flex items-start justify-between gap-4 rounded-2xl border px-5 py-4 ${
                  mensajeExitoso
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {mensajeExitoso ? (
                    <CheckCircle2
                      size={21}
                      className="mt-0.5 shrink-0"
                    />
                  ) : (
                    <AlertCircle
                      size={21}
                      className="mt-0.5 shrink-0"
                    />
                  )}

                  <p className="font-bold">
                    {mensajeVisible}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    limpiarMensajes();
                    limpiarMensajesPedido();
                    setErrorSucursal("");
                  }}
                  className="rounded-lg p-1 transition hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <TarjetaResumen
                titulo="Mesas ocupadas"
                valor={String(
                  mesasOcupadas
                )}
                descripcion={`${mesasLibres} mesas libres`}
                icono={
                  <Users size={24} />
                }
              />

              <TarjetaResumen
                titulo="Atenciones abiertas"
                valor={String(
                  totalAtencionesAbiertas
                )}
                descripcion="Cuentas actualmente activas"
                icono={
                  <Store size={24} />
                }
              />

              <TarjetaResumen
                titulo="Pedidos pendientes"
                valor={String(
                  pedidosPendientes
                )}
                descripcion={`${mesasConCuentaSolicitada} solicitudes de cuenta`}
                icono={
                  <Bell size={24} />
                }
              />

              <TarjetaResumen
                titulo="Consumo acumulado"
                valor={`S/ ${ventaAcumulada.toFixed(
                  2
                )}`}
                descripcion="Total de atenciones abiertas"
                icono={
                  <CircleDollarSign
                    size={24}
                  />
                }
              />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    Mesas del restaurante
                  </h3>

                  <p className="mt-1 text-slate-500">
                    Presiona una mesa para
                    abrir su atención,
                    agregar productos o
                    consultar su cuenta.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={zonaFiltro}
                    onChange={(
                      evento
                    ) =>
                      setZonaFiltro(
                        evento.target
                          .value
                      )
                    }
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-amber-500"
                  >
                    <option value="">
                      Todas las zonas
                    </option>

                    {zonas.map(
                      (zona) => (
                        <option
                          key={zona.id}
                          value={zona.id}
                        >
                          {zona.nombre}
                        </option>
                      )
                    )}
                  </select>

                  <div className="flex flex-wrap gap-3 text-xs font-bold">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-slate-400" />
                      Libre
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-amber-500" />
                      Ocupada
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-orange-500" />
                      Pedido pendiente
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                      Solicitó cuenta
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      Pagada
                    </span>
                  </div>
                </div>
              </div>

              {cargando ||
              cargandoSucursal ? (
                <div className="flex min-h-80 items-center justify-center">
                  <div className="text-center">
                    <LoaderCircle
                      size={44}
                      className="mx-auto animate-spin text-amber-500"
                    />

                    <p className="mt-4 font-bold text-slate-600">
                      Cargando mesas
                      reales...
                    </p>
                  </div>
                </div>
              ) : mesasFiltradas.length ===
                0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                  <UtensilsCrossed
                    size={48}
                    className="mx-auto text-slate-400"
                  />

                  <h4 className="mt-4 text-xl font-black text-slate-900">
                    No existen mesas
                    en esta zona
                  </h4>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {mesasFiltradas.map(
                    (mesa) => {
                      const estilo =
                        estilosEstado[
                          mesa.estado
                        ];

                      const atencion =
                        mesa.atencionActual;

                      return (
                        <article
                          key={mesa.id}
                          className={`overflow-hidden rounded-3xl border-2 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${estilo.fondo} ${estilo.borde}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              limpiarMensajesPedido();
                              setMesaSeleccionada(
                                mesa
                              );
                            }}
                            className="w-full p-5 text-left"
                          >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                                {
                                  mesa.zona
                                    .nombre
                                }
                              </p>

                              <h4 className="mt-1 text-3xl font-black text-slate-950">
                                {
                                  mesa.nombre
                                }
                              </h4>
                            </div>

                            <span
                              className={`mt-1 h-4 w-4 rounded-full ${estilo.punto}`}
                            />
                          </div>

                          <div className="mt-4">
                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-slate-700">
                              {
                                estilo.texto
                              }
                            </span>
                          </div>

                          {mesa.estado ===
                          "LIBRE" ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-center">
                              <p className="font-bold text-slate-500">
                                Capacidad:{" "}
                                {
                                  mesa.capacidad
                                }{" "}
                                personas
                              </p>

                              <p className="mt-2 text-sm font-black text-amber-700">
                                Abrir atención
                              </p>
                            </div>
                          ) : (
                            <div className="mt-6 space-y-3 text-sm">
                              <div className="flex justify-between gap-3">
                                <span className="text-slate-500">
                                  Atención
                                </span>

                                <span className="max-w-[160px] truncate font-black text-slate-900">
                                  {atencion?.codigo ??
                                    "Sin atención"}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock3
                                    size={
                                      16
                                    }
                                  />
                                  Tiempo
                                </span>

                                <span className="font-black text-slate-900">
                                  {calcularTiempo(
                                    atencion?.fechaApertura,
                                    ahora
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-500">
                                  Personas
                                </span>

                                <span className="font-black text-slate-900">
                                  {atencion?.cantidadPersonas ??
                                    0}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-500">
                                  Pedidos
                                </span>

                                <span className="rounded-full bg-slate-950 px-2.5 py-1 font-black text-white">
                                  {atencion?.cantidadPedidos ??
                                    0}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3 border-t border-black/10 pt-3">
                                <span className="font-bold text-slate-600">
                                  Total
                                </span>

                                <span className="text-lg font-black text-slate-950">
                                  S/{" "}
                                  {Number(
                                    atencion?.total ??
                                      0
                                  ).toFixed(
                                    2
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                          </button>

                          <div className="grid grid-cols-2 gap-2 border-t border-black/10 bg-white/70 p-3">
                            <button
                              type="button"
                              onClick={() => {
                                limpiarMensajesPedido();
                                setMesaSeleccionada(
                                  mesa
                                );
                              }}
                              className="flex items-center justify-center rounded-xl bg-slate-950 px-3 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                            >
                              Gestionar
                            </button>

                            <Link
                              href="/dashboard/mesas/qr"
                              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
                            >
                              <QrCode
                                size={17}
                              />
                              Ver QR
                            </Link>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      {mesaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                  Control de mesa
                </p>

                <h2 className="mt-1 text-3xl font-black text-slate-950">
                  {
                    mesaSeleccionada.nombre
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    mesaSeleccionada
                      .zona.nombre
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  cerrarMesaSeleccionada
                }
                disabled={
                  procesando ||
                  enviandoPedido
                }
                className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </header>

            <div className="p-6">
              {mesaSeleccionada.estado ===
              "LIBRE" ? (
                <AbrirAtencionForm
                  mesa={
                    mesaSeleccionada
                  }
                  procesando={
                    procesando
                  }
                  onAbrir={
                    confirmarApertura
                  }
                />
              ) : (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-bold text-amber-700">
                      Atención abierta
                    </p>

                    <h3 className="mt-1 break-all text-2xl font-black text-slate-950">
                      {
                        mesaSeleccionada
                          .atencionActual
                          ?.codigo
                      }
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-500">
                        Estado
                      </p>

                      <p className="mt-1 font-black text-slate-950">
                        {
                          estilosEstado[
                            mesaSeleccionada
                              .estado
                          ].texto
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-500">
                        Personas
                      </p>

                      <p className="mt-1 font-black text-slate-950">
                        {mesaSeleccionada
                          .atencionActual
                          ?.cantidadPersonas ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-500">
                        Método previsto
                      </p>

                      <p className="mt-1 font-black text-slate-950">
                        {formatearMetodoPago(
                          mesaSeleccionada
                            .atencionActual
                            ?.metodoPagoPrevisto
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-500">
                        Pedidos enviados
                      </p>

                      <p className="mt-1 text-xl font-black text-slate-950">
                        {mesaSeleccionada
                          .atencionActual
                          ?.cantidadPedidos ??
                          0}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-500">
                          Total actual
                        </p>

                        <p className="mt-1 text-3xl font-black text-slate-950">
                          S/{" "}
                          {Number(
                            mesaSeleccionada
                              .atencionActual
                              ?.total ?? 0
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <CircleDollarSign
                          size={26}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        limpiarMensajesPedido();
                        setMostrarAgregarPedido(
                          true
                        );
                      }}
                      disabled={
                        !mesaSeleccionada
                          .atencionActual
                      }
                      className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingBasket
                        size={20}
                      />
                      Agregar productos
                    </button>

                    <Link
                     href={`/dashboard/ticket/${encodeURIComponent(
  mesaSeleccionada.atencionActual?.id ?? ""
)}`}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800"
                    >
                      <ReceiptText
                        size={20}
                      />
                      Ver ticket
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarAgregarPedido &&
        mesaSeleccionada
          ?.atencionActual && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-sm md:p-6">
            <div className="mx-auto min-h-full w-full max-w-[1500px] overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
              <header className="sticky top-0 z-30 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 md:px-7">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                    Nuevo pedido
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">
                    {
                      mesaSeleccionada.nombre
                    }
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Atención:{" "}
                    {
                      mesaSeleccionada
                        .atencionActual
                        .codigo
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !enviandoPedido
                    ) {
                      setMostrarAgregarPedido(
                        false
                      );
                    }
                  }}
                  disabled={
                    enviandoPedido
                  }
                  className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  <X size={22} />
                </button>
              </header>

              <div className="p-4 md:p-7">
                {errorPedido && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
                    {errorPedido}
                  </div>
                )}

                <AgregarPedidoForm
                  enviando={
                    enviandoPedido
                  }
                  onEnviar={
                    enviarPedidoReal
                  }
                />
              </div>
            </div>
          </div>
        )}
    </main>
  );
}