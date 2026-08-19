"use client";

import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Eye,
  LoaderCircle,
  Printer,
  ReceiptText,
  RefreshCcw,
  Search,
  Store,
  UserRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePrinter } from "@/hooks/usePrinter";
import { ThermalReceiptModal } from "@/components/impresion/ThermalReceiptModal";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type NotaVentaResumen = {
  id: string;
  numero: string;
  serie: string;
  correlativo: number;
  tipo: "NOTA_VENTA";
  clienteDocumento: string | null;
  clienteNombre: string | null;
  clienteDireccion: string | null;
  subtotal: string | number;
  igv: string | number;
  total: string | number;
  emitido: boolean;
  fechaEmision: string;

  sucursal: {
    id: string;
    nombre: string;
    empresa: {
      id: string;
      nombre: string;
      ruc: string | null;
    };
  };

  atencion: {
    id: string;
    codigo: string;
    fechaPago: string | null;
    mesa: {
      id: string;
      numero: number;
      nombre: string;
      zona: {
        nombre: string;
      };
    };
  };
};

type NotaVentaDetalle = {
  id: string;
  numero: string;
  serie: string;
  correlativo: number;
  tipo: "NOTA_VENTA";
  clienteDocumento: string | null;
  clienteNombre: string | null;
  clienteDireccion: string | null;
  subtotal: string | number;
  igv: string | number;
  total: string | number;
  emitido: boolean;
  fechaEmision: string;

  sucursal: {
    id: string;
    nombre: string;
    empresa: {
      id: string;
      nombre: string;
      ruc: string | null;
      direccion: string | null;
      telefono: string | null;
      correo: string | null;
      logoUrl: string | null;
    };
  };

  atencion: {
    id: string;
    codigo: string;
    mesa: {
      id: string;
      numero: number;
      nombre: string;
      zona: {
        id: string;
        nombre: string;
      };
    };

    pedidos: Array<{
      id: string;
      numero: string;
      detalles: Array<{
        id: string;
        cantidad: string | number;
        precioUnitario: string | number;
        subtotal: string | number;
        producto: {
          id: string;
          codigo: string;
          nombre: string;
        };
      }>;
    }>;

    pagos: Array<{
      id: string;
      metodo: string;
      monto: string | number;
      montoRecibido: string | number | null;
      vuelto: string | number | null;
      referencia: string | null;
      observacion: string | null;
      fechaPago: string;
    }>;
  };
};

function dinero(
  valor: string | number | null | undefined
) {
  const numero =
    Number(valor ?? 0);

  return `S/ ${
    Number.isFinite(numero)
      ? numero.toFixed(2)
      : "0.00"
  }`;
}

function fechaPeru(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Lima",
    }
  ).format(
    new Date(fecha)
  );
}

