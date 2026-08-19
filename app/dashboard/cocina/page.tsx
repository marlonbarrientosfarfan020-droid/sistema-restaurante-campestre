"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ChefHat,
  CheckCircle2,
  Clock3,
  Flame,
  LoaderCircle,
  PackageCheck,
  Printer,
  RefreshCcw,
  UtensilsCrossed,
} from "lucide-react";

import { useCocina } from "@/hooks/useCocina";
import { usePrinter } from "@/hooks/usePrinter";
import { ThermalReceiptModal } from "@/components/impresion/ThermalReceiptModal";

import type {
  PedidoResumen,
} from "@/types/pedido";

function calcularMinutos(
  fechaPedido: string
) {
  const inicio = new Date(
    fechaPedido
  ).getTime();

  const diferencia = Math.max(
    0,
    Date.now() - inicio
  );

  return Math.floor(
    diferencia / 60000
  );
}

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
  ).format(new Date(fecha));
}

function obtenerTiempoEstimado(
  pedido: PedidoResumen
) {
  if (
    pedido.detalles.length === 0
  ) {
    return 0;
  }

  return Math.max(
    ...pedido.detalles.map(
      (detalle) =>
        detalle.producto
          .tiempoPreparacion
    )
  );
}

function obtenerSiguienteAccion(
  estado: string
) {
  if (estado === "RECIBIDO") {
    return {
      estado:
        "PREPARANDO" as const,
      texto: "Iniciar preparación",
      icono: (
        <Flame size={19} />
      ),
      clases:
        "bg-orange-600 hover:bg-orange-500",
    };
  }

  if (estado === "PREPARANDO") {
    return {
      estado:
        "LISTO" as const,
      texto: "Marcar como listo",
      icono: (
        <PackageCheck
          size={19}
        />
      ),
      clases:
        "bg-emerald-600 hover:bg-emerald-500",
    };
  }

  return null;
}

