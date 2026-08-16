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
  CheckCircle2,
  History,
  LoaderCircle,
  Minus,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  useParams,
} from "next/navigation";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type MesaDetalle = {
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
    sucursalId: string;
  };

  atencionActual: {
    id: string;
    codigo: string;
    estado: string;
    cantidadPersonas: number;
    metodoPagoPrevisto:
      | string
      | null;
    subtotal: number | string;
    descuento: number | string;
    total: number | string;
    fechaApertura: string;
  } | null;
};

type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioVenta: number | string;
  imagenUrl: string | null;
};

type ItemPedido = {
  producto: Producto;
  cantidad: number;
  observacion: string;
};

type PedidoHistorial = {
  id: string;
  numero: string;
  estado: string;
  origen: string;
  subtotal: number | string;
  fechaPedido: string;
  observacion?: string | null;

  detalles: Array<{
    id: string;
    cantidad: number | string;
    precioUnitario:
      | number
      | string;
    subtotal:
      | number
      | string;
    observacion?: string | null;

    producto: {
      id: string;
      codigo: string;
      nombre: string;
      imagenUrl?: string | null;
      tiempoPreparacion?: number;
    };
  }>;
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

function estadoPedido(
  estado: string
) {
  const mapa: Record<
    string,
    string
  > = {
    PENDIENTE_CONFIRMACION:
      "Pendiente",
    NUEVO:
      "Nuevo",
    RECIBIDO:
      "Recibido",
    PREPARANDO:
      "Preparando",
    LISTO:
      "Listo",
    EN_ENTREGA:
      "En entrega",
    ENTREGADO:
      "Entregado",
    ANULADO:
      "Anulado",
  };

  return mapa[estado] ??
    estado;
}

export default function MesaMozoRapidoPage() {
  const params =
    useParams<{
      mesaId: string;
    }>();

  const mesaId =
    params.mesaId;

  const [
    mesa,
    setMesa,
  ] =
    useState<MesaDetalle | null>(
      null
    );

  const [
    productos,
    setProductos,
  ] =
    useState<Producto[]>([]);

  const [
    carrito,
    setCarrito,
  ] =
    useState<ItemPedido[]>([]);

  const [
    pedidos,
    setPedidos,
  ] =
    useState<PedidoHistorial[]>([]);

  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");

  const [
    cantidadPersonas,
    setCantidadPersonas,
  ] =
    useState(1);

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    procesando,
    setProcesando,
  ] =
    useState(false);

  const [
    mensaje,
    setMensaje,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    mostrarHistorial,
    setMostrarHistorial,
  ] =
    useState(false);

  const cargarMesa =
    useCallback(async () => {
      if (!mesaId) {
        return null;
      }

      const respuesta =
        await fetch(
          `/api/mesas/${encodeURIComponent(
            mesaId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<MesaDetalle>;

      if (
        !respuesta.ok ||
        !resultado.success ||
        !resultado.data
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo cargar la mesa."
        );
      }

      setMesa(
        resultado.data
      );

      return resultado.data;
    }, [mesaId]);

  const cargarProductos =
    useCallback(
      async (
        sucursalId: string
      ) => {
        const respuesta =
          await fetch(
            `/api/productos?sucursalId=${encodeURIComponent(
              sucursalId
            )}`,
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
          resultado.data ?? []
        );
      },
      []
    );

  const cargarPedidos =
    useCallback(
      async (
        atencionId: string
      ) => {
        const respuesta =
          await fetch(
            `/api/pedidos?atencionId=${encodeURIComponent(
              atencionId
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            PedidoHistorial[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudo cargar el historial de pedidos."
          );
        }

        setPedidos(
          resultado.data ?? []
        );
      },
      []
    );

  const sincronizar =
    useCallback(
      async (
        mostrarCarga = false
      ) => {
        try {
          if (mostrarCarga) {
            setCargando(true);
          }

          const mesaActual =
            await cargarMesa();

          if (
            mesaActual?.zona
              .sucursalId
          ) {
            await cargarProductos(
              mesaActual.zona
                .sucursalId
            );
          }

          if (
            mesaActual
              ?.atencionActual?.id
          ) {
            await cargarPedidos(
              mesaActual
                .atencionActual.id
            );
          } else {
            setPedidos([]);
          }
        } catch (
          errorDesconocido
        ) {
          setError(
            errorDesconocido instanceof Error
              ? errorDesconocido.message
              : "Error cargando la mesa."
          );
        } finally {
          setCargando(false);
        }
      },
      [
        cargarMesa,
        cargarProductos,
        cargarPedidos,
      ]
    );

  useEffect(() => {
    sincronizar(true);

    const intervalo =
      window.setInterval(
        () => {
          sincronizar(false);
        },
        5000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [sincronizar]);

  const productosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLocaleLowerCase(
            "es-PE"
          );

      if (!texto) {
        return productos;
      }

      return productos.filter(
        (producto) =>
          producto.nombre
            .toLocaleLowerCase(
              "es-PE"
            )
            .includes(texto) ||
          producto.codigo
            .toLocaleLowerCase(
              "es-PE"
            )
            .includes(texto)
      );
    }, [
      productos,
      busqueda,
    ]);

  const totalCarrito =
    useMemo(
      () =>
        carrito.reduce(
          (total, item) =>
            total +
            Number(
              item.producto
                .precioVenta
            ) *
              item.cantidad,
          0
        ),
      [carrito]
    );

  const cantidadCarrito =
    useMemo(
      () =>
        carrito.reduce(
          (total, item) =>
            total +
            item.cantidad,
          0
        ),
      [carrito]
    );

  const pendientes =
    useMemo(
      () =>
        pedidos.filter(
          (pedido) =>
            ![
              "ENTREGADO",
              "ANULADO",
            ].includes(
              pedido.estado
            )
        ).length,
      [pedidos]
    );

  const cuentaSolicitada =
    mesa?.estado ===
      "SOLICITO_CUENTA" ||
    mesa?.atencionActual
      ?.estado ===
      "SOLICITO_CUENTA";

  const puedePedir =
    Boolean(
      mesa?.atencionActual
    ) &&
    !cuentaSolicitada &&
    mesa?.estado !==
      "PAGADA";

  function agregarProducto(
    producto: Producto
  ) {
    if (!puedePedir) {
      return;
    }

    setCarrito(
      (actual) => {
        const existe =
          actual.find(
            (item) =>
              item.producto.id ===
              producto.id
          );

        if (existe) {
          return actual.map(
            (item) =>
              item.producto.id ===
              producto.id
                ? {
                    ...item,
                    cantidad:
                      item.cantidad +
                      1,
                  }
                : item
          );
        }

        return [
          ...actual,
          {
            producto,
            cantidad: 1,
            observacion: "",
          },
        ];
      }
    );
  }

  function cambiarCantidad(
    productoId: string,
    cantidad: number
  ) {
    if (cantidad <= 0) {
      setCarrito(
        (actual) =>
          actual.filter(
            (item) =>
              item.producto.id !==
              productoId
          )
      );

      return;
    }

    setCarrito(
      (actual) =>
        actual.map(
          (item) =>
            item.producto.id ===
            productoId
              ? {
                  ...item,
                  cantidad,
                }
              : item
        )
    );
  }

  async function abrirAtencion() {
    if (!mesa) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          "/api/mozo/atenciones",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              mesaId:
                mesa.id,

              cantidadPersonas:
                Math.max(
                  1,
                  Math.min(
                    mesa.capacidad,
                    Number(
                      cantidadPersonas
                    ) || 1
                  )
                ),
            }),
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<unknown>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo abrir la atención."
        );
      }

      setMensaje(
        "Mesa abierta. Ya puedes tomar el pedido."
      );

      await sincronizar(false);
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "Error abriendo atención."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function enviarPedido() {
    if (
      !mesa ||
      !mesa.atencionActual ||
      carrito.length === 0 ||
      !puedePedir
    ) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          "/api/mozo/pedidos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              atencionId:
                mesa.atencionActual
                  .id,

              detalles:
                carrito.map(
                  (item) => ({
                    productoId:
                      item.producto.id,

                    cantidad:
                      item.cantidad,

                    observacion:
                      item.observacion ||
                      undefined,
                  })
                ),
            }),
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<{
          numero: string;
        }>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo enviar el pedido."
        );
      }

      setCarrito([]);
      setBusqueda("");

      setMensaje(
        resultado.data
          ? `Pedido ${resultado.data.numero} enviado a Cocina.`
          : "Pedido enviado a Cocina."
      );

      await sincronizar(false);
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "Error enviando pedido."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function solicitarCuenta() {
    if (
      !mesa?.atencionActual
    ) {
      return;
    }

    if (
      pendientes > 0
    ) {
      setError(
        "Primero deben terminarse los pedidos pendientes."
      );
      return;
    }

    const confirmado =
      window.confirm(
        `¿Solicitar la cuenta de ${mesa.nombre} por ${dinero(
          mesa.atencionActual
            .total
        )}?`
      );

    if (!confirmado) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          `/api/atenciones/${encodeURIComponent(
            mesa.atencionActual.id
          )}/solicitar-cuenta`,
          {
            method: "PATCH",
            cache: "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<unknown>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo solicitar la cuenta."
        );
      }

      setCarrito([]);

      setMensaje(
        "Cuenta solicitada. Caja fue notificada."
      );

      await sincronizar(false);
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "Error solicitando la cuenta."
      );
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <LoaderCircle
          size={48}
          className="animate-spin text-amber-500"
        />
      </main>
    );
  }

  if (!mesa) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="font-black text-red-600">
            {error ||
              "Mesa no disponible."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-32">
      <header className="sticky top-0 z-30 bg-slate-950 px-4 pb-4 pt-4 text-white shadow-xl">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard/mozo"
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-black"
            >
              <ArrowLeft
                size={18}
              />
              Mesas
            </Link>

            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                {mesa.zona.nombre}
              </p>

              <h1 className="text-2xl font-black">
                {mesa.nombre}
              </h1>
            </div>
          </div>

          {mesa.atencionActual && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] text-slate-400">
                  PERSONAS
                </p>
                <p className="mt-1 text-xl font-black">
                  {
                    mesa
                      .atencionActual
                      .cantidadPersonas
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] text-slate-400">
                  PEDIDOS
                </p>
                <p className="mt-1 text-xl font-black">
                  {pedidos.length}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/20 p-3">
                <p className="text-[10px] text-emerald-200">
                  TOTAL
                </p>
                <p className="mt-1 text-lg font-black text-emerald-300">
                  {dinero(
                    mesa
                      .atencionActual
                      .total
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 p-4">
        {(mensaje || error) && (
          <div
            className={`rounded-2xl border p-4 font-bold ${
              mensaje
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensaje || error}
          </div>
        )}

        {!mesa.atencionActual ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mx-auto max-w-md text-center">
              <Users
                size={44}
                className="mx-auto text-amber-500"
              />

              <h2 className="mt-3 text-2xl font-black">
                Mesa libre
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                ¿Cuántas personas vas a atender?
              </p>

              <div className="mx-auto mt-6 flex max-w-xs items-center justify-between rounded-2xl bg-slate-100 p-2">
                <button
                  type="button"
                  onClick={() =>
                    setCantidadPersonas(
                      (actual) =>
                        Math.max(
                          1,
                          actual - 1
                        )
                    )
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm"
                >
                  <Minus
                    size={22}
                  />
                </button>

                <span className="text-4xl font-black">
                  {cantidadPersonas}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCantidadPersonas(
                      (actual) =>
                        Math.min(
                          mesa.capacidad,
                          actual + 1
                        )
                    )
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500"
                >
                  <Plus
                    size={22}
                  />
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Capacidad: {mesa.capacidad}
              </p>

              <button
                type="button"
                onClick={
                  abrirAtencion
                }
                disabled={
                  procesando
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 text-lg font-black text-slate-950 disabled:opacity-50"
              >
                {procesando ? (
                  <LoaderCircle
                    size={21}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={21}
                  />
                )}

                ABRIR Y TOMAR PEDIDO
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setMostrarHistorial(
                    true
                  )
                }
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-black shadow-sm"
              >
                <History
                  size={17}
                  className="mr-2 inline"
                />
                Ver pedidos
              </button>

              <Link
                href={`/dashboard/ticket/${mesa.atencionActual.id}`}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black shadow-sm"
              >
                <ReceiptText
                  size={17}
                  className="mr-2 inline"
                />
                Consumo
              </Link>

              {!cuentaSolicitada && (
                <button
                  type="button"
                  onClick={
                    solicitarCuenta
                  }
                  disabled={
                    procesando ||
                    pendientes > 0
                  }
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40"
                >
                  Cuenta
                </button>
              )}
            </section>

            {cuentaSolicitada ? (
              <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 text-center">
                <CheckCircle2
                  size={44}
                  className="mx-auto text-blue-600"
                />

                <h2 className="mt-3 text-xl font-black text-blue-950">
                  Cuenta solicitada
                </h2>

                <p className="mt-1 text-sm text-blue-700">
                  Caja fue notificada. Ya no se aceptan nuevos pedidos.
                </p>
              </section>
            ) : (
              <>
                <section className="sticky top-[164px] z-20 rounded-3xl bg-slate-100 pb-2 pt-1">
                  <div className="relative">
                    <Search
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={
                        busqueda
                      }
                      onChange={(
                        evento
                      ) =>
                        setBusqueda(
                          evento.target.value
                        )
                      }
                      placeholder="Buscar plato o bebida..."
                      className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 font-bold outline-none shadow-sm focus:border-amber-500"
                    />
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {productosFiltrados.map(
                    (producto) => (
                      <article
                        key={
                          producto.id
                        }
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        {producto.imagenUrl && (
                          <img
                            src={
                              producto.imagenUrl
                            }
                            alt={
                              producto.nombre
                            }
                            className="h-28 w-full object-cover md:h-36"
                          />
                        )}

                        <div className="p-3">
                          <h3 className="line-clamp-2 min-h-10 text-sm font-black text-slate-950">
                            {
                              producto.nombre
                            }
                          </h3>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <p className="font-black text-emerald-700">
                              {dinero(
                                producto.precioVenta
                              )}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                agregarProducto(
                                  producto
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 active:scale-95"
                            >
                              <Plus
                                size={20}
                              />
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>

      {cantidadCarrito > 0 &&
        puedePedir && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-3 shadow-2xl">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
              {carrito.map(
                (item) => (
                  <div
                    key={
                      item.producto.id
                    }
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">
                        {
                          item.producto
                            .nombre
                        }
                      </p>
                      <p className="text-xs text-slate-500">
                        {dinero(
                          Number(
                            item.producto
                              .precioVenta
                          ) *
                            item.cantidad
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          cambiarCantidad(
                            item.producto
                              .id,
                            item.cantidad -
                              1
                          )
                        }
                        className="rounded-lg bg-white p-2 shadow-sm"
                      >
                        <Minus
                          size={15}
                        />
                      </button>

                      <span className="min-w-5 text-center font-black">
                        {item.cantidad}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarCantidad(
                            item.producto
                              .id,
                            item.cantidad +
                              1
                          )
                        }
                        className="rounded-lg bg-amber-500 p-2"
                      >
                        <Plus
                          size={15}
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={
                enviarPedido
              }
              disabled={
                procesando
              }
              className="flex w-full items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {procesando ? (
                  <LoaderCircle
                    size={21}
                    className="animate-spin"
                  />
                ) : (
                  <ShoppingCart
                    size={22}
                  />
                )}

                <div className="text-left">
                  <p className="text-xs text-slate-400">
                    {cantidadCarrito} producto(s)
                  </p>
                  <p className="font-black">
                    ENVIAR A COCINA
                  </p>
                </div>
              </div>

              <span className="text-xl font-black">
                {dinero(
                  totalCarrito
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      {mostrarHistorial && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60 backdrop-blur-sm md:items-center md:justify-center md:p-5">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 md:max-w-2xl md:rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                  {mesa.nombre}
                </p>

                <h2 className="text-2xl font-black">
                  Pedidos
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarHistorial(
                    false
                  )
                }
                className="rounded-xl bg-slate-100 px-4 py-2 font-black"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {pedidos.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                  Sin pedidos.
                </div>
              ) : (
                pedidos.map(
                  (pedido) => (
                    <article
                      key={
                        pedido.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-black">
                            {
                              pedido.numero
                            }
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {estadoPedido(
                              pedido.estado
                            )}
                          </p>
                        </div>

                        <p className="font-black">
                          {dinero(
                            pedido.subtotal
                          )}
                        </p>
                      </div>

                      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                        {pedido.detalles.map(
                          (detalle) => (
                            <div
                              key={
                                detalle.id
                              }
                              className="flex justify-between gap-3 text-sm"
                            >
                              <span className="text-slate-600">
                                {Number(
                                  detalle.cantidad
                                )}{" "}
                                ×{" "}
                                {
                                  detalle
                                    .producto
                                    .nombre
                                }
                              </span>

                              <span className="font-bold">
                                {dinero(
                                  detalle.subtotal
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </article>
                  )
                )
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