export default function ComprobantesPage() {
  const [
    notas,
    setNotas,
  ] =
    useState<NotaVentaResumen[]>(
      []
    );

  const [cargando, setCargando] =
    useState(true);

  const {
    imprimiendo,
    imprimirComprobante,
    modalAbierto,
    cerrarModal,
    ultimoResultado,
  } = usePrinter();

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");

  const [
    detalle,
    setDetalle,
  ] =
    useState<NotaVentaDetalle | null>(
      null
    );

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] =
    useState(false);

  const cargarNotas =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta =
          await fetch(
            "/api/comprobantes",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            NotaVentaResumen[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar las notas de venta."
          );
        }

        setNotas(
          resultado.data ?? []
        );
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Error cargando notas de venta."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarNotas();
  }, [
    cargarNotas,
  ]);

  const notasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return notas;
      }

      return notas.filter(
        (nota) =>
          nota.numero
            .toLowerCase()
            .includes(texto) ||
          nota.atencion.codigo
            .toLowerCase()
            .includes(texto) ||
          nota.atencion.mesa.nombre
            .toLowerCase()
            .includes(texto) ||
          (
            nota.clienteNombre ??
            ""
          )
            .toLowerCase()
            .includes(texto) ||
          (
            nota.clienteDocumento ??
            ""
          )
            .toLowerCase()
            .includes(texto)
      );
    }, [
      notas,
      busqueda,
    ]);

  const totalEmitido =
    useMemo(
      () =>
        notas.reduce(
          (total, nota) =>
            total +
            Number(
              nota.total ?? 0
            ),
          0
        ),
      [
        notas,
      ]
    );

  async function abrirNota(
    id: string
  ) {
    try {
      setCargandoDetalle(
        true
      );

      setError("");

      const respuesta =
        await fetch(
          `/api/comprobantes?id=${encodeURIComponent(
            id
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<NotaVentaDetalle>;

      if (
        !respuesta.ok ||
        !resultado.success ||
        !resultado.data
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo abrir la nota de venta."
        );
      }

      setDetalle(
        resultado.data
      );
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Error abriendo la nota de venta."
      );
    } finally {
      setCargandoDetalle(
        false
      );
    }
  }

  async function imprimirNota(
    nota: NotaVentaDetalle
  ) {
    try {
      await imprimirComprobante(nota.id);
    } catch {
      // Manejado por usePrinter
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <ReceiptText
                  size={38}
                />
                Notas de Venta
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Consulta, revisa e imprime las notas de venta generadas desde Caja.
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
                  cargarNotas
                }
                disabled={
                  cargando
                }
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

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Notas emitidas
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {notas.length}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-emerald-700">
              Total documentado
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-700">
              {dinero(
                totalEmitido
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-amber-700">
              Serie
            </p>

            <p className="mt-2 text-3xl font-black text-amber-700">
              NV01
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
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
              placeholder="Buscar por nota, atención, mesa, cliente o documento..."
              className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-4 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />
          </div>

          {cargando ? (
            <div className="flex min-h-80 items-center justify-center">
              <LoaderCircle
                size={42}
                className="animate-spin text-amber-500"
              />
            </div>
          ) : notasFiltradas.length ===
            0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <ReceiptText
                size={50}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-xl font-black text-slate-800">
                No hay notas de venta
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Las notas aparecerán aquí después de generarlas desde Caja.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-4">
                      Nota
                    </th>
                    <th className="px-4 py-4">
                      Mesa / Atención
                    </th>
                    <th className="px-4 py-4">
                      Cliente
                    </th>
                    <th className="px-4 py-4">
                      Fecha
                    </th>
                    <th className="px-4 py-4 text-right">
                      Total
                    </th>
                    <th className="px-4 py-4 text-right">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {notasFiltradas.map(
                    (nota) => (
                      <tr
                        key={
                          nota.id
                        }
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700">
                              <ReceiptText
                                size={20}
                              />
                            </div>

                            <div>
                              <p className="font-black text-slate-950">
                                {
                                  nota.numero
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                NOTA DE VENTA
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">
                            {
                              nota
                                .atencion
                                .mesa
                                .nombre
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            {
                              nota
                                .atencion
                                .codigo
                            }
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800">
                            {nota.clienteNombre ??
                              "Cliente general"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {nota.clienteDocumento ??
                              "Sin documento"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CalendarDays
                              size={16}
                            />

                            {fechaPeru(
                              nota.fechaEmision
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <p className="text-lg font-black text-emerald-700">
                            {dinero(
                              nota.total
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                abrirNota(
                                  nota.id
                                )
                              }
                              disabled={
                                cargandoDetalle
                              }
                              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                            >
                              <Eye
                                size={17}
                              />
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5 md:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                  Nota de Venta
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {detalle.numero}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDetalle(null)
                }
                className="rounded-xl bg-slate-100 p-3 text-slate-600"
              >
                <X
                  size={20}
                />
              </button>
            </header>

            <div className="p-5 md:p-7">
              <div className="text-center">
                <Store
                  size={34}
                  className="mx-auto text-amber-600"
                />

                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  {
                    detalle.sucursal
                      .empresa.nombre
                  }
                </h3>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  NOTA DE VENTA
                </p>

                <p className="mt-2 text-xl font-black text-amber-700">
                  {detalle.numero}
                </p>
              </div>

              <div className="my-6 border-t border-dashed border-slate-300" />

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Mesa
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    {
                      detalle.atencion
                        .mesa.nombre
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Atención
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    {
                      detalle.atencion
                        .codigo
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Cliente
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    {detalle.clienteNombre ??
                      "Cliente general"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Documento
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    {detalle.clienteDocumento ??
                      "Sin documento"}
                  </p>
                </div>
              </div>

              <div className="my-6 border-t border-dashed border-slate-300" />

              <div className="space-y-3">
                {detalle.atencion.pedidos.flatMap(
                  (pedido) =>
                    pedido.detalles.map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className="flex items-start justify-between gap-4 text-sm"
                        >
                          <div>
                            <p className="font-black text-slate-900">
                              {Number(
                                item.cantidad
                              )}{" "}
                              ×{" "}
                              {
                                item
                                  .producto
                                  .nombre
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                item
                                  .producto
                                  .codigo
                              }
                            </p>
                          </div>

                          <p className="font-black text-slate-950">
                            {dinero(
                              item.subtotal
                            )}
                          </p>
                        </div>
                      )
                    )
                )}
              </div>

              <div className="my-6 border-t border-dashed border-slate-300" />

              <div className="flex items-center justify-between text-2xl font-black">
                <span>
                  TOTAL
                </span>

                <span className="text-emerald-700">
                  {dinero(
                    detalle.total
                  )}
                </span>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <CircleDollarSign
                    size={22}
                    className="text-emerald-600"
                  />

                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Método de pago
                    </p>

                    <p className="font-black text-slate-950">
                      {detalle.atencion.pagos.at(
                        -1
                      )?.metodo ?? "--"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={imprimiendo}
                onClick={() =>
                  imprimirNota(
                    detalle
                  )
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {imprimiendo ? (
                  <>
                    <LoaderCircle size={20} className="animate-spin" />
                    Imprimiendo...
                  </>
                ) : (
                  <>
                    <Printer size={20} />
                    Imprimir Comprobante
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {cargandoDetalle &&
        !detalle && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30">
            <LoaderCircle
              size={46}
              className="animate-spin text-white"
            />
          </div>
        )}

      <ThermalReceiptModal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        ticketHtml={ultimoResultado?.ticketHtml || ""}
        titulo={ultimoResultado?.titulo || "Comprobante de Venta"}
        paperWidth={ultimoResultado?.paperWidth || "80mm"}
        networkPrinted={ultimoResultado?.networkPrinted}
        networkError={ultimoResultado?.error}
      />
    </main>
  );
}