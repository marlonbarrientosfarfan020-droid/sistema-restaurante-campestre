"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Check,
  ChefHat,
  ChevronRight,
  CircleDollarSign,
  Copy,
  ExternalLink,
  FolderTree,
  Globe,
  Home,
  LogOut,
  Menu,
  PackageCheck,
  ReceiptText,
  ShoppingBasket,
  Users,
  UtensilsCrossed,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

type SesionActual = {
  sub: string;
  sucursalId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  exp: number;
};

type Props = {
  sesion: SesionActual;
  children: React.ReactNode;
};

type Opcion = {
  href: string;
  texto: string;
  descripcion: string;
  icono: React.ReactNode;
};

const opcionesPrincipales: Opcion[] = [
  {
    href: "/dashboard/mozo",
    texto: "Inicio Mozo",
    descripcion: "Resumen del servicio",
    icono: <Home size={20} />,
  },
  {
    href: "/dashboard/mozo#mesas",
    texto: "Mesas y atención",
    descripcion: "Abrir, atender y pedir",
    icono: <UtensilsCrossed size={20} />,
  },
  {
    href: "/dashboard/pedidos",
    texto: "Pedidos",
    descripcion: "Seguimiento general",
    icono: <ReceiptText size={20} />,
  },
  {
    href: "/dashboard/entregas",
    texto: "Entregas",
    descripcion: "Pedidos listos",
    icono: <PackageCheck size={20} />,
  },
];

const opcionesOperativas: Opcion[] = [
  {
    href: "/dashboard/cocina",
    texto: "Cocina",
    descripcion: "Estado de preparación",
    icono: <ChefHat size={20} />,
  },
  {
    href: "/dashboard/caja",
    texto: "Caja",
    descripcion: "Cuentas y pagos",
    icono: <CircleDollarSign size={20} />,
  },
  {
    href: "/dashboard/productos",
    texto: "Productos",
    descripcion: "Consultar carta",
    icono: <ShoppingBasket size={20} />,
  },
  {
    href: "/dashboard/categorias",
    texto: "Categorías",
    descripcion: "Organizar carta",
    icono: <FolderTree size={20} />,
  },
  {
    href: "/dashboard/comprobantes",
    texto: "Comprobantes",
    descripcion: "Boletas y facturas",
    icono: <WalletCards size={20} />,
  },
];

function rutaBase(href: string) {
  return href.split("#")[0];
}

function estaActiva(pathname: string, href: string) {
  const ruta = rutaBase(href);

  if (ruta === "/dashboard/mozo") {
    return pathname === "/dashboard/mozo";
  }

  return pathname.startsWith(ruta);
}

