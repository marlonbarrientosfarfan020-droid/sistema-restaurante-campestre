"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  ChefHat,
  ImageIcon,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import type { Producto } from "@/types/producto";

type ItemCarrito = {
  producto: Producto;
  cantidad: number;
  observacion: string;
};

type Props = {
  enviando: boolean;

  onEnviar: (datos: {
    observacion: string;
    detalles: Array<{
      productoId: string;
      cantidad: number;
      observacion?: string;
    }>;
  }) => Promise<boolean>;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export default function AgregarPedidoForm({
  enviando,
  onEnviar,
}: Props) {
  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [categoriaId, setCategoriaId] =
    useState("");

  const [carrito, setCarrito] =
    useState<ItemCarrito[]>([]);

  const [observacionGeneral, setObservacionGeneral] =
    useState("");

  useEffect(() => {
    async function cargarProductos() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          "/api/productos",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            Producto[]
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
          (resultado.data ?? []).filter(
            (producto) =>
              producto.activo &&
              producto.disponible
          )
        );
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudieron cargar los productos."
        );
      } finally {
        setCargando(false);
      }
    }

    cargarProductos();
  }, []);

  const categorias = useMemo(() => {
    return Array.from(
      new Map(
        productos.map((producto) => [
          producto.categoria.id,
          producto.categoria,
        ])
      ).values()
    ).sort((a, b) =>
      a.nombre.localeCompare(
        b.nombre,
        "es-PE"
      )
    );
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLocaleLowerCase("es-PE");

    return productos.filter((producto) => {
      const coincideCategoria =
        !categoriaId ||
        producto.categoriaId ===
          categoriaId;

      const coincideTexto =
        !texto ||
        producto.nombre
          .toLocaleLowerCase("es-PE")
          .includes(texto) ||
        producto.codigo
          .toLocaleLowerCase("es-PE")
          .includes(texto) ||
        producto.categoria.nombre
          .toLocaleLowerCase("es-PE")
          .includes(texto);

      return (
        coincideCategoria &&
        coincideTexto
      );
    });
  }, [
    productos,
    categoriaId,
    busqueda,
  ]);

  const total = carrito.reduce(
    (acumulado, item) =>
      acumulado +
      Number(item.producto.precioVenta) *
        item.cantidad,
    0
  );

  const cantidadItems = carrito.reduce(
    (acumulado, item) =>
      acumulado + item.cantidad,
    0
  );

  function agregarProducto(
    producto: Producto
  ) {
    setCarrito((carritoActual) => {
      const existente =
        carritoActual.find(
          (item) =>
            item.producto.id === producto.id
        );

      if (existente) {
        return carritoActual.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item
        );
      }

      return [
        ...carritoActual,
        {
          producto,
          cantidad: 1,
          observacion: "",
        },
      ];
    });
  }

  function cambiarCantidad(
    productoId: string,
    cantidad: number
  ) {
    if (cantidad <= 0) {
      eliminarProducto(productoId);
      return;
    }

    if (cantidad > 100) {
      return;
    }

    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad,
            }
          : item
      )
    );
  }

  function cambiarObservacion(
    productoId: string,
    observacion: string
  ) {
    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              observacion,
            }
          : item
      )
    );
  }

  function eliminarProducto(
    productoId: string
  ) {
    setCarrito((carritoActual) =>
      carritoActual.filter(
        (item) =>
          item.producto.id !== productoId
      )
    );
  }

  async function enviarPedido() {
    if (carrito.length === 0) {
      setError(
        "Agrega al menos un producto al pedido."
      );
      return;
    }

    setError("");

    const exito = await onEnviar({
      observacion:
        observacionGeneral.trim(),
      detalles: carrito.map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        observacion:
          item.observacion.trim() ||
          undefined,
      })),
    });

    if (!exito) {
      return;
    }

    setCarrito([]);
    setObservacionGeneral("");
    setBusqueda("");
    setCategoriaId("");
  }

  if (cargando) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={42}
            className="mx-auto animate-spin text-amber-500"
          />

          <p className="mt-4 font-bold text-slate-600">
            Cargando menú...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="space-y-5">
        <div className="grid gap-3 md:grid-cols-[1fr_230px]">
          <div className="relative">
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
              placeholder="Buscar plato o bebida..."
              className="w-full rounded-2xl border border-slate-300 py-3.5 pl-11 pr-4 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />
          </div>

          <select
            value={categoriaId}
            onChange={(evento) =>
              setCategoriaId(
                evento.target.value
              )
            }
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 outline-none focus:border-amber-500"
          >
            <option value="">
              Todas las categorías
            </option>

            {categorias.map((categoria) => (
              <option
                key={categoria.id}
                value={categoria.id}
              >
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700">
            {error}
          </div>
        )}

        {productosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <ChefHat
              size={42}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 font-black text-slate-700">
              No existen productos disponibles.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productosFiltrados.map(
              (producto) => {
                const agregado =
                  carrito.some(
                    (item) =>
                      item.producto.id ===
                      producto.id
                  );

                return (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() =>
                      agregarProducto(producto)
                    }
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg"
                  >
                    <div className="relative h-36 bg-slate-100">
                      {producto.imagenUrl ? (
                        <img
                          src={
                            producto.imagenUrl
                          }
                          alt={producto.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <ImageIcon
                            size={38}
                          />
                        </div>
                      )}

                      {agregado && (
                        <span className="absolute right-3 top-3 rounded-full bg-emerald-500 p-2 text-white">
                          <Check size={16} />
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-black uppercase text-amber-600">
                        {
                          producto.categoria
                            .nombre
                        }
                      </p>

                      <h3 className="mt-1 font-black text-slate-950">
                        {producto.nombre}
                      </h3>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xl font-black text-slate-950">
                          S/{" "}
                          {Number(
                            producto.precioVenta
                          ).toFixed(2)}
                        </span>

                        <span className="rounded-xl bg-amber-500 p-2 text-slate-950">
                          <Plus size={18} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </section>

      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Pedido actual
            </p>

            <h3 className="text-2xl font-black text-slate-950">
              {cantidadItems} producto
              {cantidadItems === 1
                ? ""
                : "s"}
            </h3>
          </div>

          <div className="rounded-2xl bg-amber-500 p-3 text-slate-950">
            <ShoppingCart size={24} />
          </div>
        </div>

        {carrito.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
            <p className="font-bold text-slate-500">
              Selecciona platos o bebidas.
            </p>
          </div>
        ) : (
          <div className="mt-5 max-h-[430px] space-y-4 overflow-y-auto pr-1">
            {carrito.map((item) => (
              <article
                key={item.producto.id}
                className="rounded-2xl bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">
                      {item.producto.nombre}
                    </p>

                    <p className="text-sm font-bold text-amber-700">
                      S/{" "}
                      {Number(
                        item.producto
                          .precioVenta
                      ).toFixed(2)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      eliminarProducto(
                        item.producto.id
                      )
                    }
                    className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      cambiarCantidad(
                        item.producto.id,
                        item.cantidad - 1
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white p-2"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="min-w-8 text-center text-lg font-black">
                    {item.cantidad}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarCantidad(
                        item.producto.id,
                        item.cantidad + 1
                      )
                    }
                    className="rounded-xl bg-amber-500 p-2 text-slate-950"
                  >
                    <Plus size={17} />
                  </button>

                  <span className="ml-auto font-black text-slate-950">
                    S/{" "}
                    {(
                      Number(
                        item.producto
                          .precioVenta
                      ) * item.cantidad
                    ).toFixed(2)}
                  </span>
                </div>

                <input
                  value={item.observacion}
                  onChange={(evento) =>
                    cambiarObservacion(
                      item.producto.id,
                      evento.target.value
                    )
                  }
                  placeholder="Observación: sin cebolla..."
                  maxLength={150}
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </article>
            ))}
          </div>
        )}

        <textarea
          value={observacionGeneral}
          onChange={(evento) =>
            setObservacionGeneral(
              evento.target.value
            )
          }
          placeholder="Observación general del pedido..."
          rows={3}
          maxLength={300}
          className="mt-5 w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
        />

        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
          <span className="text-lg font-bold text-slate-600">
            Total
          </span>

          <span className="text-3xl font-black text-slate-950">
            S/ {total.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          onClick={enviarPedido}
          disabled={
            enviando ||
            carrito.length === 0
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? (
            <>
              <LoaderCircle
                size={20}
                className="animate-spin"
              />
              Enviando a cocina...
            </>
          ) : (
            <>
              <ChefHat size={20} />
              Enviar pedido
            </>
          )}
        </button>
      </aside>
    </div>
  );
}