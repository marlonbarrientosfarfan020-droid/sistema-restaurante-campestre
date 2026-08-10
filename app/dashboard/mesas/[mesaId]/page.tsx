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
  WalletCards,
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
    precioUnitario: number | string;
    subtotal: number | string;
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

export default function MesaMozoPage() {
  const params =
    useParams<{
      mesaId: string;
    }>();

  const mesaId =
    params.mesaId;

  const [
    mesa,
    setMesa,
  ] = useState<MesaDetalle | null>(
    null
  );

  const [
    productos,
    setProductos,
  ] = useState<Producto[]>([]);

  const [
    carrito,
    setCarrito,
  ] = useState<ItemPedido[]>(
    []
  );

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    cantidadPersonas,
    setCantidadPersonas,
  ] = useState(1);

  const [
    metodoPagoPrevisto,
    setMetodoPagoPrevisto,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    pedidos,
    setPedidos,
  ] = useState<PedidoHistorial[]>([]);

  const [
    cargandoPedidos,
    setCargandoPedidos,
  ] = useState(false);

  const cargarMesa =
    useCallback(async () => {
      if (!mesaId) {
        return;
      }

      try {
        setCargando(true);
        setError("");

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
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof
            Error
            ? errorDesconocido.message
            : "Error cargando la mesa."
        );
      } finally {
        setCargando(false);
      }
    }, [mesaId]);

  const cargarProductos =
    useCallback(
      async (
        sucursalId: string
      ) => {
        try {
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
        } catch (
          errorDesconocido
        ) {
          setError(
            errorDesconocido instanceof
              Error
              ? errorDesconocido.message
              : "Error cargando productos."
          );
        }
      },
      []
    );

  const cargarPedidos =
    useCallback(
      async (
        atencionId: string
      ) => {
        try {
          setCargandoPedidos(true);

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
        } catch (
          errorDesconocido
        ) {
          setError(
            errorDesconocido instanceof
              Error
              ? errorDesconocido.message
              : "Error cargando el historial de pedidos."
          );
        } finally {
          setCargandoPedidos(false);
        }
      },
      []
    );

  useEffect(() => {
    cargarMesa();
  }, [cargarMesa]);

  useEffect(() => {
    if (
      mesa?.zona.sucursalId
    ) {
      cargarProductos(
        mesa.zona.sucursalId
      );
    }
  }, [
    mesa?.zona.sucursalId,
    cargarProductos,
  ]);

  useEffect(() => {
    const atencionId =
      mesa?.atencionActual?.id;

    if (!atencionId) {
      setPedidos([]);
      return;
    }

    cargarPedidos(
      atencionId
    );
  }, [
    mesa?.atencionActual?.id,
    cargarPedidos,
  ]);

  const productosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return productos;
      }

      return productos.filter(
        (producto) =>
          producto.nombre
            .toLowerCase()
            .includes(texto) ||
          producto.codigo
            .toLowerCase()
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

  const totalHistorial =
    useMemo(
      () =>
        pedidos.reduce(
          (total, pedido) =>
            total +
            Number(
              pedido.subtotal ?? 0
            ),
          0
        ),
      [pedidos]
    );

  const pedidosPendientes =
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
    mesa?.atencionActual?.estado ===
      "SOLICITO_CUENTA";

  const puedeAgregarPedidos =
    Boolean(
      mesa?.atencionActual
    ) &&
    !cuentaSolicitada &&
    mesa?.estado !== "PAGADA";

  function agregarProducto(
    producto: Producto
  ) {
    if (!puedeAgregarPedidos) {
      setError(
        "No se pueden agregar productos porque la cuenta ya fue solicitada."
      );
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
          "/api/mesas",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              mesaId:
                mesa.id,
              sucursalId:
                mesa.zona.sucursalId,
              cantidadPersonas,
              metodoPagoPrevisto:
                metodoPagoPrevisto ||
                undefined,
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
        "Atención abierta correctamente."
      );

      await cargarMesa();
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
      !puedeAgregarPedidos
    ) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          "/api/pedidos",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              atencionId:
                mesa.atencionActual.id,
              sucursalId:
                mesa.zona.sucursalId,
              origen: "MOZO",
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

      setMensaje(
        resultado.data
          ? `Pedido ${resultado.data.numero} enviado a Cocina.`
          : "Pedido enviado a Cocina."
      );

      await cargarMesa();

      if (
        mesa.atencionActual?.id
      ) {
        await cargarPedidos(
          mesa.atencionActual.id
        );
      }
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
      !mesa ||
      !mesa.atencionActual
    ) {
      return;
    }

    if (
      mesa.atencionActual.estado ===
        "SOLICITO_CUENTA" ||
      mesa.estado ===
        "SOLICITO_CUENTA"
    ) {
      setMensaje(
        "La cuenta ya fue solicitada."
      );
      return;
    }

    const confirmado =
      window.confirm(
        `¿Solicitar la cuenta de ${mesa.nombre} por S/ ${Number(
          mesa.atencionActual.total
        ).toFixed(2)}?`
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
        (await respuesta.json()) as ApiResponse<{
          id: string;
          codigo: string;
          mesaId: string;
          mesa: string;
          estado: string;
          total: number;
          fechaSolicitudCuenta: string;
        }>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo solicitar la cuenta."
        );
      }

      setMensaje(
        resultado.message ||
          "Cuenta solicitada correctamente. Caja fue notificada."
      );

      setCarrito([]);

      await cargarMesa();

      if (
        mesa.atencionActual.id
      ) {
        await cargarPedidos(
          mesa.atencionActual.id
        );
      }
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
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <Link
            href="/dashboard/mozo"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-300"
          >
            <ArrowLeft size={18} />
            Volver a mesas
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                {
                  mesa.zona.nombre
                }
              </p>

              <h1 className="mt-1 text-4xl font-black">
                {mesa.nombre}
              </h1>

              <p className="mt-2 text-slate-300">
                Estado:{" "}
                <span className="font-black">
                  {mesa.estado}
                </span>
              </p>
            </div>

            {mesa.atencionActual && (
              <div className="rounded-2xl bg-white/10 px-5 py-4">
                <p className="text-xs text-slate-400">
                  Atención
                </p>

                <p className="font-black">
                  {
                    mesa.atencionActual
                      .codigo
                  }
                </p>

                <p className="mt-2 text-2xl font-black text-emerald-400">
                  S/{" "}
                  {Number(
                    mesa.atencionActual.total
                  ).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </header>

        {(mensaje ||
          error) && (
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
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mx-auto max-w-xl">
              <Users
                size={45}
                className="text-amber-500"
              />

              <h2 className="mt-4 text-2xl font-black">
                Abrir atención
              </h2>

              <p className="mt-2 text-slate-500">
                Registra a los comensales para comenzar a tomar pedidos.
              </p>

              <label className="mt-6 block text-sm font-black text-slate-700">
                Cantidad de personas
              </label>

              <input
                type="number"
                min={1}
                max={100}
                value={
                  cantidadPersonas
                }
                onChange={(
                  evento
                ) =>
                  setCantidadPersonas(
                    Number(
                      evento.target.value
                    )
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />

              <label className="mt-4 block text-sm font-black text-slate-700">
                Método de pago previsto
              </label>

              <select
                value={
                  metodoPagoPrevisto
                }
                onChange={(
                  evento
                ) =>
                  setMetodoPagoPrevisto(
                    evento.target.value
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="">
                  No indicado
                </option>
                <option value="EFECTIVO">
                  Efectivo
                </option>
                <option value="YAPE">
                  Yape
                </option>
                <option value="PLIN">
                  Plin
                </option>
                <option value="TARJETA">
                  Tarjeta
                </option>
              </select>

              <button
                type="button"
                onClick={
                  abrirAtencion
                }
                disabled={
                  procesando
                }
                className="mt-6 w-full rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 disabled:opacity-50"
              >
                {procesando
                  ? "Abriendo..."
                  : "ABRIR ATENCIÓN"}
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                    Atención activa
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    Resumen de {mesa.nombre}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Todos los pedidos permanecen dentro de la misma atención{" "}
                    <span className="font-black">
                      {mesa.atencionActual.codigo}
                    </span>
                    .
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <p className="text-xs font-bold text-slate-500">
                      Pedidos
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {pedidos.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-3 text-center">
                    <p className="text-xs font-bold text-orange-700">
                      Pendientes
                    </p>
                    <p className="mt-1 text-2xl font-black text-orange-600">
                      {pedidosPendientes}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                    <p className="text-xs font-bold text-emerald-700">
                      Acumulado
                    </p>
                    <p className="mt-1 text-xl font-black text-emerald-700">
                      S/{" "}
                      {Number(
                        mesa.atencionActual.total
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/ticket/${mesa.atencionActual.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
                >
                  <ReceiptText size={19} />
                  Ver cuenta
                </Link>

                {cuentaSolicitada ? (
                  <>
                    <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-5 py-3 font-black text-blue-700">
                      <CheckCircle2 size={19} />
                      Cuenta solicitada
                    </div>

                    <Link
                      href="/dashboard/caja"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white"
                    >
                      <WalletCards size={19} />
                      Ir a Caja
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={
                      solicitarCuenta
                    }
                    disabled={
                      procesando ||
                      pedidosPendientes > 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {procesando ? (
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={19}
                      />
                    )}

                    Solicitar cuenta
                  </button>
                )}
              </div>

              {!cuentaSolicitada &&
                pedidosPendientes > 0 && (
                  <p className="mt-3 text-sm font-bold text-orange-700">
                    Para solicitar la cuenta primero deben terminarse todos los pedidos pendientes.
                  </p>
                )}

              {cuentaSolicitada && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
                  <p className="font-black">
                    Cuenta enviada a Caja.
                  </p>

                  <p className="mt-1 text-sm">
                    Ya no se pueden registrar nuevos pedidos en esta atención.
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <History
                      size={21}
                      className="text-slate-600"
                    />
                    <h3 className="text-lg font-black text-slate-950">
                      Historial de pedidos
                    </h3>
                  </div>

                  {cargandoPedidos && (
                    <LoaderCircle
                      size={20}
                      className="animate-spin text-slate-400"
                    />
                  )}
                </div>

                {pedidos.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Esta atención todavía no tiene pedidos.
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    {pedidos.map(
                      (pedido) => (
                        <article
                          key={pedido.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                                {pedido.numero}
                              </p>
                              <p className="mt-1 text-sm font-black text-slate-700">
                                {pedido.estado}
                              </p>
                            </div>

                            <p className="font-black text-slate-950">
                              S/{" "}
                              {Number(
                                pedido.subtotal
                              ).toFixed(2)}
                            </p>
                          </div>

                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                            {pedido.detalles.map(
                              (detalle) => (
                                <div
                                  key={detalle.id}
                                  className="flex justify-between gap-3 text-sm"
                                >
                                  <span className="text-slate-600">
                                    {Number(
                                      detalle.cantidad
                                    )}{" "}
                                    ×{" "}
                                    {
                                      detalle.producto
                                        .nombre
                                    }
                                  </span>

                                  <span className="font-bold">
                                    S/{" "}
                                    {Number(
                                      detalle.subtotal
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}

                {pedidos.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
                      <span className="text-sm text-slate-400">
                        Suma de pedidos cargados
                      </span>
                      <span className="ml-3 text-xl font-black">
                        S/ {totalHistorial.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
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
                  placeholder={
                    cuentaSolicitada
                      ? "Cuenta solicitada: nuevos pedidos bloqueados"
                      : "Buscar plato o bebida..."
                  }
                  disabled={
                    cuentaSolicitada
                  }
                  className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-4 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productosFiltrados.map(
                  (producto) => (
                    <article
                      key={
                        producto.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <h3 className="font-black text-slate-950">
                        {
                          producto.nombre
                        }
                      </h3>

                      <p className="mt-2 text-xl font-black text-emerald-600">
                        S/{" "}
                        {Number(
                          producto.precioVenta
                        ).toFixed(2)}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          agregarProducto(
                            producto
                          )
                        }
                        disabled={
                          !puedeAgregarPedidos
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus size={18} />
                        Agregar
                      </button>
                    </article>
                  )
                )}
              </div>
            </section>

            <aside className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <ShoppingCart
                  size={25}
                />

                <div>
                  <p className="text-sm text-slate-500">
                    Nuevo pedido
                  </p>

                  <h2 className="text-xl font-black">
                    {mesa.nombre}
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {carrito.length ===
                0 ? (
                  <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                    {cuentaSolicitada
                      ? "La cuenta ya fue solicitada. No se pueden agregar nuevos productos."
                      : "Agrega productos al pedido."}
                  </p>
                ) : (
                  carrito.map(
                    (item) => (
                      <div
                        key={
                          item.producto
                            .id
                        }
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex justify-between gap-3">
                          <p className="font-black">
                            {
                              item.producto
                                .nombre
                            }
                          </p>

                          <p className="font-black">
                            S/{" "}
                            {(
                              Number(
                                item.producto
                                  .precioVenta
                              ) *
                              item.cantidad
                            ).toFixed(
                              2
                            )}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
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
                            className="rounded-lg bg-slate-100 p-2"
                          >
                            <Minus
                              size={17}
                            />
                          </button>

                          <span className="font-black">
                            {
                              item.cantidad
                            }
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
                              size={17}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">
                    Total pedido
                  </span>

                  <span className="text-3xl font-black text-emerald-600">
                    S/{" "}
                    {totalCarrito.toFixed(
                      2
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={
                    enviarPedido
                  }
                  disabled={
                    procesando ||
                    carrito.length ===
                      0 ||
                    !puedeAgregarPedidos
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:opacity-40"
                >
                  {procesando ? (
                    <LoaderCircle
                      size={20}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={20}
                    />
                  )}

                  ENVIAR A COCINA
                </button>
              </div>
            </aside>
          </div>
          </>
        )}
      </div>
    </main>
  );
}