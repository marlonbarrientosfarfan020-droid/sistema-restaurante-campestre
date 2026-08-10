"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  CircleDollarSign,
  LoaderCircle,
  PackageCheck,
  PackageX,
  Sparkles,
  ShoppingBasket,
  X,
} from "lucide-react";

import ProductoCard from "@/components/productos/ProductoCard";
import ProductoForm from "@/components/productos/ProductoForm";
import ProductoModal from "@/components/productos/ProductoModal";
import ProductoToolbar from "@/components/productos/ProductoToolbar";

import { useProductos } from "@/hooks/useProductos";

import type { Categoria } from "@/types/categoria";
import type {
  ActualizarProductoDTO,
  Producto,
} from "@/types/producto";

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

type DatosProductoForm = {
  categoriaId: string;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  costo: number;
  tiempoPreparacion: number;
  imagenUrl: string;
  controlaStock: boolean;
  stockActual: number;
  stockMinimo: number;
  disponible: boolean;
  activo: boolean;
};

export default function ProductosPage() {
  const {
    productos,
    cargando,
    guardando,
    mensaje,
    error,
    recargar,
    crearProducto,
    actualizarProducto,
    cambiarDisponibilidad,
    desactivarProducto,
    limpiarMensajes,
  } = useProductos();

  const [sucursal, setSucursal] =
    useState<SucursalPrincipal | null>(null);

  const [categorias, setCategorias] =
    useState<Categoria[]>([]);

  const [cargandoDatos, setCargandoDatos] =
    useState(true);

  const [errorDatos, setErrorDatos] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [categoriaFiltro, setCategoriaFiltro] =
    useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [
    productoSeleccionado,
    setProductoSeleccionado,
  ] = useState<Producto | null>(null);

  const [
    productoParaDesactivar,
    setProductoParaDesactivar,
  ] = useState<Producto | null>(null);

  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        setCargandoDatos(true);
        setErrorDatos("");

        const [
          respuestaSucursal,
          respuestaCategorias,
        ] = await Promise.all([
          fetch("/api/sucursales/principal", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/categorias", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const resultadoSucursal =
          (await respuestaSucursal.json()) as ApiResponse<SucursalPrincipal>;

        const resultadoCategorias =
          (await respuestaCategorias.json()) as ApiResponse<Categoria[]>;

        if (
          !respuestaSucursal.ok ||
          !resultadoSucursal.success ||
          !resultadoSucursal.data
        ) {
          throw new Error(
            resultadoSucursal.message ||
              "No se pudo obtener la sucursal principal."
          );
        }

        if (
          !respuestaCategorias.ok ||
          !resultadoCategorias.success
        ) {
          throw new Error(
            resultadoCategorias.message ||
              "No se pudieron obtener las categorías."
          );
        }

        setSucursal(resultadoSucursal.data);
        setCategorias(
          resultadoCategorias.data ?? []
        );
      } catch (errorDesconocido) {
        const texto =
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudieron cargar los datos iniciales.";

        setErrorDatos(texto);
      } finally {
        setCargandoDatos(false);
      }
    }

    cargarDatosIniciales();
  }, []);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLocaleLowerCase("es-PE");

    return productos.filter((producto) => {
      const coincideCategoria =
        !categoriaFiltro ||
        producto.categoriaId === categoriaFiltro;

      const coincideBusqueda =
        !termino ||
        producto.codigo
          .toLocaleLowerCase("es-PE")
          .includes(termino) ||
        producto.nombre
          .toLocaleLowerCase("es-PE")
          .includes(termino) ||
        producto.categoria.nombre
          .toLocaleLowerCase("es-PE")
          .includes(termino) ||
        (producto.descripcion ?? "")
          .toLocaleLowerCase("es-PE")
          .includes(termino);

      return (
        coincideCategoria &&
        coincideBusqueda
      );
    });
  }, [
    busqueda,
    categoriaFiltro,
    productos,
  ]);

  const productosActivos = productos.filter(
    (producto) => producto.activo
  );

  const productosDisponibles =
    productosActivos.filter(
      (producto) => producto.disponible
    );

  const productosAgotados =
    productosActivos.filter(
      (producto) => !producto.disponible
    );

  const categoriasConProductos = useMemo(() => {
    const mapa = new Map<
      string,
      {
        id: string;
        nombre: string;
        cantidad: number;
      }
    >();

    productosActivos.forEach((producto) => {
      const actual = mapa.get(
        producto.categoriaId
      );

      if (actual) {
        actual.cantidad += 1;
        return;
      }

      mapa.set(
        producto.categoriaId,
        {
          id: producto.categoriaId,
          nombre: producto.categoria.nombre,
          cantidad: 1,
        }
      );
    });

    return Array.from(
      mapa.values()
    ).sort((a, b) =>
      a.nombre.localeCompare(
        b.nombre,
        "es-PE"
      )
    );
  }, [productosActivos]);

  const precioPromedio =
    productosActivos.length > 0
      ? productosActivos.reduce(
          (total, producto) =>
            total +
            Number(
              producto.precioVenta
            ),
          0
        ) /
        productosActivos.length
      : 0;

  function abrirNuevoProducto() {
    limpiarMensajes();
    setProductoSeleccionado(null);
    setModalAbierto(true);
  }

  function abrirEdicion(producto: Producto) {
    limpiarMensajes();
    setProductoSeleccionado(producto);
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setProductoSeleccionado(null);
  }

  async function guardarProducto(
    datos: DatosProductoForm
  ) {
    if (!sucursal) {
      return false;
    }

    if (productoSeleccionado) {
      const datosActualizacion: ActualizarProductoDTO =
        {
          categoriaId: datos.categoriaId,
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          precioVenta: datos.precioVenta,
          costo: datos.costo,
          tiempoPreparacion:
            datos.tiempoPreparacion,
          imagenUrl: datos.imagenUrl,
          controlaStock:
            datos.controlaStock,
          stockActual:
            datos.stockActual,
          stockMinimo:
            datos.stockMinimo,
          disponible: datos.disponible,
          activo: datos.activo,
        };

      const resultado =
        await actualizarProducto(
          productoSeleccionado.id,
          datosActualizacion
        );

      if (!resultado) {
        return false;
      }

      cerrarModal();
      return true;
    }

    const resultado = await crearProducto({
      sucursalId: sucursal.id,
      categoriaId: datos.categoriaId,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precioVenta: datos.precioVenta,
      costo: datos.costo,
      tiempoPreparacion:
        datos.tiempoPreparacion,
      imagenUrl: datos.imagenUrl,
      controlaStock:
        datos.controlaStock,
      stockActual:
        datos.stockActual,
      stockMinimo:
        datos.stockMinimo,
      disponible: datos.disponible,
    });

    if (!resultado) {
      return false;
    }

    cerrarModal();
    return true;
  }

  async function alternarDisponibilidad(
    producto: Producto
  ) {
    await cambiarDisponibilidad(
      producto.id,
      !producto.disponible
    );
  }

  async function confirmarDesactivacion() {
    if (!productoParaDesactivar) {
      return;
    }

    const exito = await desactivarProducto(
      productoParaDesactivar.id
    );

    if (exito) {
      setProductoParaDesactivar(null);
    }
  }

  const mensajeVisible =
    mensaje || error || errorDatos;

  const esMensajeExito = Boolean(mensaje);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <ShoppingBasket size={38} />
                Catálogo de platos y bebidas
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Registra y administra todo lo que vende el restaurante:
                platos, gaseosas, bebidas, postres y demás productos que
                aparecerán para el mozo y en la carta digital.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-sm text-slate-300">
                Sucursal activa
              </p>

              <p className="mt-1 font-black">
                {cargandoDatos
                  ? "Cargando..."
                  : sucursal?.nombre ??
                    "No disponible"}
              </p>
            </div>
          </div>
        </header>

        {mensajeVisible && (
          <section
            className={`flex items-start justify-between gap-4 rounded-2xl border px-5 py-4 ${
              esMensajeExito
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {esMensajeExito ? (
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
                setErrorDatos("");
              }}
              className="rounded-lg p-1 transition hover:bg-black/5"
            >
              <X size={18} />
            </button>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Productos activos
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {productosActivos.length}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <ChefHat size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Disponibles
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {productosDisponibles.length}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <PackageCheck size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Agotados
                </p>

                <p className="mt-2 text-3xl font-black text-orange-600">
                  {productosAgotados.length}
                </p>
              </div>

              <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                <PackageX size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Precio promedio
                </p>

                <p className="mt-2 text-3xl font-black text-amber-600">
                  S/ {precioPromedio.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <CircleDollarSign size={25} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-amber-700">
                <Sparkles size={20} />

                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  Catálogo comercial
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Organiza lo que vendes por categorías
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Primero crea categorías como Platos de fondo, Entradas,
                Gaseosas, Bebidas y Postres. Luego registra aquí cada producto
                con precio, imagen, tiempo de preparación y disponibilidad.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirNuevoProducto}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 font-black text-slate-950 transition hover:bg-amber-400"
            >
              <ShoppingBasket size={20} />
              Registrar plato o bebida
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoriaFiltro("")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                !categoriaFiltro
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos ({productosActivos.length})
            </button>

            {categoriasConProductos.map(
              (categoria) => (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() =>
                    setCategoriaFiltro(
                      categoria.id
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    categoriaFiltro ===
                    categoria.id
                      ? "bg-amber-500 text-slate-950"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  {categoria.nombre} (
                  {categoria.cantidad})
                </button>
              )
            )}
          </div>
        </section>

        <ProductoToolbar
          busqueda={busqueda}
          categoriaId={categoriaFiltro}
          categorias={categorias.map(
            (categoria) => ({
              id: categoria.id,
              nombre: categoria.nombre,
            })
          )}
          cargando={cargando}
          onCambiarBusqueda={setBusqueda}
          onCambiarCategoria={
            setCategoriaFiltro
          }
          onNuevo={abrirNuevoProducto}
          onRecargar={recargar}
        />

        {cargando || cargandoDatos ? (
          <div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoaderCircle
                size={44}
                className="mx-auto animate-spin text-amber-500"
              />

              <p className="mt-4 font-bold text-slate-600">
                Cargando productos...
              </p>
            </div>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <ShoppingBasket
              size={50}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-2xl font-black text-slate-900">
              No se encontraron productos
            </h2>

            <p className="mt-2 text-slate-500">
              Registra tu primer plato, gaseosa, bebida o postre,
              o cambia los filtros de búsqueda.
            </p>

            <button
              type="button"
              onClick={abrirNuevoProducto}
              className="mt-6 rounded-2xl bg-amber-500 px-6 py-3.5 font-black text-slate-950 transition hover:bg-amber-400"
            >
              Crear producto
            </button>
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {productosFiltrados.map(
              (producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  guardando={guardando}
                  onEditar={abrirEdicion}
                  onCambiarDisponibilidad={
                    alternarDisponibilidad
                  }
                  onDesactivar={
                    setProductoParaDesactivar
                  }
                />
              )
            )}
          </section>
        )}
      </div>

      <ProductoModal
        abierto={modalAbierto}
        titulo={
          productoSeleccionado
            ? "Editar producto"
            : "Nuevo producto"
        }
        descripcion={
          productoSeleccionado
            ? "Actualiza los datos, precio y disponibilidad del producto."
            : "Registra un plato, gaseosa, bebida, postre u otro producto para la carta digital y pedidos del mozo."
        }
        onCerrar={cerrarModal}
      >
        <ProductoForm
          producto={productoSeleccionado}
          categorias={categorias.map(
            (categoria) => ({
              id: categoria.id,
              codigo: categoria.codigo,
              nombre: categoria.nombre,
            })
          )}
          guardando={guardando}
          onGuardar={guardarProducto}
        />
      </ProductoModal>

      <ProductoModal
        abierto={Boolean(
          productoParaDesactivar
        )}
        titulo="Desactivar producto"
        descripcion="El producto dejará de aparecer en el menú, pero conservará su historial."
        onCerrar={() => {
          if (!guardando) {
            setProductoParaDesactivar(null);
          }
        }}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-bold text-red-800">
              ¿Deseas desactivar el producto{" "}
              <strong>
                {productoParaDesactivar?.nombre}
              </strong>
              ?
            </p>

            <p className="mt-2 text-sm text-red-700">
              Ya no estará disponible para
              pedidos ni para el menú digital.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setProductoParaDesactivar(null)
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
              className="rounded-2xl bg-red-600 px-5 py-3.5 font-black text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {guardando
                ? "Desactivando..."
                : "Sí, desactivar"}
            </button>
          </div>
        </div>
      </ProductoModal>
    </main>
  );
}