export type TipoComprobante =
  | "NOTA_VENTA"
  | "BOLETA"
  | "FACTURA";

export type Comprobante = {
  id: string;

  sucursalId: string;
  atencionId: string;

  tipo: TipoComprobante;

  serie: string;
  correlativo: number;
  numero: string;

  clienteDocumento: string | null;
  clienteNombre: string | null;
  clienteDireccion: string | null;

  subtotal: string;
  igv: string;
  total: string;

  emitido: boolean;
  fechaEmision: string;

  createdAt: string;
  updatedAt: string;
};

export type CrearNotaVentaDTO = {
  atencionId: string;

  clienteDocumento?: string;
  clienteNombre?: string;
  clienteDireccion?: string;
};