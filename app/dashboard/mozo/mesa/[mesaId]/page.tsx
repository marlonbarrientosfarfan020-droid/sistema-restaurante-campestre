"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  History,
  Info,
  LoaderCircle,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Send,
  ShoppingCart,
  Smartphone,
  Users,
  UtensilsCrossed,
  WalletCards,
  X,
} from "lucide-react";

import { toast } from "sonner";
import { usePrinter } from "@/hooks/usePrinter";
import { ThermalReceiptModal } from "@/components/impresion/ThermalReceiptModal";

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

function estadoBadgeInfo(estado: string) {
  switch (estado) {
    case "NUEVO":
    case "PENDIENTE_CONFIRMACION":
      return { label: "Nuevo", bg: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    case "RECIBIDO":
      return { label: "Recibido", bg: "bg-sky-500/20 text-sky-400 border-sky-500/30" };
    case "PREPARANDO":
      return { label: "En Preparación", bg: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    case "LISTO":
      return { label: "Listo", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    case "EN_ENTREGA":
      return { label: "En entrega", bg: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    case "ENTREGADO":
      return { label: "Entregado", bg: "bg-slate-700/40 text-slate-400 border-slate-700/50" };
    case "ANULADO":
      return { label: "Anulado", bg: "bg-rose-500/20 text-rose-400 border-rose-500/30" };
    default:
      return { label: estado, bg: "bg-slate-700/40 text-slate-300 border-slate-700" };
  }
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
    modalPedidos,
    setModalPedidos,
  ] = useState(false);

  const [
    modalConsumo,
    setModalConsumo,
  ] = useState(false);

  const [
    modalCuenta,
    setModalCuenta,
  ] = useState(false);

  const [
    metodoPagoSeleccionado,
    setMetodoPagoSeleccionado,
  ] = useState<string>("EFECTIVO");

  const [
    observacionCuenta,
    setObservacionCuenta,
  ] = useState<string>("");

  const {
    imprimiendo,
    imprimirComandaCocina,
    imprimirPrecuenta,
    modalAbierto,
    cerrarModal,
    ultimoResultado,
  } = usePrinter();

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

  const consumoConsolidado = useMemo(() => {
    const mapa = new Map<
      string,
      {
        productoId: string;
        nombre: string;
        precioUnitario: number;
        cantidad: number;
        subtotal: number;
        observaciones: string[];
      }
    >();

    pedidos
      .filter((p) => p.estado !== "ANULADO")
      .forEach((pedido) => {
        pedido.detalles.forEach((det) => {
          const key = det.producto.id;
          const cant = Number(det.cantidad);
          const sub = Number(det.subtotal);
          const precio = Number(det.precioUnitario);
          const obs = det.observacion?.trim();

          if (mapa.has(key)) {
            const item = mapa.get(key)!;
            item.cantidad += cant;
            item.subtotal += sub;
            if (obs && !item.observaciones.includes(obs)) {
              item.observaciones.push(obs);
            }
          } else {
            mapa.set(key, {
              productoId: key,
              nombre: det.producto.nombre,
              precioUnitario: precio,
              cantidad: cant,
              subtotal: sub,
              observaciones: obs ? [obs] : [],
            });
          }
        });
      });

    return Array.from(mapa.values());
  }, [pedidos]);

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

  async function enviarPedido(imprimir = true) {
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

      if (imprimir) {
        toast.info("Enviando comanda a cocina...", {
          description: "Registrando pedido y preparando ticket...",
        });
      } else {
        toast.info("Enviando pedido a cocina...");
      }

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
          id: string;
          numero: string;
        }>;

      if (
        !respuesta.ok ||
        !resultado.success ||
        !resultado.data
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo enviar el pedido."
        );
      }

      const nuevoPedido = resultado.data;
      setCarrito([]);
      setBusqueda("");

      setMensaje(
        `Pedido ${nuevoPedido.numero} enviado a Cocina.`
      );

      if (imprimir && nuevoPedido.id) {
        try {
          await imprimirComandaCocina(nuevoPedido.id);
        } catch {
          // usePrinter ya notifica con toast
        }
      } else {
        toast.success(`Pedido ${nuevoPedido.numero} enviado`, {
          description: "Registrado en cocina sin impresión física.",
        });
      }

      await sincronizar(false);
    } catch (
      errorDesconocido
    ) {
      const errorMsg =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Error enviando pedido.";
      setError(errorMsg);
      toast.error("Error al enviar pedido", { description: errorMsg });
    } finally {
      setProcesando(false);
    }
  }

  async function handleImprimirPrecuenta() {
    if (!mesa?.atencionActual?.id) {
      toast.warning("La mesa no tiene una atención activa.");
      return;
    }

    try {
      toast.info("Generando pre-cuenta de la mesa...");
      await imprimirPrecuenta(mesa.atencionActual.id);
    } catch {
      // usePrinter ya maneja errores con toast
    }
  }

  async function solicitarCuenta(metodoPago?: string, nota?: string) {
    if (!mesa?.atencionActual) {
      return;
    }

    if (pendientes > 0) {
      toast.warning("Hay pedidos pendientes en cocina", {
        description: `Existen ${pendientes} pedido(s) pendientes de entrega. Confirma que salgan de cocina antes de solicitar la cuenta.`,
      });
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const metodo = metodoPago || metodoPagoSeleccionado || undefined;
      const obs = nota || observacionCuenta || undefined;

      const respuesta = await fetch(
        `/api/atenciones/${encodeURIComponent(
          mesa.atencionActual.id
        )}/solicitar-cuenta`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metodoPagoPrevisto: metodo,
            observacion: obs,
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
            "No se pudo solicitar la cuenta."
        );
      }

      setModalCuenta(false);
      setMensaje("Cuenta solicitada. Caja fue notificada.");
      toast.success("Cuenta solicitada a Caja", {
        description: `Mesa ${mesa.nombre} notificada a caja con método ${metodo ?? "Efectivo"}.`,
      });

      await sincronizar(false);
    } catch (
      errorDesconocido
    ) {
      const errorMsg =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Error solicitando la cuenta.";
      setError(errorMsg);
      toast.error("Error al solicitar cuenta", { description: errorMsg });
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
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-black text-white hover:bg-white/20 active:scale-95 transition"
            >
              <ArrowLeft
                size={18}
              />
              Mis Mesas
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
                <p className="text-[10px] text-slate-400 font-bold uppercase">
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

              <button
                type="button"
                onClick={() => setModalPedidos(true)}
                className="rounded-2xl bg-white/10 p-3 text-left transition hover:bg-white/15 active:scale-95 cursor-pointer"
                title="Ver pedidos de esta mesa"
              >
                <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-between">
                  <span>PEDIDOS</span>
                  <History size={12} className="text-sky-400" />
                </p>
                <p className="mt-1 text-xl font-black text-sky-300">
                  {pedidos.length}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setModalConsumo(true)}
                className="rounded-2xl bg-emerald-500/20 p-3 text-left transition hover:bg-emerald-500/30 active:scale-95 cursor-pointer"
                title="Ver consumo acumulado"
              >
                <p className="text-[10px] text-emerald-200 font-bold uppercase flex items-center justify-between">
                  <span>TOTAL</span>
                  <ReceiptText size={12} className="text-emerald-400" />
                </p>
                <p className="mt-1 text-lg font-black text-emerald-300">
                  {dinero(
                    mesa
                      .atencionActual
                      .total
                  )}
                </p>
              </button>
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
            {/* Pestañas de Acciones Rápidas: Ver Pedidos, Consumo y Cuenta */}
            <section className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModalPedidos(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 sm:p-3.5 text-xs sm:text-sm font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
              >
                <History
                  size={17}
                  className="text-sky-400 shrink-0"
                />
                <span className="truncate">Ver pedidos</span>
                {pedidos.length > 0 && (
                  <span className="hidden xs:inline-block rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-black text-sky-300">
                    {pedidos.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalConsumo(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 sm:p-3.5 text-xs sm:text-sm font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
              >
                <ReceiptText
                  size={17}
                  className="text-amber-400 shrink-0"
                />
                <span className="truncate">Consumo</span>
              </button>

              {!cuentaSolicitada ? (
                <button
                  type="button"
                  onClick={() => setModalCuenta(true)}
                  disabled={procesando}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-3 sm:p-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  <WalletCards size={17} className="shrink-0" />
                  <span className="truncate">Cuenta / Cobrar</span>
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-blue-950/80 border border-blue-800 p-3 sm:p-3.5 text-xs sm:text-sm font-black text-blue-300">
                  <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                  <span className="truncate">Cuenta Solicitada</span>
                </div>
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

      {/* Barra flotante inferior: Cuando hay productos en el carrito */}
      {cantidadCarrito > 0 &&
        puedePedir && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 p-3 sm:p-4 text-white shadow-2xl backdrop-blur-md">
          <div className="mx-auto max-w-6xl">
            {/* Lista de productos agregados */}
            <div className="mb-3 max-h-44 space-y-2 overflow-y-auto pr-1">
              {carrito.map(
                (item) => (
                  <div
                    key={
                      item.producto.id
                    }
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">
                        {
                          item.producto
                            .nombre
                        }
                      </p>
                      <p className="text-xs font-bold text-amber-400">
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
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
                      >
                        <Minus
                          size={15}
                        />
                      </button>

                      <span className="min-w-6 text-center font-black text-white">
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
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 transition hover:bg-amber-400 active:scale-95"
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

            {/* Fila de Resumen y Botones de Acción */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Total y contador de items */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:border-0 sm:pb-0 sm:justify-start gap-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShoppingCart size={18} className="text-amber-400" />
                  <span className="text-xs font-bold">
                    {cantidadCarrito} item{cantidadCarrito > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-right sm:text-left">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total a ordenar</p>
                  <p className="text-xl font-black text-emerald-400">
                    {dinero(totalCarrito)}
                  </p>
                </div>
              </div>

              {/* Botones de acción táctiles */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 flex-1 sm:justify-end">
                {/* Botón 3: Pre-cuenta rápida / Ver Consumo */}
                {mesa?.atencionActual && (
                  <button
                    type="button"
                    disabled={procesando || imprimiendo}
                    onClick={() => setModalConsumo(true)}
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-900/90 px-3.5 py-3 text-xs font-bold text-slate-200 shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                    title="Ver consumo y pre-cuenta"
                  >
                    <ReceiptText size={16} className="text-amber-400" />
                    <span>Pre-cuenta</span>
                  </button>
                )}

                {/* Botón 2: Solo Enviar */}
                <button
                  type="button"
                  disabled={procesando || imprimiendo}
                  onClick={() => enviarPedido(false)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-3.5 text-xs font-bold text-slate-200 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {procesando && !imprimiendo ? (
                    <LoaderCircle size={16} className="animate-spin text-slate-400" />
                  ) : (
                    <Send size={16} className="text-slate-400" />
                  )}
                  <span>Solo Enviar</span>
                </button>

                {/* Botón 1: Enviar e Imprimir */}
                <button
                  type="button"
                  disabled={procesando || imprimiendo}
                  onClick={() => enviarPedido(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {procesando || imprimiendo ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin text-slate-950" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={18} className="text-slate-950" />
                      <Send size={15} className="text-slate-950 -ml-1" />
                      <span>Enviar e Imprimir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra flotante inferior alternativa: Cuando NO hay productos en carrito pero la mesa tiene cuenta abierta */}
      {cantidadCarrito === 0 &&
        mesa?.atencionActual &&
        puedePedir && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/95 p-3 sm:p-4 text-white shadow-xl backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Consumo {mesa.nombre}
              </p>
              <p className="text-lg sm:text-xl font-black text-emerald-400">
                {dinero(mesa.atencionActual.total)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalPedidos(true)}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-xs font-bold text-slate-200 transition hover:bg-slate-800 active:scale-95"
              >
                <History size={16} className="text-sky-400" />
                <span className="hidden xs:inline">Ver Pedidos</span>
              </button>

              <button
                type="button"
                disabled={imprimiendo}
                onClick={() => setModalConsumo(true)}
                className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-4 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
              >
                <ReceiptText size={17} className="text-slate-950" />
                <span>Ver Consumo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: HISTORIAL DE PEDIDOS */}
      {modalPedidos && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setModalPedidos(false)}
        >
          <div
            className="max-h-[90vh] sm:max-h-[85vh] w-full sm:max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <History size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    {mesa.nombre} • {mesa.zona.nombre}
                  </p>
                  <h2 className="text-xl font-black text-white">
                    Pedidos a Cocina ({pedidos.length})
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPedidos(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {pedidos.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
                  <ReceiptText size={40} className="mx-auto text-slate-600 mb-2" />
                  <p className="font-bold">Aún no se han enviado pedidos a cocina.</p>
                  <p className="text-xs text-slate-500 mt-1">Selecciona platos de la carta y envíalos.</p>
                </div>
              ) : (
                pedidos.map((pedido) => {
                  const badge = estadoBadgeInfo(pedido.estado);
                  return (
                    <article
                      key={pedido.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-white">
                            {pedido.numero}
                          </span>
                          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          {pedido.origen === "CLIENTE_QR" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              📱 QR
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={imprimiendo}
                            onClick={() => imprimirComandaCocina(pedido.id)}
                            className="flex items-center gap-1 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 px-2.5 py-1.5 transition active:scale-95 disabled:opacity-50"
                            title="Reimprimir comanda"
                          >
                            <Printer size={13} />
                            <span>Comanda</span>
                          </button>
                          <span className="font-black text-emerald-400 text-sm">
                            {dinero(pedido.subtotal)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5">
                        {pedido.detalles.map((detalle) => (
                          <div
                            key={detalle.id}
                            className="flex items-start justify-between gap-2 text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-white mr-1.5">
                                {Number(detalle.cantidad)} ×
                              </span>
                              <span className="text-slate-300">
                                {detalle.producto.nombre}
                              </span>
                              {detalle.observacion && (
                                <p className="text-xs text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                                  <span>↳ Obs:</span> {detalle.observacion}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-slate-400 text-xs shrink-0">
                              {dinero(detalle.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-4 bg-slate-900/80 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total en pedidos</p>
                <p className="text-lg font-black text-emerald-400">
                  {dinero(mesa.atencionActual?.total)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalPedidos(false)}
                className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-black text-white transition active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONSUMO ACUMULADO (PRE-CUENTA DETALLADA) */}
      {modalConsumo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setModalConsumo(false)}
        >
          <div
            className="max-h-[90vh] sm:max-h-[85vh] w-full sm:max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    {mesa.nombre} • Atención {mesa.atencionActual?.codigo}
                  </p>
                  <h2 className="text-xl font-black text-white">
                    Consumo Acumulado
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConsumo(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {consumoConsolidado.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
                  <ReceiptText size={40} className="mx-auto text-slate-600 mb-2" />
                  <p className="font-bold">Sin consumo registrado aún.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <tr>
                        <th className="py-3 px-4">Cant. / Producto</th>
                        <th className="py-3 px-3 text-right">P. Unit</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {consumoConsolidado.map((item) => (
                        <tr key={item.productoId} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">
                              <span className="text-amber-400 font-black mr-2">
                                {item.cantidad}×
                              </span>
                              {item.nombre}
                            </div>
                            {item.observaciones.length > 0 && (
                              <p className="text-xs text-amber-400/90 mt-0.5">
                                Nota: {item.observaciones.join(", ")}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-400 font-medium">
                            {dinero(item.precioUnitario)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-400">
                            {dinero(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resumen Totales */}
              {mesa.atencionActual && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-200">
                      {dinero(mesa.atencionActual.subtotal)}
                    </span>
                  </div>
                  {Number(mesa.atencionActual.descuento) > 0 && (
                    <div className="flex justify-between text-xs text-amber-400">
                      <span>Descuento:</span>
                      <span className="font-bold">
                        -{dinero(mesa.atencionActual.descuento)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                    <span className="font-black text-base text-white">TOTAL CONSUMO:</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {dinero(mesa.atencionActual.total)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-4 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                disabled={imprimiendo || !mesa.atencionActual}
                onClick={handleImprimirPrecuenta}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 px-5 font-black text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50 text-sm"
              >
                {imprimiendo ? (
                  <LoaderCircle size={18} className="animate-spin text-slate-950" />
                ) : (
                  <Printer size={18} className="text-slate-950" />
                )}
                <span>Imprimir Pre-cuenta</span>
              </button>

              <button
                type="button"
                onClick={() => setModalConsumo(false)}
                className="w-full sm:w-auto rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3.5 px-5 text-sm font-bold text-slate-200 transition active:scale-95"
              >
                Continuar atendiendo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CIERRE DE CUENTA / COBRO */}
      {modalCuenta && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setModalCuenta(false)}
        >
          <div
            className="max-h-[92vh] sm:max-h-[85vh] w-full sm:max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <WalletCards size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    {mesa.nombre}
                  </p>
                  <h2 className="text-xl font-black text-white">
                    Cierre de Cuenta / Cobro
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCuenta(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Total Box */}
              <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/60 to-slate-900 p-4 text-center">
                <p className="text-xs uppercase font-bold text-blue-300">Total a Pagar</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">
                  {dinero(mesa.atencionActual?.total)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {mesa.atencionActual?.cantidadPersonas} comensales • {pedidos.length} pedidos
                </p>
              </div>

              {/* Alerta si hay pedidos pendientes en cocina */}
              {pendientes > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-amber-300">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-400" />
                  <div className="text-xs">
                    <p className="font-bold">Hay {pendientes} pedido(s) pendientes en cocina</p>
                    <p className="text-amber-300/80 mt-0.5">
                      Debes confirmar que cocina haya terminado de preparar y entregar antes de cerrar la cuenta.
                    </p>
                  </div>
                </div>
              )}

              {/* Selector de Método de Pago Previsto */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Método de Pago Solicitado:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "EFECTIVO", label: "Efectivo", icon: "💵" },
                    { id: "YAPE", label: "Yape", icon: "📱" },
                    { id: "PLIN", label: "Plin", icon: "📱" },
                    { id: "TARJETA", label: "Tarjeta", icon: "💳" },
                  ].map((metodo) => {
                    const seleccionado = metodoPagoSeleccionado === metodo.id;
                    return (
                      <button
                        key={metodo.id}
                        type="button"
                        onClick={() => setMetodoPagoSeleccionado(metodo.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition active:scale-95 ${
                          seleccionado
                            ? "border-amber-500 bg-amber-500/15 text-white shadow-sm"
                            : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{metodo.icon}</span>
                          <span className="font-bold text-sm">{metodo.label}</span>
                        </div>
                        {seleccionado && (
                          <Check size={16} className="text-amber-400 font-black" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observación / Nota para caja */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Nota para Caja (Opcional):
                </label>
                <input
                  type="text"
                  value={observacionCuenta}
                  onChange={(e) => setObservacionCuenta(e.target.value)}
                  placeholder="Ej: Paga con billete de 100, etc."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-4 bg-slate-900/90 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={procesando || pendientes > 0}
                onClick={() => solicitarCuenta()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3.5 px-5 font-black text-white shadow-lg shadow-blue-500/20 transition active:scale-95 disabled:opacity-50 text-sm"
              >
                {procesando ? (
                  <LoaderCircle size={18} className="animate-spin text-white" />
                ) : (
                  <Send size={18} className="text-white" />
                )}
                <span>Solicitar Cuenta a Caja</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={imprimiendo}
                  onClick={handleImprimirPrecuenta}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2.5 px-4 text-xs font-bold text-amber-400 transition active:scale-95 disabled:opacity-50"
                >
                  <Printer size={15} />
                  <span>Imprimir Pre-cuenta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalCuenta(false)}
                  className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 py-2.5 px-4 text-xs font-bold text-slate-300 transition active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ThermalReceiptModal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        ticketHtml={ultimoResultado?.ticketHtml || ""}
        titulo={ultimoResultado?.titulo || "Ticket de Atención"}
        paperWidth={ultimoResultado?.paperWidth || "80mm"}
        networkPrinted={ultimoResultado?.networkPrinted}
        networkError={ultimoResultado?.error}
      />
    </main>
  );
}
