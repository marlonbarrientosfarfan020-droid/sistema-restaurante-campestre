export type OrigenPedido =
  | "CLIENTE_QR"
  | "MOZO"
  | "CAJA";

export type EstadoPedido =
  | "NUEVO"
  | "RECIBIDO"
  | "PREPARANDO"
  | "LISTO"
  | "EN_ENTREGA"
  | "ENTREGADO"
  | "ANULADO";

export type CrearDetallePedidoDTO = {
  productoId: string;
  cantidad: number;
  observacion?: string;
};

export type CrearPedidoDTO = {
  atencionId: string;
  sucursalId: string;
  registradoPorId?: string;
  origen: OrigenPedido;
  observacion?: string;
  detalles: CrearDetallePedidoDTO[];
};

export type PedidoResumen = {
  id: string;
  numero: string;
  origen: OrigenPedido;
  estado: EstadoPedido;
  observacion: string | null;
  subtotal: string;
  fechaPedido: string;

  atencion: {
    id: string;
    codigo: string;
    mesa: {
      id: string;
      numero: number;
      nombre: string;
    };
  };

  detalles: Array<{
    id: string;
    cantidad: string;
    precioUnitario: string;
    subtotal: string;
    estado: string;
    observacion: string | null;

    producto: {
      id: string;
      codigo: string;
      nombre: string;
      imagenUrl: string | null;
      tiempoPreparacion: number;
    };
  }>;
};