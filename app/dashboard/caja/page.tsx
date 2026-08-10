"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FilePlus2,
  LoaderCircle,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Store,
  Trash2,
  UserRound,
  MapPin,
  WalletCards,
  X,
} from "lucide-react";

import {
  type CuentaCaja,
  useCaja,
} from "@/hooks/useCaja";

type MetodoCaja =
  | "EFECTIVO"
  | "YAPE"
  | "PLIN"
  | "TARJETA";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type NotaVentaCaja = {
  id: string;
  numero: string;
  atencionId: string;
  total: string | number;
  fechaEmision: string;
};

const METODOS: Array<{
  id: MetodoCaja;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
}> = [
  {
    id: "EFECTIVO",
    nombre: "Efectivo",
    descripcion:
      "Calcula vuelto automáticamente.",
    icono: <Banknote size={22} />,
  },

  {
    id: "YAPE",
    nombre: "Yape",
    descripcion:
      "Pago mediante Yape.",
    icono: <QrCode size={22} />,
  },

  {
    id: "PLIN",
    nombre: "Plin",
    descripcion:
      "Pago mediante Plin.",
    icono: <QrCode size={22} />,
  },

  {
    id: "TARJETA",
    nombre: "Tarjeta",
    descripcion:
      "Débito o crédito.",
    icono: <CreditCard size={22} />,
  },
];

function formatearHora(
  fecha: string | null
) {
  if (!fecha) {
    return "--";
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone:
        "America/Lima",
    }
  ).format(new Date(fecha));
}

function totalPagado(
  cuenta: CuentaCaja
) {
  return cuenta.pagos.reduce(
    (total, pago) =>
      total + pago.monto,
    0
  );
}

