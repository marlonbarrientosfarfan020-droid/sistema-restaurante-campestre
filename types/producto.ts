export type CategoriaProducto = {
  id: string;
  codigo: string;
  nombre: string;
};

export type Producto = {
  id: string;
  sucursalId: string;
  categoriaId: string;

  codigo: string;
  nombre: string;
  descripcion: string | null;

  precioVenta: string;
  costo: string;
  tiempoPreparacion: number;

  imagenUrl: string | null;

  controlaStock: boolean;
  stockActual: string;
  stockMinimo: string;

  disponible: boolean;
  activo: boolean;

  categoria: CategoriaProducto;

  createdAt: string;
  updatedAt: string;
};

export type CrearProductoDTO = {
  sucursalId: string;
  categoriaId: string;

  nombre: string;
  descripcion?: string;

  precioVenta: number;
  costo?: number;
  tiempoPreparacion?: number;

  imagenUrl?: string;

  controlaStock?: boolean;
  stockActual?: number;
  stockMinimo?: number;

  disponible?: boolean;
};

export type ActualizarProductoDTO = {
  categoriaId: string;

  nombre: string;
  descripcion?: string;

  precioVenta: number;
  costo?: number;
  tiempoPreparacion?: number;

  imagenUrl?: string;

  controlaStock: boolean;
  stockActual: number;
  stockMinimo: number;

  disponible: boolean;
  activo: boolean;
};