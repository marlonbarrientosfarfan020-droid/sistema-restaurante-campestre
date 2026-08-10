"use client";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  FolderTree,
  LoaderCircle,
  Tags,
  X,
} from "lucide-react";

import CategoriaForm from "@/components/categorias/CategoriaForm";
import CategoriaModal from "@/components/categorias/CategoriaModal";
import CategoriaTable from "@/components/categorias/CategoriaTable";
import CategoriaToolbar from "@/components/categorias/CategoriaToolbar";

import { useCategorias } from "@/hooks/useCategorias";

import type {
  ActualizarCategoriaDTO,
  Categoria,
} from "@/types/categoria";

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

export default function CategoriasPage() {
  const {
    categorias,
    cargando,
    guardando,
    mensaje,
    error,
    recargar,
    crearCategoria,
    actualizarCategoria,
    desactivarCategoria,
    limpiarMensajes,
  } = useCategorias();

  const [sucursal, setSucursal] =
    useState<SucursalPrincipal | null>(null);

  const [cargandoSucursal, setCargandoSucursal] =
    useState(true);

  const [errorSucursal, setErrorSucursal] =
    useState("");

  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] = useState<Categoria | null>(null);

  const [
    categoriaParaDesactivar,
    setCategoriaParaDesactivar,
  ] = useState<Categoria | null>(null);

  useEffect(() => {
    async function cargarSucursalPrincipal() {
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
        const texto =
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar la sucursal.";

        setErrorSucursal(texto);
      } finally {
        setCargandoSucursal(false);
      }
    }

    cargarSucursalPrincipal();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLocaleLowerCase("es-PE");

    if (!termino) {
      return categorias;
    }

    return categorias.filter((categoria) => {
      return (
        categoria.codigo
          .toLocaleLowerCase("es-PE")
          .includes(termino) ||
        categoria.nombre
          .toLocaleLowerCase("es-PE")
          .includes(termino) ||
        (categoria.descripcion ?? "")
          .toLocaleLowerCase("es-PE")
          .includes(termino)
      );
    });
  }, [busqueda, categorias]);

  const totalActivas = categorias.filter(
    (categoria) => categoria.activa
  ).length;

  function abrirNuevaCategoria() {
    limpiarMensajes();
    setCategoriaSeleccionada(null);
    setModalAbierto(true);
  }

  function abrirEdicion(categoria: Categoria) {
    limpiarMensajes();
    setCategoriaSeleccionada(categoria);
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setCategoriaSeleccionada(null);
  }

  async function guardarCategoria(datos: {
    nombre: string;
    descripcion: string;
    activa: boolean;
  }) {
    if (!sucursal) {
      return false;
    }

    if (categoriaSeleccionada) {
      const datosActualizacion: ActualizarCategoriaDTO =
        {
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          activa: datos.activa,
        };

      const resultado =
        await actualizarCategoria(
          categoriaSeleccionada.id,
          datosActualizacion
        );

      if (!resultado) {
        return false;
      }

      cerrarModal();
      return true;
    }

    const resultado = await crearCategoria({
      sucursalId: sucursal.id,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
    });

    if (!resultado) {
      return false;
    }

    cerrarModal();
    return true;
  }

  async function confirmarDesactivacion() {
    if (!categoriaParaDesactivar) {
      return;
    }

    const exito = await desactivarCategoria(
      categoriaParaDesactivar.id
    );

    if (exito) {
      setCategoriaParaDesactivar(null);
    }
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
                <FolderTree size={38} />
                Categorías del menú
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Organiza los platos, bebidas, postres y
                promociones que aparecerán en el menú digital.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-sm text-slate-300">
                Sucursal activa
              </p>

              <p className="mt-1 font-black">
                {cargandoSucursal
                  ? "Cargando..."
                  : sucursal?.nombre ??
                    "No disponible"}
              </p>
            </div>
          </div>
        </header>

        {(mensaje || error || errorSucursal) && (
          <section
            className={`flex items-start justify-between gap-4 rounded-2xl border px-5 py-4 ${
              mensaje
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {mensaje ? (
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
                {mensaje || error || errorSucursal}
              </p>
            </div>

            <button
              type="button"
              onClick={limpiarMensajes}
              className="rounded-lg p-1 transition hover:bg-black/5"
            >
              <X size={18} />
            </button>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Total de categorías
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {categorias.length}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <Tags size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Categorías activas
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-600">
              {totalActivas}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <p className="text-sm font-bold text-slate-500">
              Resultados mostrados
            </p>

            <p className="mt-2 text-3xl font-black text-amber-600">
              {categoriasFiltradas.length}
            </p>
          </div>
        </section>

        <CategoriaToolbar
          busqueda={busqueda}
          cargando={cargando}
          onCambiarBusqueda={setBusqueda}
          onNuevaCategoria={abrirNuevaCategoria}
          onRecargar={recargar}
        />

        {cargando || cargandoSucursal ? (
          <div className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoaderCircle
                size={42}
                className="mx-auto animate-spin text-amber-500"
              />

              <p className="mt-4 font-bold text-slate-600">
                Cargando categorías...
              </p>
            </div>
          </div>
        ) : (
          <CategoriaTable
            categorias={categoriasFiltradas}
            guardando={guardando}
            onEditar={abrirEdicion}
            onDesactivar={
              setCategoriaParaDesactivar
            }
          />
        )}
      </div>

      <CategoriaModal
        abierto={modalAbierto}
        titulo={
          categoriaSeleccionada
            ? "Editar categoría"
            : "Nueva categoría"
        }
        descripcion={
          categoriaSeleccionada
            ? "Actualiza los datos de la categoría seleccionada."
            : "Registra una categoría para organizar el menú."
        }
        onCerrar={cerrarModal}
      >
        <CategoriaForm
          categoria={categoriaSeleccionada}
          guardando={guardando}
          onGuardar={guardarCategoria}
        />
      </CategoriaModal>

      <CategoriaModal
        abierto={Boolean(categoriaParaDesactivar)}
        titulo="Desactivar categoría"
        descripcion="La categoría dejará de aparecer en el menú, pero conservará su historial."
        onCerrar={() =>
          !guardando &&
          setCategoriaParaDesactivar(null)
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-bold text-red-800">
              ¿Deseas desactivar la categoría{" "}
              <strong>
                {categoriaParaDesactivar?.nombre}
              </strong>
              ?
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setCategoriaParaDesactivar(null)
              }
              disabled={guardando}
              className="rounded-2xl border border-slate-300 px-5 py-3.5 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmarDesactivacion}
              disabled={guardando}
              className="flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3.5 font-black text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {guardando
                ? "Desactivando..."
                : "Sí, desactivar"}
            </button>
          </div>
        </div>
      </CategoriaModal>
    </main>
  );
}

