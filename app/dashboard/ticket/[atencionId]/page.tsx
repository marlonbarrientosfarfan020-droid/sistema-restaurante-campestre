"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  CircleDollarSign,
  Clock3,
  CreditCard,
  LoaderCircle,
  Plus,
  Printer,
  ReceiptText,
  RefreshCcw,
  ShoppingBasket,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { useParams } from "next/navigation";

type DetalleTicket = {
  id: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  estado: string;
  observacion: string | null;

  producto: {
    id: string;
    codigo: string;
    nombre: string;
    imagenUrl: string | null;
  };
};

type PedidoTicket = {
  id: string;
  numero: string;
  origen: string;
  estado: string;
  observacion: string | null;
  subtotal: number;
  fechaPedido: string;
  detalles: DetalleTicket[];
};

type TicketData = {
  atencion: {
    id: string;
    codigo: string;
    estado: string;

    cantidadPersonas: number;

    metodoPagoPrevisto:
      | string
      | null;

    observacion:
      | string
      | null;

    subtotal: number;
    descuento: number;
    total: number;

    fechaApertura: string;

    fechaSolicitudCuenta:
      | string
      | null;

    fechaPago:
      | string
      | null;

    mesa: {
      id: string;
      numero: number;
      nombre: string;

      zona: {
        id: string;
        nombre: string;
      };
    };

    mozo: {
      id: string;
      nombres: string;
      apellidos: string;
    } | null;
  };

  pedidos: PedidoTicket[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

function formatearHora(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Lima",
    }
  ).format(
    new Date(fecha)
  );
}

function formatearMetodoPago(
  metodo: string | null
) {
  if (!metodo) {
    return "No indicado";
  }

  const metodos: Record<
    string,
    string
  > = {
    EFECTIVO: "Efectivo",
    YAPE: "Yape",
    PLIN: "Plin",
    TARJETA: "Tarjeta",
    MIXTO: "Pago mixto",
  };

  return metodos[metodo] ?? metodo;
}

function estadoPedidoVisual(
  estado: string
) {
  const estados: Record<
    string,
    {
      texto: string;
      clases: string;
    }
  > = {
    NUEVO: {
      texto: "Nuevo",
      clases:
        "bg-orange-100 text-orange-700",
    },

    RECIBIDO: {
      texto: "Recibido",
      clases:
        "bg-sky-100 text-sky-700",
    },

    PREPARANDO: {
      texto: "Preparando",
      clases:
        "bg-amber-100 text-amber-700",
    },

    LISTO: {
      texto: "Listo",
      clases:
        "bg-blue-100 text-blue-700",
    },

    EN_ENTREGA: {
      texto: "En entrega",
      clases:
        "bg-violet-100 text-violet-700",
    },

    ENTREGADO: {
      texto: "Entregado",
      clases:
        "bg-emerald-100 text-emerald-700",
    },
  };

  return (
    estados[estado] ?? {
      texto: estado,
      clases:
        "bg-slate-100 text-slate-700",
    }
  );
}

