export type EstadoMesa =
  | "LIBRE"
  | "OCUPADA"
  | "PEDIDO_PENDIENTE"
  | "SOLICITO_CUENTA"
  | "PAGADA";

export type EstadoProducto =
  | "NUEVO"
  | "PREPARANDO"
  | "LISTO"
  | "ENTREGADO";

export type MetodoPago =
  | "EFECTIVO"
  | "YAPE"
  | "PLIN"
  | "TARJETA"
  | "MIXTO";

export type TipoComprobante =
  | "NOTA_VENTA"
  | "BOLETA"
  | "FACTURA";

export type ProductoTicket = {
  id: number;
  nombre: string;
  cantidad: number;
  precio: number;
  estado: EstadoProducto;
  hora: string;
};

export type Mesa = {
  id: number;
  numero: string;
  estado: EstadoMesa;
  mozo?: string;
  tiempo?: string;
  atencion?: string;
  orden?: string;
  metodoPago?: MetodoPago;
  tipoComprobante?: TipoComprobante;
  productos: ProductoTicket[];
};

export type ProductoMenu = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion: string;
  imagenUrl?: string;
  disponible?: boolean;
};