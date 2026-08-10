import { AppError } from "@/lib/errors";
import { generarCodigo } from "@/lib/utils";
import { categoriaRepository } from "@/repositories/categoria.repository";

import type {
  ActualizarCategoriaDTO,
  CrearCategoriaDTO,
} from "@/types/categoria";

export class CategoriaService {
  async listar() {
    return categoriaRepository.listar();
  }

  async obtenerPorId(id: string) {
    if (!id?.trim()) {
      throw new AppError(
        "El identificador de la categoría es obligatorio.",
        400
      );
    }

    const categoria =
      await categoriaRepository.obtenerPorId(id);

    if (!categoria) {
      throw new AppError(
        "La categoría no fue encontrada.",
        404
      );
    }

    return categoria;
  }

  async crear(datos: CrearCategoriaDTO) {
    const sucursalId = datos.sucursalId?.trim();
    const nombre = datos.nombre?.trim();
    const descripcion =
      datos.descripcion?.trim() || undefined;

    if (!sucursalId) {
      throw new AppError(
        "La sucursal es obligatoria.",
        400
      );
    }

    if (!nombre) {
      throw new AppError(
        "El nombre de la categoría es obligatorio.",
        400
      );
    }

    if (nombre.length < 2) {
      throw new AppError(
        "El nombre debe tener al menos 2 caracteres.",
        400
      );
    }

    const categoriaExistente =
      await categoriaRepository.obtenerPorNombre(
        sucursalId,
        nombre
      );

    if (categoriaExistente) {
      throw new AppError(
        "Ya existe una categoría con ese nombre.",
        409
      );
    }

    const totalCategorias =
      await categoriaRepository.contar(sucursalId);

    const codigo = generarCodigo(
      "CAT",
      totalCategorias + 1
    );

    return categoriaRepository.crear(
      {
        sucursalId,
        nombre,
        descripcion,
      },
      codigo
    );
  }

  async actualizar(
    id: string,
    datos: ActualizarCategoriaDTO
  ) {
    const categoriaActual =
      await this.obtenerPorId(id);

    const nombre = datos.nombre?.trim();
    const descripcion =
      datos.descripcion?.trim() || undefined;

    if (!nombre) {
      throw new AppError(
        "El nombre de la categoría es obligatorio.",
        400
      );
    }

    const categoriaConMismoNombre =
      await categoriaRepository.obtenerPorNombre(
        categoriaActual.sucursalId,
        nombre
      );

    if (
      categoriaConMismoNombre &&
      categoriaConMismoNombre.id !== id
    ) {
      throw new AppError(
        "Ya existe otra categoría con ese nombre.",
        409
      );
    }

    return categoriaRepository.actualizar(id, {
      nombre,
      descripcion,
      activa: datos.activa,
    });
  }

  async desactivar(id: string) {
    const categoria =
      await this.obtenerPorId(id);

    if (!categoria.activa) {
      throw new AppError(
        "La categoría ya se encuentra inactiva.",
        400
      );
    }

    return categoriaRepository.desactivar(id);
  }
}

export const categoriaService =
  new CategoriaService();