export default function TicketPage() {
  const params = useParams<{
    atencionId: string;
  }>();

  const atencionId =
    params.atencionId;

  const [ticket, setTicket] =
    useState<TicketData | null>(
      null
    );

  const [cargando, setCargando] =
    useState(true);

  const [
    solicitandoCuenta,
    setSolicitandoCuenta,
  ] = useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const cargarTicket =
    useCallback(async () => {
      if (!atencionId) {
        return;
      }

      try {
        setCargando(true);
        setError("");

        const respuesta =
          await fetch(
            `/api/pedidos/atencion/${encodeURIComponent(
              atencionId
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<TicketData>;

        if (
          !respuesta.ok ||
          !resultado.success ||
          !resultado.data
        ) {
          throw new Error(
            resultado.message ||
              "No se pudo cargar el ticket."
          );
        }

        setTicket(
          resultado.data
        );
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof
            Error
            ? errorDesconocido.message
            : "No se pudo cargar el ticket."
        );
      } finally {
        setCargando(false);
      }
    }, [atencionId]);

  useEffect(() => {
    cargarTicket();
  }, [cargarTicket]);

  const resumen =
    useMemo(() => {
      if (!ticket) {
        return {
          unidades: 0,
          pedidos: 0,
        };
      }

      const unidades =
        ticket.pedidos.reduce(
          (
            acumuladoPedidos,
            pedido
          ) =>
            acumuladoPedidos +
            pedido.detalles.reduce(
              (
                acumuladoDetalles,
                detalle
              ) =>
                acumuladoDetalles +
                detalle.cantidad,
              0
            ),
          0
        );

      return {
        unidades,
        pedidos:
          ticket.pedidos.length,
      };
    }, [ticket]);

  async function solicitarCuenta() {
    if (
      !ticket ||
      solicitandoCuenta
    ) {
      return;
    }

    const confirmar =
      window.confirm(
        `¿Solicitar la cuenta de ${ticket.atencion.mesa.nombre} por S/ ${ticket.atencion.total.toFixed(
          2
        )}?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setSolicitandoCuenta(
        true
      );

      setMensaje("");
      setError("");

      const respuesta =
        await fetch(
          `/api/pedidos/atencion/${encodeURIComponent(
            atencionId
          )}`,
          {
            method: "PATCH",
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

      setMensaje(
        resultado.message
      );

      await cargarTicket();
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "No se pudo solicitar la cuenta."
      );
    } finally {
      setSolicitandoCuenta(
        false
      );
    }
  }

  function imprimirTicket() {
    window.print();
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <LoaderCircle
            size={50}
            className="mx-auto animate-spin text-amber-500"
          />

          <p className="mt-4 font-black text-slate-600">
            Cargando ticket...
          </p>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="w-full max-w-xl rounded-3xl bg-white p-10 text-center shadow-lg">
          <AlertCircle
            size={52}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-4 text-2xl font-black text-slate-950">
            No se pudo abrir el ticket
          </h1>

          <p className="mt-2 text-slate-500">
            {error ||
              "La atención no está disponible."}
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white"
          >
            <ArrowLeft
              size={19}
            />
            Volver
          </Link>
        </div>
      </main>
    );
  }

  const cuentaSolicitada =
    ticket.atencion.estado ===
      "SOLICITO_CUENTA" ||
    ticket.atencion.estado ===
      "PAGADA" ||
    ticket.atencion.estado ===
      "CERRADA";

  return (
    <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0 md:p-7">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl print:hidden md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <ReceiptText
                  size={38}
                />

                Ticket de consumo
              </h1>

              <p className="mt-3 text-slate-300">
                Consumo acumulado de{" "}
                {
                  ticket.atencion
                    .mesa.nombre
                }
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
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
                onClick={
                  cargarTicket
                }
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950"
              >
                <RefreshCcw
                  size={19}
                />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {(mensaje || error) && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 font-bold print:hidden ${
              mensaje
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensaje ? (
              <CheckCircle2
                size={21}
              />
            ) : (
              <AlertCircle
                size={21}
              />
            )}

            {mensaje || error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-slate-500">
              Mesa
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {
                ticket.atencion
                  .mesa.nombre
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {
                ticket.atencion
                  .mesa.zona.nombre
              }
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Personas
                </p>

                <p className="mt-2 text-3xl font-black">
                  {
                    ticket.atencion
                      .cantidadPersonas
                  }
                </p>
              </div>

              <Users
                size={28}
                className="text-amber-600"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-slate-500">
              Pedidos
            </p>

            <p className="mt-2 text-3xl font-black">
              {resumen.pedidos}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {resumen.unidades} unidades
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-white p-5">
            <p className="text-sm font-bold text-slate-500">
              Total
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-600">
              S/{" "}
              {ticket.atencion.total.toFixed(
                2
              )}
            </p>
          </div>
        </section>

        <section className="print-ticket overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 print:hidden">
              <UtensilsCrossed
                size={30}
              />
            </div>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Restaurante
              Chinka Chinka
            </h2>

            <p className="text-sm italic text-slate-500">
              Donde te pierdes con
              el buen sabor
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <span>
                <strong>
                  Mesa:
                </strong>{" "}
                {
                  ticket.atencion
                    .mesa.nombre
                }
              </span>

              <span>
                <strong>
                  Atención:
                </strong>{" "}
                {
                  ticket.atencion
                    .codigo
                }
              </span>

              <span>
                <strong>
                  Apertura:
                </strong>{" "}
                {formatearHora(
                  ticket.atencion
                    .fechaApertura
                )}
              </span>
            </div>
          </div>

          <div className="p-5 md:p-7">
            {ticket.pedidos.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <ShoppingBasket
                  size={44}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 font-black text-slate-600">
                  Esta atención todavía
                  no tiene pedidos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {ticket.pedidos.map(
                  (
                    pedido,
                    indice
                  ) => {
                    const estado =
                      estadoPedidoVisual(
                        pedido.estado
                      );

                    return (
                      <article
                        key={
                          pedido.id
                        }
                        className="rounded-2xl border border-slate-200"
                      >
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-xs font-black uppercase text-amber-600">
                              Pedido{" "}
                              {indice +
                                1}
                            </p>

                            <p className="font-black text-slate-950">
                              {
                                pedido.numero
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {formatearHora(
                                pedido.fechaPedido
                              )}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${estado.clases}`}
                          >
                            {
                              estado.texto
                            }
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {pedido.detalles.map(
                            (
                              detalle
                            ) => (
                              <div
                                key={
                                  detalle.id
                                }
                                className="grid grid-cols-[50px_1fr_auto] gap-3 p-4"
                              >
                                <div className="font-black text-slate-950">
                                  {
                                    detalle.cantidad
                                  }{" "}
                                  ×
                                </div>

                                <div>
                                  <p className="font-black text-slate-900">
                                    {
                                      detalle
                                        .producto
                                        .nombre
                                    }
                                  </p>

                                  <p className="text-sm text-slate-500">
                                    S/{" "}
                                    {detalle.precioUnitario.toFixed(
                                      2
                                    )}
                                  </p>

                                  {detalle.observacion && (
                                    <p className="mt-1 text-xs font-bold text-amber-700">
                                      {
                                        detalle.observacion
                                      }
                                    </p>
                                  )}
                                </div>

                                <p className="font-black text-slate-950">
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
                    );
                  }
                )}
              </div>
            )}

            <div className="mt-7 border-t-2 border-dashed border-slate-300 pt-6">
              <div className="ml-auto max-w-md space-y-3">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-black">
                    S/{" "}
                    {ticket.atencion.subtotal.toFixed(
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
                    {ticket.atencion.descuento.toFixed(
                      2
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-xl font-black">
                    TOTAL
                  </span>

                  <span className="text-4xl font-black text-emerald-600">
                    S/{" "}
                    {ticket.atencion.total.toFixed(
                      2
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-500">
                    Pago previsto
                  </span>

                  <span className="font-black">
                    {formatearMetodoPago(
                      ticket.atencion
                        .metodoPagoPrevisto
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 print:hidden md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400"
          >
            <Plus size={20} />
            Agregar productos
          </Link>

          <button
            type="button"
            onClick={
              solicitarCuenta
            }
            disabled={
              solicitandoCuenta ||
              cuentaSolicitada ||
              ticket.atencion
                .total <= 0
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {solicitandoCuenta ? (
              <>
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />
                Solicitando...
              </>
            ) : cuentaSolicitada ? (
              <>
                <CheckCircle2
                  size={20}
                />
                Cuenta solicitada
              </>
            ) : (
              <>
                <ReceiptText
                  size={20}
                />
                Solicitar cuenta
              </>
            )}
          </button>

          <button
            type="button"
            onClick={
              imprimirTicket
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-5 py-4 font-black text-white transition hover:bg-slate-600"
          >
            <Printer size={20} />
            Imprimir ticket
          </button>

          <Link
            href={`/dashboard/caja?atencionId=${encodeURIComponent(
              ticket.atencion.id
            )}`}
            className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black text-white transition ${
              cuentaSolicitada
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "pointer-events-none bg-slate-400 opacity-60"
            }`}
          >
            <CreditCard
              size={20}
            />
            Ir a Caja
          </Link>
        </section>

        <section className="grid gap-4 print:hidden md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock3 size={18} />
              Estado
            </div>

            <p className="mt-2 font-black text-slate-950">
              {
                ticket.atencion
                  .estado
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <ChefHat size={18} />
              Mozo
            </div>

            <p className="mt-2 font-black text-slate-950">
              {ticket.atencion.mozo
                ? `${ticket.atencion.mozo.nombres} ${ticket.atencion.mozo.apellidos}`
                : "No asignado"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <CircleDollarSign
                size={18}
              />
              Pago previsto
            </div>

            <p className="mt-2 font-black text-slate-950">
              {formatearMetodoPago(
                ticket.atencion
                  .metodoPagoPrevisto
              )}
            </p>
          </div>
        </section>
      </div>
      <style jsx global>{`
  @media print {
    @page {
      size: 80mm auto;
      margin: 4mm;
    }

    html,
    body {
      width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    body {
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 11px !important;
    }

    main {
      width: 72mm !important;
      min-height: auto !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: white !important;
    }

    main > div {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .print-ticket {
      width: 100% !important;
      max-width: none !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      margin: 0 !important;
    }

    .print-ticket h2 {
      font-size: 16px !important;
      margin: 0 !important;
    }

    .print-ticket p,
    .print-ticket span {
      font-size: 10px !important;
    }

    .print-ticket .text-4xl,
    .print-ticket .text-3xl {
      font-size: 18px !important;
    }
  }
`}</style>
    </main>
  );
}