"use client";

import {
  Archive,
  ChefHat,
  Clock3,
  ImageIcon,
  PackageCheck,
  PackageMinus,
  PackageX,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";

import type {
  Producto,
} from "@/types/producto";

type Props = {
  producto: Producto;

  guardando: boolean;

  onEditar: (
    producto: Producto
  ) => void;

  onCambiarDisponibilidad: (
    producto: Producto
  ) => void;

  onDesactivar: (
    producto: Producto
  ) => void;
};

export default function ProductoCard({
  producto,
  guardando,
  onEditar,
  onCambiarDisponibilidad,
  onDesactivar,
}: Props) {
  const precio =
    Number(
      producto.precioVenta
    );

  const costo =
    Number(
      producto.costo
    );

  const utilidad =
    precio - costo;

  const stockActual =
    Number(
      producto.stockActual ??
        0
    );

  const stockMinimo =
    Number(
      producto.stockMinimo ??
        0
    );

  const estaAgotado =
    producto.controlaStock &&
    stockActual <= 0;

  const stockBajo =
    producto.controlaStock &&
    stockActual > 0 &&
    stockActual <=
      stockMinimo;

  const stockNormal =
    producto.controlaStock &&
    stockActual >
      stockMinimo;

  const disponibleReal =
    producto.activo &&
    producto.disponible &&
    !estaAgotado;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* =====================================================
          IMAGEN
      ====================================================== */}

      <div className="relative h-56 overflow-hidden bg-slate-100">
        {producto.imagenUrl ? (
          <img
            src={
              producto.imagenUrl
            }
            alt={
              producto.nombre
            }
            className="h-full w-full object-cover"
            onError={(
              evento
            ) => {
              evento.currentTarget.style.display =
                "none";
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <ImageIcon
              size={48}
            />

            <p className="mt-2 text-sm font-bold">
              Sin imagen
            </p>
          </div>
        )}

        {/* CÓDIGO */}

        <div className="absolute left-4 top-4 rounded-full bg-slate-950/85 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
          {producto.codigo}
        </div>

        {/* ESTADO DISPONIBILIDAD */}

        <div
          className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-black text-white backdrop-blur ${
            disponibleReal
              ? "bg-emerald-500/90"
              : "bg-red-500/90"
          }`}
        >
          {disponibleReal
            ? "Disponible"
            : "Agotado"}
        </div>
      </div>

      {/* =====================================================
          CONTENIDO
      ====================================================== */}

      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-wider text-amber-600">
          {
            producto
              .categoria
              .nombre
          }
        </p>

        <h3 className="mt-1 text-2xl font-black text-slate-950">
          {producto.nombre}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
          {producto.descripcion ||
            "Sin descripción."}
        </p>

        {/* ===================================================
            PRECIO / UTILIDAD
        ==================================================== */}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-100 p-3">
            <p className="text-xs font-bold text-slate-500">
              Precio
            </p>

            <p className="mt-1 text-xl font-black text-slate-950">
              S/{" "}
              {precio.toFixed(
                2
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3">
            <p className="text-xs font-bold text-emerald-700">
              Utilidad estimada
            </p>

            <p className="mt-1 text-xl font-black text-emerald-700">
              S/{" "}
              {utilidad.toFixed(
                2
              )}
            </p>
          </div>
        </div>

        {/* ===================================================
            STOCK
        ==================================================== */}

        <div className="mt-4">
          {!producto.controlaStock ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <PackageCheck
                  size={20}
                  className="text-slate-500"
                />

                <div>
                  <p className="text-sm font-black text-slate-800">
                    Sin control de stock
                  </p>

                  <p className="text-xs text-slate-500">
                    Se controla por disponibilidad.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl border p-4 ${
                estaAgotado
                  ? "border-red-200 bg-red-50"
                  : stockBajo
                    ? "border-orange-200 bg-orange-50"
                    : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-xl p-2 ${
                      estaAgotado
                        ? "bg-red-100 text-red-700"
                        : stockBajo
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {estaAgotado ? (
                      <PackageX
                        size={21}
                      />
                    ) : stockBajo ? (
                      <PackageMinus
                        size={21}
                      />
                    ) : (
                      <PackageCheck
                        size={21}
                      />
                    )}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-black ${
                        estaAgotado
                          ? "text-red-800"
                          : stockBajo
                            ? "text-orange-800"
                            : "text-emerald-800"
                      }`}
                    >
                      {estaAgotado
                        ? "Agotado"
                        : stockBajo
                          ? "Stock bajo"
                          : "Stock disponible"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Mínimo:{" "}
                      {stockMinimo}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">
                    Stock actual
                  </p>

                  <p
                    className={`text-2xl font-black ${
                      estaAgotado
                        ? "text-red-700"
                        : stockBajo
                          ? "text-orange-700"
                          : "text-emerald-700"
                    }`}
                  >
                    {stockActual}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            TIEMPO DE PREPARACIÓN
        ==================================================== */}

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <Clock3
              size={18}
            />

            Preparación
          </span>

          <span className="font-black text-slate-950">
            {
              producto
                .tiempoPreparacion
            }{" "}
            min
          </span>
        </div>

        {/* ===================================================
            ACCIONES
        ==================================================== */}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              onEditar(
                producto
              )
            }
            disabled={
              guardando
            }
            className="flex items-center justify-center gap-1 rounded-xl bg-blue-50 px-3 py-3 font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            title="Editar producto"
          >
            <Pencil
              size={18}
            />

            <span className="hidden xl:inline">
              Editar
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onCambiarDisponibilidad(
                producto
              )
            }
            disabled={
              guardando ||
              !producto.activo ||
              (
                producto.controlaStock &&
                stockActual <= 0 &&
                !producto.disponible
              )
            }
            className={`flex items-center justify-center gap-1 rounded-xl px-3 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              producto.disponible
                ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
            title={
              producto.disponible
                ? "Marcar agotado"
                : estaAgotado
                  ? "Primero repón el stock"
                  : "Marcar disponible"
            }
          >
            {producto.disponible ? (
              <PowerOff
                size={18}
              />
            ) : (
              <Power
                size={18}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              onDesactivar(
                producto
              )
            }
            disabled={
              guardando ||
              !producto.activo
            }
            className="flex items-center justify-center rounded-xl bg-red-50 px-3 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            title="Desactivar producto"
          >
            <Archive
              size={18}
            />
          </button>
        </div>

        {/* ===================================================
            PRODUCTO INACTIVO
        ==================================================== */}

        {!producto.activo && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            <ChefHat
              size={18}
            />

            Producto inactivo
          </div>
        )}
      </div>
    </article>
  );
}