export default function MozoAppNavigation({
  sesion,
  children,
}: Props) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function copiarLinkCarta(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const url = `${window.location.origin}/carta`;
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("¡Enlace de la carta copiado para compartir!", {
        description: url,
      });
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  async function cerrarSesion() {
    try {
      setCerrando(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  const todas = [...opcionesPrincipales, ...opcionesOperativas];

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white lg:flex">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950">
              <UtensilsCrossed size={25} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                Chinka Chinka
              </p>
              <h2 className="text-lg font-black">Modo Mozo</h2>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase text-slate-500">
              Sesión actual
            </p>
            <p className="mt-2 truncate font-black">
              {sesion.nombres} {sesion.apellidos}
            </p>
            <p className="mt-1 text-xs font-black text-amber-400">MOZO</p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {sesion.correo}
            </p>
          </div>

          {/* Acceso y Compartición de la Carta Pública */}
          <div className="mt-3 flex items-center gap-1.5">
            <Link
              href="/carta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-between gap-2 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-slate-900 px-3.5 py-2.5 text-xs font-black text-amber-300 transition hover:bg-amber-500/20 hover:border-amber-400 active:scale-95 shadow-sm"
              title="Abrir carta digital pública en nueva pestaña"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={16} className="text-amber-400 shrink-0" />
                <span className="truncate">Ver Carta Pública</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-300 tracking-wider">
                  Web
                </span>
                <ExternalLink size={13} className="text-amber-400/80" />
              </div>
            </Link>

            <button
              type="button"
              onClick={copiarLinkCarta}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400 transition active:scale-90 shadow-sm shrink-0"
              title="Copiar enlace directo de la carta para compartir"
              aria-label="Copiar link de la carta"
            >
              {copiado ? (
                <Check size={16} className="text-emerald-400" />
              ) : (
                <Copy size={16} className="text-amber-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
            Atención
          </p>
          <nav className="space-y-1.5">
            {opcionesPrincipales.map((opcion) => {
              const activa = estaActiva(pathname, opcion.href);
              return (
                <Link
                  key={opcion.href}
                  href={opcion.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                    activa
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activa ? "bg-white/40" : "bg-slate-900"}`}>
                    {opcion.icono}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{opcion.texto}</p>
                    <p className={`truncate text-[11px] ${activa ? "text-slate-800/70" : "text-slate-500"}`}>
                      {opcion.descripcion}
                    </p>
                  </div>
                  <ChevronRight size={16} />
                </Link>
              );
            })}
          </nav>

          <div className="my-5 border-t border-slate-800" />
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
            Operación
          </p>
          <nav className="space-y-1.5">
            {opcionesOperativas.map((opcion) => {
              const activa = estaActiva(pathname, opcion.href);
              return (
                <Link
                  key={opcion.href}
                  href={opcion.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                    activa
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${activa ? "bg-slate-100" : "bg-slate-900"}`}>
                    {opcion.icono}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{opcion.texto}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {opcion.descripcion}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={cerrarSesion}
            disabled={cerrando}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/10 px-4 py-3 font-black text-red-300"
          >
            <LogOut size={18} />
            {cerrando ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
          <Link href="/dashboard/mozo" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-amber-400">
              <UtensilsCrossed size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">Chinka Chinka</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-amber-600">
                {sesion.nombres} · MOZO
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="rounded-xl bg-slate-100 p-2.5 text-slate-700"
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="pb-24 lg:pb-0">{children}</div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.09)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          <Link href="/dashboard/mozo" className={`flex flex-col items-center rounded-2xl px-2 py-2 text-[10px] font-black ${pathname === "/dashboard/mozo" ? "bg-slate-950 text-white" : "text-slate-600"}`}>
            <Home size={20} />Inicio
          </Link>
          <Link href="/dashboard/mozo#mesas" className="flex flex-col items-center rounded-2xl px-2 py-2 text-[10px] font-black text-slate-600">
            <Users size={20} />Mesas
          </Link>
          <Link href="/dashboard/pedidos" className={`flex flex-col items-center rounded-2xl px-2 py-2 text-[10px] font-black ${pathname.startsWith("/dashboard/pedidos") ? "bg-slate-950 text-white" : "text-slate-600"}`}>
            <ReceiptText size={20} />Pedidos
          </Link>
          <button type="button" onClick={() => setAbierto(true)} className="flex flex-col items-center rounded-2xl px-2 py-2 text-[10px] font-black text-slate-600">
            <Menu size={20} />Más
          </button>
        </div>
      </nav>

      {abierto && (
        <div className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm lg:hidden">
          <button type="button" aria-label="Cerrar" onClick={() => setAbierto(false)} className="absolute inset-0" />
          <aside className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[32px] bg-white p-4 shadow-2xl">
            <div className="mx-auto max-w-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Menú del mozo</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">¿A dónde quieres ir?</h2>
                </div>
                <button type="button" onClick={() => setAbierto(false)} className="rounded-xl bg-slate-100 p-2.5">
                  <X size={20} />
                </button>
              </div>

              {/* Acceso a Carta Pública en Drawer Móvil de Mozo */}
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/carta"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setAbierto(false)}
                  className="flex-1 flex items-center justify-between gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs font-black text-amber-800 transition active:scale-95"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={18} className="text-amber-600" />
                    <span>Ver Carta Pública</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-800 tracking-wider">
                      Web
                    </span>
                    <ExternalLink size={15} className="text-amber-600" />
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={copiarLinkCarta}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 transition active:scale-95 shrink-0"
                  title="Copiar link de la carta"
                >
                  {copiado ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {todas.map((opcion) => (
                  <Link key={opcion.href} href={opcion.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 active:scale-[0.98]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm">
                      {opcion.icono}
                    </div>
                    <p className="mt-3 font-black text-slate-950">{opcion.texto}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{opcion.descripcion}</p>
                  </Link>
                ))}
              </div>

              <button type="button" onClick={cerrarSesion} disabled={cerrando} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-4 font-black text-red-700">
                <LogOut size={19} />
                {cerrando ? "Cerrando..." : "Cerrar sesión"}
              </button>

              <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">
                El rol MOZO no tiene acceso a Configuración ni Usuarios/Roles.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
