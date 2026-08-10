"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  ImageIcon,
  LoaderCircle,
  PackageOpen,
  Save,
} from "lucide-react";

import type {
  CategoriaProducto,
  Producto,
} from "@/types/producto";

type DatosFormulario = {
  categoriaId: string;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  costo: number;
  tiempoPreparacion: number;
  imagenUrl: string;
  controlaStock: boolean;
  stockActual: number;
  stockMinimo: number;
  disponible: boolean;
  activo: boolean;
};

type Props = {
  producto?: Producto | null;
  categorias: CategoriaProducto[];
  guardando: boolean;
  onGuardar: (
    datos: DatosFormulario
  ) => Promise<boolean>;
};

export default function ProductoForm({
  producto,
  categorias,
  guardando,
  onGuardar,
}: Props) {
  const [categoriaId, setCategoriaId] =
    useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] =
    useState("");
  const [precioVenta, setPrecioVenta] =
    useState("");
  const [costo, setCosto] = useState("");
  const [
    tiempoPreparacion,
    setTiempoPreparacion,
  ] = useState("15");
  const [imagenUrl, setImagenUrl] =
    useState("");

  const [
    controlaStock,
    setControlaStock,
  ] = useState(false);

  const [
    stockActual,
    setStockActual,
  ] = useState("0");

  const [
    stockMinimo,
    setStockMinimo,
  ] = useState("0");

  const [disponible, setDisponible] =
    useState(true);
  const [activo, setActivo] = useState(true);
  const [errorLocal, setErrorLocal] =
    useState("");

  useEffect(() => {
    setCategoriaId(
      producto?.categoriaId ??
        categorias[0]?.id ??
        ""
    );
    setNombre(producto?.nombre ?? "");
    setDescripcion(producto?.descripcion ?? "");
    setPrecioVenta(
      producto?.precioVenta
        ? String(producto.precioVenta)
        : ""
    );
    setCosto(
      producto?.costo
        ? String(producto.costo)
        : "0"
    );
    setTiempoPreparacion(
      producto
        ? String(producto.tiempoPreparacion)
        : "15"
    );
    setImagenUrl(producto?.imagenUrl ?? "");

    setControlaStock(
      producto?.controlaStock ?? false
    );

    setStockActual(
      producto
        ? String(producto.stockActual ?? "0")
        : "0"
    );

    setStockMinimo(
      producto
        ? String(producto.stockMinimo ?? "0")
        : "0"
    );

    setDisponible(producto?.disponible ?? true);
    setActivo(producto?.activo ?? true);
    setErrorLocal("");
  }, [producto, categorias]);

  async function enviarFormulario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    const nombreLimpio = nombre.trim();
    const precioNumero = Number(precioVenta);
    const costoNumero = Number(costo || 0);
    const tiempoNumero = Number(
      tiempoPreparacion
    );

    const stockActualNumero =
      Number(stockActual || 0);

    const stockMinimoNumero =
      Number(stockMinimo || 0);

    if (!categoriaId) {
      setErrorLocal(
        "Selecciona una categoría."
      );
      return;
    }

    if (nombreLimpio.length < 2) {
      setErrorLocal(
        "El nombre debe tener al menos 2 caracteres."
      );
      return;
    }

    if (
      Number.isNaN(precioNumero) ||
      precioNumero <= 0
    ) {
      setErrorLocal(
        "El precio de venta debe ser mayor a cero."
      );
      return;
    }

    if (
      Number.isNaN(costoNumero) ||
      costoNumero < 0
    ) {
      setErrorLocal(
        "El costo no puede ser negativo."
      );
      return;
    }

    if (
      !Number.isInteger(tiempoNumero) ||
      tiempoNumero < 0 ||
      tiempoNumero > 600
    ) {
      setErrorLocal(
        "El tiempo debe estar entre 0 y 600 minutos."
      );
      return;
    }

    if (
      controlaStock &&
      (
        !Number.isFinite(
          stockActualNumero
        ) ||
        stockActualNumero < 0
      )
    ) {
      setErrorLocal(
        "El stock actual no puede ser negativo."
      );
      return;
    }

    if (
      controlaStock &&
      (
        !Number.isFinite(
          stockMinimoNumero
        ) ||
        stockMinimoNumero < 0
      )
    ) {
      setErrorLocal(
        "El stock mínimo no puede ser negativo."
      );
      return;
    }

    setErrorLocal("");

    await onGuardar({
      categoriaId,
      nombre: nombreLimpio,
      descripcion: descripcion.trim(),
      precioVenta: precioNumero,
      costo: costoNumero,
      tiempoPreparacion: tiempoNumero,
      imagenUrl: imagenUrl.trim(),
      controlaStock,
      stockActual:
        controlaStock
          ? stockActualNumero
          : 0,
      stockMinimo:
        controlaStock
          ? stockMinimoNumero
          : 0,
      disponible:
        controlaStock &&
        stockActualNumero <= 0
          ? false
          : disponible,
      activo,
    });
  }

  return (
    <form
      onSubmit={enviarFormulario}
      className="space-y-6"
    >
      {errorLocal && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorLocal}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Categoría
          </label>

          <select
            value={categoriaId}
            onChange={(evento) =>
              setCategoriaId(evento.target.value)
            }
            disabled={guardando}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          >
            <option value="">
              Selecciona una categoría
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

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Nombre del producto
          </label>

          <input
            value={nombre}
            onChange={(evento) =>
              setNombre(evento.target.value)
            }
            placeholder="Ejemplo: Lomo Saltado"
            maxLength={120}
            disabled={guardando}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Descripción
        </label>

        <textarea
          value={descripcion}
          onChange={(evento) =>
            setDescripcion(evento.target.value)
          }
          placeholder="Describe los ingredientes o la presentación."
          rows={4}
          maxLength={500}
          disabled={guardando}
          className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />

        <p className="mt-1 text-right text-xs text-slate-400">
          {descripcion.length}/500
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Precio de venta
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={precioVenta}
            onChange={(evento) =>
              setPrecioVenta(evento.target.value)
            }
            placeholder="0.00"
            disabled={guardando}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Costo estimado
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={costo}
            onChange={(evento) =>
              setCosto(evento.target.value)
            }
            placeholder="0.00"
            disabled={guardando}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Preparación (min)
          </label>

          <input
            type="number"
            min="0"
            max="600"
            step="1"
            value={tiempoPreparacion}
            onChange={(evento) =>
              setTiempoPreparacion(
                evento.target.value
              )
            }
            disabled={guardando}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Dirección de la imagen
        </label>

        <input
          type="url"
          value={imagenUrl}
          onChange={(evento) =>
            setImagenUrl(evento.target.value)
          }
          placeholder="https://..."
          disabled={guardando}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />

        <p className="mt-2 text-xs text-slate-500">
          Por ahora puedes colocar una URL. En el
          siguiente avance conectaremos Vercel Blob.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt="Vista previa"
            className="h-56 w-full object-cover"
            onError={(evento) => {
              evento.currentTarget.style.display =
                "none";
            }}
          />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center text-slate-400">
            <ImageIcon size={42} />
            <p className="mt-2 text-sm font-bold">
              Vista previa de la imagen
            </p>
          </div>
        )}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <PackageOpen size={22} />
            </div>

            <div>
              <p className="font-black text-slate-950">
                Control de inventario
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Actívalo para gaseosas, bebidas, porciones u otros productos con cantidad limitada.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 font-black text-slate-800 shadow-sm">
            <span>
              Controlar stock
            </span>

            <input
              type="checkbox"
              checked={controlaStock}
              onChange={(evento) => {
                const activoStock =
                  evento.target.checked;

                setControlaStock(
                  activoStock
                );

                if (!activoStock) {
                  setStockActual("0");
                  setStockMinimo("0");
                }
              }}
              disabled={guardando}
              className="h-5 w-5 accent-amber-500"
            />
          </label>
        </div>

        {controlaStock && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Stock actual
              </label>

              <input
                type="number"
                min="0"
                step="0.001"
                value={stockActual}
                onChange={(evento) =>
                  setStockActual(
                    evento.target.value
                  )
                }
                placeholder="0.000"
                disabled={guardando}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              />

              <p className="mt-1 text-xs text-slate-500">
                Ej.: 24 gaseosas, 15 porciones o 8.500 litros.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Stock mínimo
              </label>

              <input
                type="number"
                min="0"
                step="0.001"
                value={stockMinimo}
                onChange={(evento) =>
                  setStockMinimo(
                    evento.target.value
                  )
                }
                placeholder="0.000"
                disabled={guardando}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              />

              <p className="mt-1 text-xs text-slate-500">
                Al llegar a este valor mostraremos una alerta de stock bajo.
              </p>
            </div>

            <div
              className={`sm:col-span-2 rounded-2xl border px-4 py-3 text-sm font-black ${
                Number(stockActual || 0) <= 0
                  ? "border-red-200 bg-red-50 text-red-700"
                  : Number(stockActual || 0) <=
                      Number(stockMinimo || 0)
                    ? "border-orange-200 bg-orange-50 text-orange-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {Number(stockActual || 0) <= 0
                ? "🔴 Agotado"
                : Number(stockActual || 0) <=
                    Number(stockMinimo || 0)
                  ? "🟠 Stock bajo"
                  : "🟢 Stock disponible"}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="font-black text-slate-900">
              Disponible
            </p>

            <p className="text-sm text-slate-500">
              Puede ser solicitado por los clientes.
            </p>
          </div>

          <input
            type="checkbox"
            checked={disponible}
            onChange={(evento) =>
              setDisponible(evento.target.checked)
            }
            disabled={guardando}
            className="h-5 w-5 accent-amber-500"
          />
        </label>

        {producto && (
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-black text-slate-900">
                Producto activo
              </p>

              <p className="text-sm text-slate-500">
                Se conserva en el catálogo.
              </p>
            </div>

            <input
              type="checkbox"
              checked={activo}
              onChange={(evento) =>
                setActivo(evento.target.checked)
              }
              disabled={guardando}
              className="h-5 w-5 accent-amber-500"
            />
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {guardando ? (
          <>
            <LoaderCircle
              size={20}
              className="animate-spin"
            />
            Guardando producto...
          </>
        ) : (
          <>
            <Save size={20} />
            {producto
              ? "Guardar cambios"
              : "Crear producto"}
          </>
        )}
      </button>
    </form>
  );
}