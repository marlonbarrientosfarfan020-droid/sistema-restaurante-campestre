import Link from "next/link";

import {
  ArrowLeft,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";

export default function ConfiguracionPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <Settings size={38} />
                Configuración
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Administra los accesos y configuraciones internas del sistema.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-slate-100"
            >
              <ArrowLeft size={19} />
              Volver al panel
            </Link>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/dashboard/configuracion/usuarios"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <UserCog size={28} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Usuarios y roles
            </h2>

            <p className="mt-2 text-slate-500">
              Crea usuarios, asigna roles, activa o desactiva accesos y administra al personal.
            </p>

            <div className="mt-5 font-black text-amber-700 transition group-hover:translate-x-1">
              Administrar usuarios →
            </div>
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck size={28} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Seguridad
            </h2>

            <p className="mt-2 text-slate-500">
              Las configuraciones administrativas están protegidas por rol.
            </p>

            <span className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
              Solo Administrador
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}