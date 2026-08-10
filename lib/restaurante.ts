import type {
  EstadoProducto,
  Mesa,
} from "@/types/restaurante";

export function obtenerTotalMesa(mesa: Mesa) {
  return mesa.productos.reduce(
    (total, producto) =>
      total + producto.cantidad * producto.precio,
    0
  );
}

export function obtenerPendientesMesa(mesa: Mesa) {
  return mesa.productos.filter(
    (producto) => producto.estado !== "ENTREGADO"
  ).length;
}

export function textoEstadoProducto(
  estado: EstadoProducto
) {
  const textos: Record<EstadoProducto, string> = {
    NUEVO: "Nuevo",
    PREPARANDO: "Preparando",
    LISTO: "Listo",
    ENTREGADO: "Entregado",
  };

  return textos[estado];
}

export function colorEstadoProducto(
  estado: EstadoProducto
) {
  const colores: Record<EstadoProducto, string> = {
    NUEVO: "bg-orange-100 text-orange-700",
    PREPARANDO: "bg-amber-100 text-amber-700",
    LISTO: "bg-sky-100 text-sky-700",
    ENTREGADO: "bg-emerald-100 text-emerald-700",
  };

  return colores[estado];
}