export default function CajaPage() {
  const {
    cuentas,
    cuentaSeleccionada,
    cargando,
    procesando,
    mensaje,
    error,
    recargar,
    seleccionarCuenta,
    registrarPago,
    liberarMesa,
    limpiarMensajes,
  } = useCaja();

  const [
    metodo,
    setMetodo,
  ] =
    useState<MetodoCaja>(
      "EFECTIVO"
    );

  const [
    montoRecibido,
    setMontoRecibido,
  ] = useState("");

  const [
    referencia,
    setReferencia,
  ] = useState("");

  const [
    observacion,
    setObservacion,
  ] = useState("");

  const [
    mostrarTicket,
    setMostrarTicket,
  ] = useState(false);

  const [
    notaVenta,
    setNotaVenta,
  ] = useState<NotaVentaCaja | null>(
    null
  );

  const [
    generandoNota,
    setGenerandoNota,
  ] = useState(false);

  const [
    mensajeNota,
    setMensajeNota,
  ] = useState("");

  const [
    mostrarFormularioNota,
    setMostrarFormularioNota,
  ] = useState(false);

  const [
    clienteNombre,
    setClienteNombre,
  ] = useState("");

  const [
    clienteDocumento,
    setClienteDocumento,
  ] = useState("");

  const [
    clienteDireccion,
    setClienteDireccion,
  ] = useState("");

  const cuentasPendientes =
    cuentas.filter(
      (cuenta) =>
        cuenta.estado ===
        "SOLICITO_CUENTA"
    );

  const cuentasPagadas =
    cuentas.filter(
      (cuenta) =>
        cuenta.estado ===
        "PAGADA"
    );

  const saldoPendiente =
    useMemo(() => {
      if (
        !cuentaSeleccionada
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.round(
          (cuentaSeleccionada.total -
            totalPagado(
              cuentaSeleccionada
            )) *
            100
        ) / 100
      );
    }, [cuentaSeleccionada]);

  const vuelto =
    useMemo(() => {
      if (
        metodo !==
          "EFECTIVO" ||
        !montoRecibido
      ) {
        return 0;
      }

      const recibido =
        Number(montoRecibido);

      if (
        !Number.isFinite(
          recibido
        )
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.round(
          (recibido -
            saldoPendiente) *
            100
        ) / 100
      );
    }, [
      metodo,
      montoRecibido,
      saldoPendiente,
    ]);

  async function cobrar() {
    if (
      !cuentaSeleccionada
    ) {
      return;
    }

    const confirmado =
      window.confirm(
        `¿Registrar el pago de ${cuentaSeleccionada.mesa.nombre} por S/ ${saldoPendiente.toFixed(
          2
        )}?`
      );

    if (!confirmado) {
      return;
    }

    const resultado =
      await registrarPago({
        atencionId:
          cuentaSeleccionada.id,

        metodo,

        monto:
          saldoPendiente,

        montoRecibido:
          metodo ===
          "EFECTIVO"
            ? Number(
                montoRecibido
              )
            : undefined,

        referencia:
          referencia.trim() ||
          undefined,

        observacion:
          observacion.trim() ||
          undefined,
      });

    if (!resultado) {
      return;
    }

    setMontoRecibido("");
    setReferencia("");
    setObservacion("");
  }

  async function generarNotaVenta() {
    if (
      !cuentaSeleccionada ||
      cuentaSeleccionada.estado !==
        "PAGADA"
    ) {
      return;
    }

    try {
      setGenerandoNota(
        true
      );

      setMensajeNota(
        ""
      );

      const respuesta =
        await fetch(
          "/api/comprobantes",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                atencionId:
                  cuentaSeleccionada.id,

                clienteNombre:
                  clienteNombre.trim() ||
                  undefined,

                clienteDocumento:
                  clienteDocumento.trim() ||
                  undefined,

                clienteDireccion:
                  clienteDireccion.trim() ||
                  undefined,
              }),
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<NotaVentaCaja>;

      if (
        !respuesta.ok ||
        !resultado.success ||
        !resultado.data
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo generar la Nota de Venta."
        );
      }

      setNotaVenta(
        resultado.data
      );

      setMensajeNota(
        `Nota de Venta ${resultado.data.numero} generada correctamente.`
      );

      setMostrarFormularioNota(
        false
      );

      setClienteNombre(
        ""
      );

      setClienteDocumento(
        ""
      );

      setClienteDireccion(
        ""
      );
    } catch (
      errorDesconocido
    ) {
      setMensajeNota(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo generar la Nota de Venta."
      );
    } finally {
      setGenerandoNota(
        false
      );
    }
  }

  function abrirNotaVenta() {
    if (!notaVenta) {
      return;
    }

    window.location.href =
      `/dashboard/comprobantes`;
  }

  function imprimirTicket() {
    if (!cuentaSeleccionada) {
      return;
    }

    const pago =
      cuentaSeleccionada.pagos[
        cuentaSeleccionada.pagos.length - 1
      ];

    const filas =
      cuentaSeleccionada.pedidos
        .flatMap((pedido) =>
          pedido.detalles.map(
            (detalle) => `
              <tr>
                <td style="padding:4px 0;">
                  ${detalle.cantidad} x ${detalle.producto.nombre}
                </td>
                <td style="padding:4px 0;text-align:right;">
                  S/ ${detalle.subtotal.toFixed(2)}
                </td>
              </tr>
            `
          )
        )
        .join("");

    const ventana =
      window.open(
        "",
        "_blank",
        "width=420,height=700"
      );

    if (!ventana) {
      return;
    }

    ventana.document.write(`
      <html>
        <head>
          <title>Ticket ${cuentaSeleccionada.codigo}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:20px;color:#111827}
            h1,p{margin:0}
            .center{text-align:center}
            .muted{color:#6b7280;font-size:12px}
            .line{border-top:1px dashed #9ca3af;margin:14px 0}
            table{width:100%;border-collapse:collapse;font-size:13px}
            .total{font-size:20px;font-weight:800;display:flex;justify-content:space-between}
          </style>
        </head>
        <body>
          <div class="center">
            <h1>CHINKA CHINKA</h1>
            <p class="muted">Donde te pierdes con el buen sabor</p>
          </div>

          <div class="line"></div>

          <p><strong>Mesa:</strong> ${cuentaSeleccionada.mesa.nombre}</p>
          <p><strong>Atención:</strong> ${cuentaSeleccionada.codigo}</p>

          <div class="line"></div>

          <table><tbody>${filas}</tbody></table>

          <div class="line"></div>

          <div class="total">
            <span>TOTAL</span>
            <span>S/ ${cuentaSeleccionada.total.toFixed(2)}</span>
          </div>

          <div class="line"></div>

          <p><strong>Método:</strong> ${pago?.metodo ?? "--"}</p>
          ${
            pago?.referencia
              ? `<p><strong>Referencia:</strong> ${pago.referencia}</p>`
              : ""
          }

          <div class="line"></div>
          <p class="center muted">Gracias por su visita</p>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();

    window.setTimeout(
      () => {
        ventana.print();
      },
      300
    );
  }

  async function confirmarLiberacion() {
    if (
      !cuentaSeleccionada
    ) {
      return;
    }

    const confirmar =
      window.confirm(
        `¿Liberar ${cuentaSeleccionada.mesa.nombre}? La atención quedará cerrada y la mesa volverá a estar disponible.`
      );

    if (!confirmar) {
      return;
    }

    await liberarMesa(
      cuentaSeleccionada.id
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                Restaurante
                Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <CircleDollarSign
                  size={38}
                />
                Caja
              </h1>

              <p className="mt-3 text-slate-300">
                Cobro de cuentas
                solicitadas y liberación
                de mesas.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/20"
              >
                <ArrowLeft
                  size={19}
                />
                Volver
              </Link>

              <button
                type="button"
                onClick={recargar}
                disabled={cargando}
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 disabled:opacity-50"
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

        {(mensaje || error) && (
          <div
            className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${
              mensaje
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {mensaje ? (
                <CheckCircle2
                  size={21}
                />
              ) : (
                <AlertCircle
                  size={21}
                />
              )}

              <p className="font-bold">
                {mensaje || error}
              </p>
            </div>

            <button
              type="button"
              onClick={
                limpiarMensajes
              }
              className="rounded-lg px-3 py-1 text-sm font-black hover:bg-black/5"
            >
              Cerrar
            </button>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Cuentas en Caja
                </p>

                <p className="mt-1 text-3xl font-black text-slate-950">
                  {cuentas.length}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                    Por cobrar:{" "}
                    {cuentasPendientes.length}
                  </span>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                    Pagadas:{" "}
                    {cuentasPagadas.length}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <ReceiptText
                  size={25}
                />
              </div>
            </div>

            {cargando ? (
              <div className="flex min-h-60 items-center justify-center">
                <LoaderCircle
                  size={36}
                  className="animate-spin text-emerald-600"
                />
              </div>
            ) : cuentas.length ===
              0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
                <Store
                  size={42}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 font-black text-slate-700">
                  No hay cuentas
                  pendientes
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Aparecerán aquí cuando
                  una mesa solicite la
                  cuenta.
                </p>
              </div>
            ) : (
              <div className="mt-5 max-h-[650px] space-y-3 overflow-y-auto pr-1">
                {cuentas.map(
                  (cuenta) => {
                    const activa =
                      cuentaSeleccionada
                        ?.id ===
                      cuenta.id;

                    const pagada =
                      cuenta.estado ===
                      "PAGADA";

                    return (
                      <button
                        key={cuenta.id}
                        type="button"
                        onClick={async () => {
                          seleccionarCuenta(
                            cuenta.id
                          );
                          setMontoRecibido(
                            ""
                          );
                          setReferencia(
                            ""
                          );
                          setNotaVenta(
                            null
                          );
                          setMensajeNota(
                            ""
                          );

                          setMostrarFormularioNota(
                            false
                          );
                          setClienteNombre(
                            ""
                          );
                          setClienteDocumento(
                            ""
                          );
                          setClienteDireccion(
                            ""
                          );

                          if (
                            cuenta.estado ===
                            "PAGADA"
                          ) {
                            try {
                              const respuesta =
                                await fetch(
                                  "/api/comprobantes",
                                  {
                                    method:
                                      "GET",
                                    cache:
                                      "no-store",
                                  }
                                );

                              const resultado =
                                (await respuesta.json()) as ApiResponse<
                                  NotaVentaCaja[]
                                >;

                              if (
                                respuesta.ok &&
                                resultado.success
                              ) {
                                const existente =
                                  (
                                    resultado.data ??
                                    []
                                  ).find(
                                    (nota) =>
                                      nota.atencionId ===
                                      cuenta.id
                                  );

                                if (
                                  existente
                                ) {
                                  setNotaVenta(
                                    existente
                                  );
                                }
                              }
                            } catch {
                              // Si falla esta consulta, todavía se puede intentar generar.
                            }
                          }
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          activa
                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase text-slate-500">
                              {
                                cuenta
                                  .mesa
                                  .zona
                                  .nombre
                              }
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-slate-950">
                              {
                                cuenta
                                  .mesa
                                  .nombre
                              }
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                cuenta.codigo
                              }
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-xl font-black ${
                                pagada
                                  ? "text-emerald-600"
                                  : "text-slate-950"
                              }`}
                            >
                              S/{" "}
                              {cuenta.total.toFixed(2)}
                            </p>

                            <span
                              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-black ${
                                pagada
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {pagada
                                ? "PAGADA"
                                : "POR COBRAR"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Clock3
                            size={15}
                          />
                          Cuenta solicitada{" "}
                          {formatearHora(
                            cuenta.fechaSolicitudCuenta
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </aside>

          {!cuentaSeleccionada ? (
            <section className="flex min-h-[600px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div>
                <WalletCards
                  size={60}
                  className="mx-auto text-slate-300"
                />

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  Selecciona una cuenta
                </h2>

                <p className="mt-2 text-slate-500">
                  Elige una mesa de la
                  lista para procesar su
                  pago.
                </p>
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                      Cuenta seleccionada
                    </p>

                    <h2 className="mt-1 text-4xl font-black text-slate-950">
                      {
                        cuentaSeleccionada
                          .mesa.nombre
                      }
                    </h2>

                    <p className="mt-2 text-slate-500">
                      {
                        cuentaSeleccionada
                          .codigo
                      }
                      {" · "}
                      {
                        cuentaSeleccionada
                          .mesa.zona
                          .nombre
                      }
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-950 px-6 py-5 text-white">
                    <p className="text-sm font-bold text-slate-400">
                      Saldo pendiente
                    </p>

                    <p className="mt-1 text-4xl font-black">
                      S/{" "}
                      {saldoPendiente.toFixed(
                        2
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <h3 className="text-xl font-black text-slate-950">
                    Detalle de consumo
                  </h3>

                  <div className="mt-5 space-y-5">
                    {cuentaSeleccionada.pedidos.map(
                      (pedido) => (
                        <article
                          key={
                            pedido.id
                          }
                          className="rounded-2xl border border-slate-200"
                        >
                          <header className="flex items-center justify-between bg-slate-50 px-4 py-3">
                            <div>
                              <p className="text-xs font-black uppercase text-amber-600">
                                {
                                  pedido.numero
                                }
                              </p>

                              <p className="text-sm font-bold text-slate-500">
                                {
                                  pedido.estado
                                }
                              </p>
                            </div>

                            <p className="font-black">
                              S/{" "}
                              {pedido.subtotal.toFixed(
                                2
                              )}
                            </p>
                          </header>

                          <div className="divide-y divide-slate-100">
                            {pedido.detalles.map(
                              (
                                detalle
                              ) => (
                                <div
                                  key={
                                    detalle.id
                                  }
                                  className="grid grid-cols-[45px_1fr_auto] gap-3 p-4"
                                >
                                  <span className="font-black">
                                    {
                                      detalle.cantidad
                                    }
                                    ×
                                  </span>

                                  <div>
                                    <p className="font-bold text-slate-900">
                                      {
                                        detalle
                                          .producto
                                          .nombre
                                      }
                                    </p>

                                    {detalle.observacion && (
                                      <p className="mt-1 text-xs font-bold text-amber-700">
                                        {
                                          detalle.observacion
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <p className="font-black">
                                    S/{" "}
                                    {detalle.subtotal.toFixed(
                                      2
                                    )}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </article>
                      )
                    )}
                  </div>

                  <div className="mt-6 space-y-3 border-t-2 border-dashed border-slate-300 pt-5">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">
                        Subtotal
                      </span>

                      <span className="font-black">
                        S/{" "}
                        {cuentaSeleccionada.subtotal.toFixed(
                          2
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">
                        Descuento
                      </span>

                      <span className="font-black">
                        S/{" "}
                        {cuentaSeleccionada.descuento.toFixed(
                          2
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 pt-4">
                      <span className="text-xl font-black">
                        TOTAL
                      </span>

                      <span className="text-3xl font-black text-emerald-600">
                        S/{" "}
                        {cuentaSeleccionada.total.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
                  <h3 className="text-xl font-black text-slate-950">
                    Registrar pago
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Selecciona cómo pagará
                    el cliente.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {METODOS.map(
                      (item) => (
                        <button
                          key={
                            item.id
                          }
                          type="button"
                          onClick={() => {
                            setMetodo(
                              item.id
                            );

                            setMontoRecibido(
                              ""
                            );

                            setReferencia(
                              ""
                            );
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            metodo ===
                            item.id
                              ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                              : "border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-black text-slate-900">
                            {
                              item.icono
                            }
                            {
                              item.nombre
                            }
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            {
                              item.descripcion
                            }
                          </p>
                        </button>
                      )
                    )}
                  </div>

                  {metodo ===
                    "EFECTIVO" && (
                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Monto recibido
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500">
                          S/
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            montoRecibido
                          }
                          onChange={(
                            evento
                          ) =>
                            setMontoRecibido(
                              evento.target
                                .value
                            )
                          }
                          placeholder="100.00"
                          className="w-full rounded-2xl border border-slate-300 py-3.5 pl-11 pr-4 text-xl font-black outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>

                      <div className="mt-3 rounded-2xl bg-emerald-50 p-4">
                        <p className="text-sm font-bold text-emerald-700">
                          Vuelto
                        </p>

                        <p className="mt-1 text-3xl font-black text-emerald-800">
                          S/{" "}
                          {vuelto.toFixed(
                            2
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {(metodo ===
                    "YAPE" ||
                    metodo ===
                      "PLIN" ||
                    metodo ===
                      "TARJETA") && (
                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Referencia
                        opcional
                      </label>

                      <input
                        value={
                          referencia
                        }
                        onChange={(
                          evento
                        ) =>
                          setReferencia(
                            evento.target
                              .value
                          )
                        }
                        placeholder={
                          metodo ===
                          "TARJETA"
                            ? "Operación / voucher"
                            : "N.º operación"
                        }
                        maxLength={
                          100
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                  )}

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Observación
                    </label>

                    <textarea
                      rows={3}
                      value={
                        observacion
                      }
                      onChange={(
                        evento
                      ) =>
                        setObservacion(
                          evento.target
                            .value
                        )
                      }
                      placeholder="Opcional..."
                      className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400">
                        A cobrar
                      </span>

                      <span className="text-3xl font-black">
                        S/{" "}
                        {saldoPendiente.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>

                  {cuentaSeleccionada.estado ===
                  "PAGADA" ? (
                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                        <CheckCircle2
                          size={28}
                          className="mx-auto text-emerald-600"
                        />

                        <p className="mt-2 text-lg font-black text-emerald-800">
                          Pago completado
                        </p>
                      </div>

                      {mensajeNota && (
                        <div
                          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                            notaVenta
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {mensajeNota}
                        </div>
                      )}

                      {notaVenta ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                            Nota de Venta generada
                          </p>

                          <p className="mt-1 text-2xl font-black text-slate-950">
                            {notaVenta.numero}
                          </p>

                          <button
                            type="button"
                            onClick={
                              abrirNotaVenta
                            }
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950 transition hover:bg-amber-400"
                          >
                            <ReceiptText
                              size={18}
                            />
                            Ver en Comprobantes
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setMostrarFormularioNota(
                              true
                            )
                          }
                          disabled={
                            generandoNota
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                        >
                          <FilePlus2
                            size={20}
                          />

                          Generar Nota de Venta
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarTicket(true)
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800"
                      >
                        <ReceiptText size={20} />
                        Ver ticket
                      </button>

                      <button
                        type="button"
                        onClick={
                          imprimirTicket
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition hover:bg-emerald-500"
                      >
                        <Printer size={20} />
                        Imprimir ticket
                      </button>

                      <button
                        type="button"
                        onClick={
                          confirmarLiberacion
                        }
                        disabled={
                          procesando
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-black text-white transition hover:bg-violet-500 disabled:opacity-50"
                      >
                        {procesando ? (
                          <LoaderCircle
                            size={20}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={20} />
                        )}

                        Liberar mesa
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        cobrar
                      }
                      disabled={
                        procesando ||
                        saldoPendiente <=
                          0
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {procesando ? (
                        <>
                          <LoaderCircle
                            size={
                              20
                            }
                            className="animate-spin"
                          />

                          Procesando...
                        </>
                      ) : (
                        <>
                          <CircleDollarSign
                            size={
                              20
                            }
                          />

                          COBRAR
                        </>
                      )}
                    </button>
                  )}
                </aside>
              </div>
            </section>
          )}
        </section>
      </div>

      {mostrarFormularioNota &&
        cuentaSeleccionada && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
              <header className="flex items-start justify-between border-b border-slate-200 p-5 md:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                    Nota de Venta
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    Datos del cliente
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Los campos son opcionales. Si los dejas vacíos, se emitirá para Cliente general.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarFormularioNota(
                      false
                    )
                  }
                  disabled={
                    generandoNota
                  }
                  className="rounded-xl bg-slate-100 p-2.5 text-slate-600 disabled:opacity-50"
                >
                  <X
                    size={20}
                  />
                </button>
              </header>

              <div className="space-y-5 p-5 md:p-6">
                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {cuentaSeleccionada.mesa.nombre}
                      </p>

                      <p className="mt-1 font-black">
                        {cuentaSeleccionada.codigo}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400">
                        Total
                      </p>

                      <p className="mt-1 text-3xl font-black text-amber-400">
                        S/{" "}
                        {cuentaSeleccionada.total.toFixed(
                          2
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                    <UserRound
                      size={17}
                    />
                    Nombre del cliente
                  </label>

                  <input
                    value={
                      clienteNombre
                    }
                    onChange={(
                      evento
                    ) =>
                      setClienteNombre(
                        evento.target.value
                      )
                    }
                    maxLength={
                      200
                    }
                    placeholder="Ej. Juan Pérez"
                    disabled={
                      generandoNota
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Documento
                  </label>

                  <input
                    value={
                      clienteDocumento
                    }
                    onChange={(
                      evento
                    ) =>
                      setClienteDocumento(
                        evento.target.value
                      )
                    }
                    maxLength={
                      20
                    }
                    placeholder="DNI / RUC / otro"
                    disabled={
                      generandoNota
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                    <MapPin
                      size={17}
                    />
                    Dirección
                  </label>

                  <textarea
                    rows={3}
                    value={
                      clienteDireccion
                    }
                    onChange={(
                      evento
                    ) =>
                      setClienteDireccion(
                        evento.target.value
                      )
                    }
                    maxLength={
                      300
                    }
                    placeholder="Dirección opcional..."
                    disabled={
                      generandoNota
                    }
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:bg-slate-100"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMostrarFormularioNota(
                        false
                      )
                    }
                    disabled={
                      generandoNota
                    }
                    className="rounded-2xl bg-slate-100 px-5 py-4 font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={
                      generarNotaVenta
                    }
                    disabled={
                      generandoNota
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    {generandoNota ? (
                      <>
                        <LoaderCircle
                          size={20}
                          className="animate-spin"
                        />
                        Generando...
                      </>
                    ) : (
                      <>
                        <FilePlus2
                          size={20}
                        />
                        Generar Nota
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {mostrarTicket &&
        cuentaSeleccionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                    Ticket interno
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {cuentaSeleccionada.codigo}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarTicket(false)
                  }
                  className="rounded-xl bg-slate-100 p-2.5 text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-slate-950">
                    CHINKA CHINKA
                  </h3>

                  <p className="mt-1 text-sm italic text-slate-500">
                    Donde te pierdes con el buen sabor
                  </p>
                </div>

                <div className="my-5 border-t border-dashed border-slate-300" />

                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Mesa:</strong>{" "}
                    {cuentaSeleccionada.mesa.nombre}
                  </p>

                  <p>
                    <strong>Atención:</strong>{" "}
                    {cuentaSeleccionada.codigo}
                  </p>

                  <p>
                    <strong>Zona:</strong>{" "}
                    {cuentaSeleccionada.mesa.zona.nombre}
                  </p>
                </div>

                <div className="my-5 border-t border-dashed border-slate-300" />

                <div className="space-y-3">
                  {cuentaSeleccionada.pedidos.flatMap(
                    (pedido) =>
                      pedido.detalles.map(
                        (detalle) => (
                          <div
                            key={detalle.id}
                            className="flex items-start justify-between gap-4 text-sm"
                          >
                            <p className="font-bold text-slate-900">
                              {detalle.cantidad} ×{" "}
                              {detalle.producto.nombre}
                            </p>

                            <p className="font-black text-slate-950">
                              S/ {detalle.subtotal.toFixed(2)}
                            </p>
                          </div>
                        )
                      )
                  )}
                </div>

                <div className="my-5 border-t border-dashed border-slate-300" />

                <div className="flex items-center justify-between text-xl font-black">
                  <span>TOTAL</span>

                  <span className="text-emerald-600">
                    S/ {cuentaSeleccionada.total.toFixed(2)}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
                  <p>
                    <strong>Método:</strong>{" "}
                    {cuentaSeleccionada.pagos[
                      cuentaSeleccionada.pagos.length - 1
                    ]?.metodo ?? "--"}
                  </p>

                  {cuentaSeleccionada.pagos[
                    cuentaSeleccionada.pagos.length - 1
                  ]?.referencia && (
                    <p className="mt-1">
                      <strong>Referencia:</strong>{" "}
                      {
                        cuentaSeleccionada.pagos[
                          cuentaSeleccionada.pagos.length - 1
                        ]?.referencia
                      }
                    </p>
                  )}
                </div>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Gracias por su visita
                </p>

                <button
                  type="button"
                  onClick={
                    imprimirTicket
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition hover:bg-emerald-500"
                >
                  <Printer size={20} />
                  Imprimir ticket
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}