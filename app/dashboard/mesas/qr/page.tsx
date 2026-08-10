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
  Download,
  LoaderCircle,
  Printer,
  QrCode,
  RefreshCcw,
} from "lucide-react";

import QRCode from "qrcode";

type Mesa = {
  id: string;
  numero: number;
  nombre: string;
  qrCode: string | null;

  zona: {
    id: string;
    nombre: string;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type MesaQR = Mesa & {
  qrImagen: string;
  url: string;
};

const SUCURSAL_ID =
  "cmsf8svo80001m0vgby4fu7qs";

export default function MesasQRPage() {
  const [mesas, setMesas] =
    useState<MesaQR[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const baseUrl =
    useMemo(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return "";
      }

      return window.location.origin;
    }, []);

  const cargarMesas =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta =
          await fetch(
            `/api/mesas?sucursalId=${encodeURIComponent(
              SUCURSAL_ID
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            Mesa[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar las mesas."
          );
        }

        const mesasApi =
          resultado.data ?? [];

        const mesasConQr =
          await Promise.all(
            mesasApi
              .filter(
                (mesa) =>
                  Boolean(
                    mesa.qrCode
                  )
              )
              .map(
                async (
                  mesa
                ): Promise<MesaQR> => {
                  const url =
                    `${window.location.origin}/menu/${encodeURIComponent(
                      mesa.qrCode!
                    )}`;

                  const qrImagen =
                    await QRCode.toDataURL(
                      url,
                      {
                        width: 500,
                        margin: 2,
                        errorCorrectionLevel:
                          "H",
                      }
                    );

                  return {
                    ...mesa,
                    qrImagen,
                    url,
                  };
                }
              )
          );

        setMesas(
          mesasConQr
        );
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Error cargando los códigos QR."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  function imprimirTodos() {
    window.print();
  }

  function imprimirMesa(
    mesa: MesaQR
  ) {
    const ventana =
      window.open(
        "",
        "_blank",
        "width=500,height=700"
      );

    if (!ventana) {
      return;
    }

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />

          <title>
            QR ${mesa.nombre}
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 25px;
              font-family: Arial, Helvetica, sans-serif;
              background: white;
              color: #0f172a;
            }

            .tarjeta {
              width: 100%;
              max-width: 390px;
              margin: 0 auto;
              border: 2px solid #0f172a;
              border-radius: 24px;
              padding: 28px;
              text-align: center;
            }

            .marca {
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            h1 {
              margin: 8px 0 0;
              font-size: 28px;
            }

            .slogan {
              margin: 6px 0 22px;
              font-size: 13px;
            }

            .qr {
              width: 270px;
              height: 270px;
              object-fit: contain;
            }

            .mesa {
              margin-top: 18px;
              font-size: 30px;
              font-weight: 900;
            }

            .zona {
              margin-top: 4px;
              font-size: 14px;
            }

            .instruccion {
              margin-top: 20px;
              font-size: 16px;
              font-weight: 700;
            }

            .nota {
              margin-top: 10px;
              font-size: 12px;
              color: #475569;
            }

            @media print {
              @page {
                margin: 8mm;
              }

              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="tarjeta">
            <div class="marca">
              Restaurante
            </div>

            <h1>
              Chinka Chinka
            </h1>

            <div class="slogan">
              Donde te pierdes con el buen sabor
            </div>

            <img
              src="${mesa.qrImagen}"
              class="qr"
              alt="QR ${mesa.nombre}"
            />

            <div class="mesa">
              ${mesa.nombre}
            </div>

            <div class="zona">
              ${mesa.zona.nombre}
            </div>

            <div class="instruccion">
              Escanea el QR para realizar tu pedido
            </div>

            <div class="nota">
              No necesitas seleccionar tu mesa.
              El QR la identifica automáticamente.
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    ventana.document.close();
  }

  function descargarQR(
    mesa: MesaQR
  ) {
    const enlace =
      document.createElement(
        "a"
      );

    enlace.href =
      mesa.qrImagen;

    enlace.download =
      `QR-${mesa.nombre
        .replaceAll(
          " ",
          "-"
        )
        .toUpperCase()}.png`;

    document.body.appendChild(
      enlace
    );

    enlace.click();

    document.body.removeChild(
      enlace
    );
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <LoaderCircle
            size={50}
            className="mx-auto animate-spin text-amber-500"
          />

          <p className="mt-4 font-black text-slate-700">
            Generando QR de las mesas...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="print:hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <QrCode
                  size={38}
                />

                QR de mesas
              </h1>

              <p className="mt-3 text-slate-300">
                Cada QR identifica automáticamente la mesa del cliente.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white"
              >
                <ArrowLeft
                  size={19}
                />
                Volver
              </Link>

              <button
                type="button"
                onClick={
                  cargarMesas
                }
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white"
              >
                <RefreshCcw
                  size={19}
                />
                Actualizar
              </button>

              <button
                type="button"
                onClick={
                  imprimirTodos
                }
                className="flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-slate-950"
              >
                <Printer
                  size={19}
                />
                Imprimir todos
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="print:hidden rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-2">
          {mesas.map(
            (mesa) => (
              <article
                key={
                  mesa.id
                }
                className="qr-tarjeta break-inside-avoid rounded-3xl border-2 border-slate-200 bg-white p-5 text-center shadow-sm print:rounded-none print:border-2 print:shadow-none"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                  Restaurante
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Chinka Chinka
                </h2>

                <p className="mt-1 text-xs italic text-slate-500">
                  Donde te pierdes con el buen sabor
                </p>

                <div className="mx-auto mt-5 flex max-w-[280px] items-center justify-center rounded-3xl bg-white p-3">
                  <img
                    src={
                      mesa.qrImagen
                    }
                    alt={`QR ${mesa.nombre}`}
                    className="aspect-square w-full object-contain"
                  />
                </div>

                <h3 className="mt-4 text-3xl font-black text-slate-950">
                  {mesa.nombre}
                </h3>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  {
                    mesa.zona
                      .nombre
                  }
                </p>

                <p className="mt-4 text-sm font-black text-slate-700">
                  Escanea para realizar tu pedido
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Tu mesa se detecta automáticamente.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() =>
                      descargarQR(
                        mesa
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-3 text-sm font-black text-slate-700"
                  >
                    <Download
                      size={17}
                    />
                    PNG
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      imprimirMesa(
                        mesa
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-sm font-black text-white"
                  >
                    <Printer
                      size={17}
                    />
                    Imprimir
                  </button>
                </div>

                <p className="mt-4 break-all text-[9px] text-slate-300 print:hidden">
                  {mesa.url}
                </p>
              </article>
            )
          )}
        </section>

        {!error &&
          mesas.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <QrCode
                size={50}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-xl font-black">
                No hay QR disponibles
              </h2>

              <p className="mt-2 text-slate-500">
                Primero genera los códigos QR de las mesas.
              </p>
            </div>
          )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          main {
            padding: 0 !important;
            background: white !important;
          }

          .qr-tarjeta {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}