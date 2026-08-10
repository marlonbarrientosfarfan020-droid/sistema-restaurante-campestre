export interface Categoria {
  id: string;
  sucursalId: string;

  codigo: string;
  nombre: string;
  descripcion: string | null;

  activa: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface CrearCategoriaDTO {
  sucursalId: string;
  nombre: string;
  descripcion?: string;
}

export interface ActualizarCategoriaDTO {
  nombre: string;
  descripcion?: string;
  activa: boolean;
}