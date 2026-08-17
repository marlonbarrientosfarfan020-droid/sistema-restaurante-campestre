"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Users,
  Power,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Mesa = {
  id: string;
  numero: number;
  nombre: string;
  capacidad: number;
  qrCode: string;
  estado: string;
  activa: boolean;
  zona: {
    id: string;
    nombre: string;
  };
};

type Zona = {
  id: string;
  nombre: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: {
    mesas: Mesa[];
    zonas: Zona[];
  };
};

const estadoTexto: Record<
  string,
  string
> = {
  LIBRE: "Libre",
  OCUPADA: "Ocupada",
  RESERVADA: "Reservada",
  CUENTA_SOLICITADA:
    "Cuenta solicitada",
};

function claseEstado(
  estado: string
) {
  switch (estado) {
    case "LIBRE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "OCUPADA":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "RESERVADA":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "CUENTA_SOLICITADA":
      return "bg-purple-50 text-purple-700 border-purple-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export default function AdministrarMesasPage() {
  const [mesas, setMesas] =
    useState<Mesa[]>([]);

  const [zonas, setZonas] =
    useState<Zona[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [zonaFiltro, setZonaFiltro] =
    useState("TODAS");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [editando, setEditando] =
    useState<Mesa | null>(null);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [form, setForm] = useState({
    numero: "",
    nombre: "",
    capacidad: "4",
    zonaId: "",
  });

  async function cargarMesas() {
    try {
      setCargando(true);
      setError("");

      const respuesta =
        await fetch(
          "/api/mesas/administracion",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse;

      if (!respuesta.ok || !resultado.success) {
        throw new Error(
          resultado.message ||
            "No se pudieron cargar las mesas."
        );
      }

      setMesas(
        resultado.data?.mesas ?? []
      );

      setZonas(
        resultado.data?.zonas ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las mesas."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarMesas();
  }, []);

  const mesasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return mesas.filter(
        (mesa) => {
          const coincideTexto =
            !texto ||
            mesa.nombre
              .toLowerCase()
              .includes(texto) ||
            String(
              mesa.numero
            ).includes(texto);

          const coincideZona =
            zonaFiltro === "TODAS" ||
            mesa.zona.id ===
              zonaFiltro;

          return (
            coincideTexto &&
            coincideZona
          );
        }
      );
    },
    [
      mesas,
      busqueda,
      zonaFiltro,
    ]);

  const totalMesas =
    mesas.length;

  const mesasActivas =
    mesas.filter(
      (mesa) => mesa.activa
    ).length;

  const mesasLibres =
    mesas.filter(
      (mesa) =>
        mesa.activa &&
        mesa.estado === "LIBRE"
    ).length;

  const mesasOcupadas =
    mesas.filter(
      (mesa) =>
        mesa.activa &&
        mesa.estado !== "LIBRE"
    ).length;

  function abrirCrear() {
    setEditando(null);

    setForm({
      numero: "",
      nombre: "",
      capacidad: "4",
      zonaId:
        zonas[0]?.id ?? "",
    });

    setModalAbierto(true);
    setMensaje("");
  }

  function abrirEditar(
    mesa: Mesa
  ) {
    setEditando(mesa);

    setForm({
      numero: String(
        mesa.numero
      ),
      nombre: mesa.nombre,
      capacidad: String(
        mesa.capacidad
      ),
      zonaId: mesa.zona.id,
    });

    setModalAbierto(true);
    setMensaje("");
  }

  function cerrarModal() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setEditando(null);
  }

  async function guardarMesa(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!form.zonaId) {
      setMensaje(
        "Selecciona una zona."
      );
      return;
    }

    const numero =
      Number(form.numero);

    const capacidad =
      Number(form.capacidad);

    if (
      !Number.isInteger(numero) ||
      numero <= 0
    ) {
      setMensaje(
        "Ingresa un número de mesa válido."
      );
      return;
    }

    if (
      !Number.isInteger(capacidad) ||
      capacidad <= 0
    ) {
      setMensaje(
        "Ingresa una capacidad válida."
      );
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const url =
        editando
          ? `/api/mesas/administracion/${editando.id}`
          : "/api/mesas/administracion";

      const respuesta =
        await fetch(url, {
          method: editando
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            numero,
            nombre:
              form.nombre.trim(),
            capacidad,
            zonaId:
              form.zonaId,
          }),
        });

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo guardar la mesa."
        );
      }

      setModalAbierto(false);
      setEditando(null);

      await cargarMesas();

      setMensaje(
        editando
          ? "Mesa actualizada correctamente."
          : "Mesa creada correctamente."
      );
    } catch (err) {
      setMensaje(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la mesa."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(
    mesa: Mesa
  ) {
    const accion =
      mesa.activa
        ? "desactivar"
        : "activar";

    const confirmado =
      window.confirm(
        mesa.activa
          ? `¿Deseas desactivar ${mesa.nombre}?`
          : `¿Deseas activar ${mesa.nombre}?`
      );

    if (!confirmado) {
      return;
    }

    try {
      const respuesta =
        await fetch(
          `/api/mesas/administracion/${mesa.id}`,
          {
            method: "DELETE",
          }
        );

      const resultado =
        await respuesta.json();

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            `No se pudo ${accion} la mesa.`
        );
      }

      await cargarMesas();

      setMensaje(
        resultado.message
      );
    } catch (err) {
      setMensaje(
        err instanceof Error
          ? err.message
          : `No se pudo ${accion} la mesa.`
      );
    }
  }

  function mostrarQR(
    mesa: Mesa
  ) {
    const url =
      `${window.location.origin}/mesas/${mesa.qrCode}`;

    window.prompt(
      `QR de ${mesa.nombre}. Copia este enlace:`,
      url
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* ENCABEZADO */}
        <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">
                <Link
                  href="/dashboard/mesas"
                  className="rounded-2xl bg-white/10 p-3 transition hover:bg-white/20"
                >
                  <ArrowLeft
                    size={22}
                  />
                </Link>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                    Administración
                  </p>

                  <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                    Mesas del restaurante
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Crea, modifica y organiza
                    las mesas de tu restaurante.
                    La capacidad puede variar según
                    cada mesa.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={abrirCrear}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-slate-950 shadow-lg transition hover:bg-amber-400"
              >
                <Plus size={20} />
                Nueva mesa
              </button>
            </div>
          </div>
        </section>

        {/* ESTADÍSTICAS */}
        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total mesas
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {totalMesas}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Activas
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {mesasActivas}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Libres
            </p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {mesasLibres}
            </p>
          </div>

          <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              Ocupadas
            </p>
            <p className="mt-2 text-3xl font-black text-orange-700">
              {mesasOcupadas}
            </p>
          </div>

        </section>

        {/* FILTROS */}
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">

            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value
                  )
                }
                placeholder="Buscar mesa..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-amber-400 focus:bg-white"
              />
            </div>

            <select
              value={zonaFiltro}
              onChange={(event) =>
                setZonaFiltro(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400"
            >
              <option value="TODAS">
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

            <button
              type="button"
              onClick={cargarMesas}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              <RefreshCw
                size={18}
              />
              Actualizar
            </button>

          </div>
        </section>

        {/* MENSAJE */}
        {mensaje && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            {mensaje}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* CARGANDO */}
        {cargando ? (
          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw
              className="mx-auto animate-spin text-amber-500"
              size={32}
            />

            <p className="mt-3 font-bold text-slate-600">
              Cargando mesas...
            </p>
          </section>
        ) : mesasFiltradas.length === 0 ? (
          <section className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <UtensilsCrossed
              className="mx-auto text-slate-300"
              size={42}
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No encontramos mesas
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Prueba otro filtro o crea una nueva mesa.
            </p>
          </section>
        ) : (
          /* MESAS */
          <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {mesasFiltradas.map(
              (mesa) => (
                <article
                  key={mesa.id}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    mesa.activa
                      ? "border-slate-200"
                      : "border-red-200 opacity-70"
                  }`}
                >

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black text-white">
                          {String(
                            mesa.numero
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div>
                          <h2 className="font-black text-slate-950">
                            {mesa.nombre}
                          </h2>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {mesa.zona.nombre}
                          </p>
                        </div>

                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${
                          mesa.activa
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {mesa.activa
                          ? "ACTIVA"
                          : "INACTIVA"}
                      </span>

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users
                            size={17}
                          />

                          <span className="text-xs font-bold">
                            Capacidad
                          </span>
                        </div>

                        <p className="mt-1 text-lg font-black text-slate-950">
                          {mesa.capacidad}
                          {" "}
                          personas
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-500">
                          Estado
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${claseEstado(
                            mesa.estado
                          )}`}
                        >
                          {estadoTexto[
                            mesa.estado
                          ] ??
                            mesa.estado}
                        </span>
                      </div>

                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Código QR
                      </p>

                      <p className="mt-1 truncate text-xs font-bold text-slate-600">
                        {mesa.qrCode}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          abrirEditar(
                            mesa
                          )
                        }
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                      >
                        <Edit3
                          size={15}
                        />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          mostrarQR(
                            mesa
                          )
                        }
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                      >
                        <QrCode
                          size={15}
                        />
                        QR
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarEstado(
                            mesa
                          )
                        }
                        className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-black transition ${
                          mesa.activa
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        <Power
                          size={15}
                        />
                        {mesa.activa
                          ? "Off"
                          : "On"}
                      </button>

                    </div>

                  </div>

                </article>
              )
            )}

          </section>
        )}

      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5">

          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-500">
                  {editando
                    ? "Editar mesa"
                    : "Nueva mesa"}
                </p>

                <h2 className="text-xl font-black text-slate-950">
                  {editando
                    ? editando.nombre
                    : "Crear mesa"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  cerrarModal
                }
                className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                guardarMesa
              }
              className="space-y-5 p-5"
            >

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Número de mesa
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.numero
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          actual
                        ) => ({
                          ...actual,
                          numero:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Ej. 15"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Capacidad
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.capacidad
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          actual
                        ) => ({
                          ...actual,
                          capacidad:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Ej. 6"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-amber-400 focus:bg-white"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Puede ser 2, 4, 5, 6, 8, 10...
                  </p>
                </div>

              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  Nombre de la mesa
                </label>

                <input
                  value={
                    form.nombre
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        actual
                      ) => ({
                        ...actual,
                        nombre:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Ej. Mesa 15"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-amber-400 focus:bg-white"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Si lo dejas vacío se generará automáticamente.
                </p>
              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  Zona
                </label>

                <select
                  value={
                    form.zonaId
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        actual
                      ) => ({
                        ...actual,
                        zonaId:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-amber-400 focus:bg-white"
                >
                  <option value="">
                    Selecciona una zona
                  </option>

                  {zonas.map(
                    (zona) => (
                      <option
                        key={
                          zona.id
                        }
                        value={
                          zona.id
                        }
                      >
                        {zona.nombre}
                      </option>
                    )
                  )}
                </select>
              </div>

              {mensaje && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {mensaje}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    cerrarModal
                  }
                  disabled={
                    guardando
                  }
                  className="rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 font-black text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={18}
                      />
                      {editando
                        ? "Guardar cambios"
                        : "Crear mesa"}
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </main>
  );
}