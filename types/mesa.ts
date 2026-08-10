export type EstadoMesa =
  | "LIBRE"
  | "OCUPADA"
  | "PEDIDO_PENDIENTE"
  | "CONSUMIENDO"
  | "SOLICITO_CUENTA"
  | "PAGADA"
  | "LIMPIEZA";

export type MesaResumen = {
  id: string;
  numero: number;
  nombre: string;
  capacidad: number;
  qrCode: string | null;
  estado: EstadoMesa;
  activa: boolean;

  zona: {
    id: string;
    nombre: string;
  };

  atencionActual: {
    id: string;
    codigo: string;
    estado: string;
    cantidadPersonas: number;
    metodoPagoPrevisto: string | null;
    subtotal: string;
    descuento: string;
    total: string;
    fechaApertura: string;
    mozo: {
      id: string;
      nombres: string;
      apellidos: string;
    } | null;
    cantidadPedidos: number;
  } | null;
};

export type AbrirAtencionDTO = {
  mesaId: string;
  sucursalId: string;
  mozoId?: string;
  cantidadPersonas: number;
  metodoPagoPrevisto?:
    | "EFECTIVO"
    | "YAPE"
    | "PLIN"
    | "TARJETA"
    | "MIXTO";
  observacion?: string;
};