function estadoVisual(
  estado: string
) {
  const estados: Record<
    string,
    {
      texto: string;
      clases: string;
    }
  > = {
    RECIBIDO: {
      texto: "Por preparar",
      clases:
        "bg-sky-100 text-sky-700",
    },

    PREPARANDO: {
      texto: "Preparando",
      clases:
        "bg-amber-100 text-amber-700",
    },

    NUEVO: {
      texto: "Pedido antiguo",
      clases:
        "bg-slate-100 text-slate-700",
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


function escaparHtml(
  valor: string
) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imprimirPedidoCocina(
  pedido: PedidoResumen
) {
  const ventana =
    window.open(
      "",
      "_blank",
      "width=420,height=700"
    );

  if (!ventana) {
    window.alert(
      "El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para imprimir."
    );

    return;
  }

  const detalles =
    pedido.detalles
      .map((detalle) => {
        const cantidad =
          Number(
            detalle.cantidad
          );

        const nombre =
          escaparHtml(
            detalle.producto
              .nombre
          );

        const observacion =
          detalle.observacion
            ? `
              <div class="observacion">
                * ${escaparHtml(
                  detalle.observacion
                )}
              </div>
            `
            : "";

        return `
          <div class="producto">
            <div class="producto-linea">
              <strong>
                ${cantidad} x ${nombre}
              </strong>
            </div>

            ${observacion}
          </div>
        `;
      })
      .join("");

  const observacionGeneral =
    pedido.observacion
      ? `
        <div class="separador"></div>

        <div class="titulo-observacion">
          OBSERVACION GENERAL
        </div>

        <div class="observacion-general">
          ${escaparHtml(
            pedido.observacion
          )}
        </div>
      `
      : "";

  const html = `
<!DOCTYPE html>

<html lang="es">
<head>
  <meta charset="UTF-8" />

  <title>
    ${escaparHtml(
      pedido.numero
    )} - Cocina
  </title>

  <style>
    @page {
      size: 80mm auto;
      margin: 3mm;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 74mm;
      background: #ffffff;
      color: #000000;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }

    body {
      padding: 2mm;
      font-size: 12px;
    }

    .ticket {
      width: 100%;
    }

    .centro {
      text-align: center;
    }

    .restaurante {
      font-size: 18px;
      font-weight: 900;
    }

    .tipo {
      margin-top: 3px;
      font-size: 14px;
      font-weight: 900;
    }

    .separador {
      margin: 8px 0;
      border-top: 1px dashed #000;
    }

    .dato {
      margin: 3px 0;
      font-size: 12px;
    }

    .mesa {
      margin: 7px 0;
      text-align: center;
      font-size: 24px;
      font-weight: 900;
    }

    .producto {
      padding: 6px 0;
      border-bottom: 1px dotted #777;
    }

    .producto-linea {
      font-size: 15px;
      line-height: 1.3;
    }

    .observacion {
      margin-top: 4px;
      padding-left: 10px;
      font-size: 12px;
      font-weight: 700;
    }

    .titulo-observacion {
      font-size: 12px;
      font-weight: 900;
    }

    .observacion-general {
      margin-top: 4px;
      font-size: 13px;
      font-weight: 700;
    }

    .pie {
      margin-top: 10px;
      text-align: center;
      font-size: 10px;
    }

    @media print {
      html,
      body {
        width: 74mm;
      }
    }
  </style>
</head>

<body>
  <div class="ticket">
    <div class="centro">
      <div class="restaurante">
        CHINKA CHINKA
      </div>

      <div class="tipo">
        PEDIDO DE COCINA
      </div>
    </div>

    <div class="separador"></div>

    <div class="dato">
      <strong>PEDIDO:</strong>
      ${escaparHtml(
        pedido.numero
      )}
    </div>

    <div class="mesa">
      ${escaparHtml(
        pedido.atencion.mesa
          .nombre
      )}
    </div>

    <div class="dato">
      <strong>ATENCION:</strong>
      ${escaparHtml(
        pedido.atencion.codigo
      )}
    </div>

    <div class="dato">
      <strong>HORA:</strong>
      ${escaparHtml(
        formatearHora(
          pedido.fechaPedido
        )
      )}
    </div>

    <div class="separador"></div>

    ${detalles}

    ${observacionGeneral}

    <div class="separador"></div>

    <div class="pie">
      ${escaparHtml(
        pedido.numero
      )}
    </div>
  </div>

  <script>
    window.onload = function () {
      window.focus();
      window.print();

      setTimeout(function () {
        window.close();
      }, 500);
    };
  </script>
</body>
</html>
`;

  ventana.document.open();
  ventana.document.write(
    html
  );
  ventana.document.close();
}

function PedidoCocinaCard({
  pedido,
  procesando,
  imprimiendo = false,
  onCambiarEstado,
  onImprimirPedido,
}: {
  pedido: PedidoResumen;
  procesando: boolean;
  imprimiendo?: boolean;
  onCambiarEstado: (
    pedidoId: string,
    estado:
      | "PREPARANDO"
      | "LISTO"
  ) => Promise<boolean>;
  onImprimirPedido?: (pedidoId: string) => Promise<void | unknown>;
}) {
  const minutos =
    calcularMinutos(
      pedido.fechaPedido
    );

  const tiempoEstimado =
    obtenerTiempoEstimado(
      pedido
    );

  const demorado =
    tiempoEstimado > 0 &&
    minutos > tiempoEstimado;

  const estado =
    estadoVisual(
      pedido.estado
    );

  const accion =
    obtenerSiguienteAccion(
      pedido.estado
    );

  return (
    <article
      className={`overflow-hidden rounded-3xl border-2 bg-white shadow-sm transition ${
        demorado
          ? "border-red-400"
          : pedido.estado ===
              "PREPARANDO"
            ? "border-amber-300"
            : "border-slate-200"
      }`}
    >
      <header className="border-b border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
              {pedido.numero}
            </p>

            <h2 className="mt-1 text-3xl font-black text-slate-950">
              {
                pedido.atencion
                  .mesa.nombre
              }
            </h2>

            <p className="mt-1 text-sm font-bold text-slate-500">
              Atención:{" "}
              {
                pedido.atencion
                  .codigo
              }
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-black ${estado.clases}`}
          >
            {estado.texto}
          </span>
        </div>

        <div
          className={`mt-4 flex items-center justify-between rounded-2xl px-4 py-3 ${
            demorado
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          <span className="flex items-center gap-2 font-bold">
            <Clock3
              size={18}
            />
            {minutos} min
          </span>

          <span className="text-sm font-black">
            Estimado:{" "}
            {tiempoEstimado} min
          </span>
        </div>
      </header>

      <div className="space-y-4 p-5">
        {pedido.detalles.map(
          (detalle) => (
            <div
              key={
                detalle.id
              }
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-lg font-black text-amber-700">
                  {Number(
                    detalle.cantidad
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-950">
                    {
                      detalle.producto
                        .nombre
                    }
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Preparación estimada:{" "}
                    {
                      detalle.producto
                        .tiempoPreparacion
                    }{" "}
                    min
                  </p>

                  {detalle.observacion && (
                    <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
                      {
                        detalle.observacion
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {pedido.observacion && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-orange-700">
              Observación general
            </p>

            <p className="mt-2 font-bold text-orange-800">
              {
                pedido.observacion
              }
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
          <span className="text-slate-500">
            Hora del pedido
          </span>

          <span className="font-black text-slate-900">
            {formatearHora(
              pedido.fechaPedido
            )}
          </span>
        </div>

        <button
          type="button"
          disabled={imprimiendo}
          onClick={() => {
            if (onImprimirPedido) {
              onImprimirPedido(pedido.id);
            } else {
              imprimirPedidoCocina(pedido);
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 font-black text-slate-800 transition hover:border-slate-950 hover:bg-slate-50 disabled:opacity-60"
        >
          {imprimiendo ? (
            <LoaderCircle size={19} className="animate-spin text-amber-600" />
          ) : (
            <Printer size={19} />
          )}
          Imprimir comanda
        </button>

        {accion ? (
          <button
            type="button"
            onClick={() =>
              onCambiarEstado(
                pedido.id,
                accion.estado
              )
            }
            disabled={
              procesando
            }
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${accion.clases}`}
          >
            {procesando ? (
              <>
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
                Procesando...
              </>
            ) : (
              <>
                {
                  accion.icono
                }
                {
                  accion.texto
                }
              </>
            )}
          </button>
        ) : (
          <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm font-bold text-slate-500">
            Este pedido pertenece al
            flujo anterior.
          </div>
        )}
      </div>
    </article>
  );
}

export default function CocinaPage() {
  const {
    pedidos,
    cargando,
    procesandoId,
    mensaje,
    error,
    recargar,
    cambiarEstado,
  } = useCocina();

  const {
    imprimiendo,
    imprimirComandaCocina,
    modalAbierto,
    cerrarModal,
    ultimoResultado,
  } = usePrinter();

  const recibidos =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "RECIBIDO"
    );

  const preparando =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "PREPARANDO"
    );

  const antiguos =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "NUEVO"
    );

  const totalOperativos =
    recibidos.length +
    preparando.length;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <ChefHat
                  size={38}
                />
                Pantalla de cocina
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Flujo de cocina:
                recibir, preparar y
                marcar como listo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                <ArrowLeft
                  size={19}
                />
                Volver al panel
              </Link>

              <button
                type="button"
                onClick={
                  recargar
                }
                disabled={
                  cargando
                }
                className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-slate-100 disabled:opacity-50"
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

        {(mensaje ||
          error) && (
          <section
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${
              mensaje
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
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
              {
                mensaje ||
                error
              }
            </p>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Total en cocina
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {
                totalOperativos
              }
            </p>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-sky-700">
              Por preparar
            </p>

            <p className="mt-2 text-3xl font-black text-sky-600">
              {
                recibidos.length
              }
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-amber-700">
              Preparando
            </p>

            <p className="mt-2 text-3xl font-black text-amber-600">
              {
                preparando.length
              }
            </p>
          </div>
        </section>

        {antiguos.length >
          0 && (
          <section className="rounded-2xl border border-slate-300 bg-white px-5 py-4">
            <p className="font-black text-slate-700">
              Hay{" "}
              {
                antiguos.length
              }{" "}
              pedido(s) del flujo
              anterior en estado
              NUEVO.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No afectan el nuevo
              flujo QR.
            </p>
          </section>
        )}

        {cargando ? (
          <div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoaderCircle
                size={46}
                className="mx-auto animate-spin text-orange-500"
              />

              <p className="mt-4 font-bold text-slate-600">
                Cargando pedidos
                de cocina...
              </p>
            </div>
          </div>
        ) : totalOperativos ===
          0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <UtensilsCrossed
              size={54}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              No hay pedidos en
              cocina
            </h2>

            <p className="mt-2 text-slate-500">
              Los pedidos aparecerán aquí
              después de ser confirmados en
              el Centro de Pedidos.
            </p>
          </div>
        ) : (
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-sky-100 px-5 py-4">
                <span className="flex items-center gap-2 font-black text-sky-800">
                  <ChefHat
                    size={21}
                  />
                  Por preparar
                </span>

                <span className="rounded-full bg-sky-600 px-3 py-1 text-sm font-black text-white">
                  {
                    recibidos.length
                  }
                </span>
              </div>

              {recibidos.length ===
              0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                  No hay pedidos
                  esperando
                  preparación.
                </div>
              ) : (
                <div className="grid gap-4 2xl:grid-cols-2">
                  {recibidos.map(
                    (
                      pedido
                    ) => (
                      <PedidoCocinaCard
                        key={
                          pedido.id
                        }
                        pedido={
                          pedido
                        }
                        procesando={
                          procesandoId ===
                          pedido.id
                        }
                        imprimiendo={imprimiendo}
                        onCambiarEstado={
                          cambiarEstado
                        }
                        onImprimirPedido={
                          imprimirComandaCocina
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-amber-100 px-5 py-4">
                <span className="flex items-center gap-2 font-black text-amber-800">
                  <Flame
                    size={21}
                  />
                  En preparación
                </span>

                <span className="rounded-full bg-amber-600 px-3 py-1 text-sm font-black text-white">
                  {
                    preparando.length
                  }
                </span>
              </div>

              {preparando.length ===
              0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                  No hay pedidos
                  preparándose.
                </div>
              ) : (
                <div className="grid gap-4 2xl:grid-cols-2">
                  {preparando.map(
                    (
                      pedido
                    ) => (
                      <PedidoCocinaCard
                        key={
                          pedido.id
                        }
                        pedido={
                          pedido
                        }
                        procesando={
                          procesandoId ===
                          pedido.id
                        }
                        imprimiendo={imprimiendo}
                        onCambiarEstado={
                          cambiarEstado
                        }
                        onImprimirPedido={
                          imprimirComandaCocina
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <ThermalReceiptModal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        ticketHtml={ultimoResultado?.ticketHtml || ""}
        titulo={ultimoResultado?.titulo || "Comanda de Cocina"}
        paperWidth={ultimoResultado?.paperWidth || "80mm"}
        networkPrinted={ultimoResultado?.networkPrinted}
        networkError={ultimoResultado?.error}
      />
    </main>
  );
}