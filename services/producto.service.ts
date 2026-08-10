import { AppError } from "@/lib/errors";
import { generarCodigo } from "@/lib/utils";
import { productoRepository } from "@/repositories/producto.repository";

import type {
  ActualizarProductoDTO,
  CrearProductoDTO,
} from "@/types/producto";

function validarPrecio(
  valor: number,
  campo: string
) {
  if (
    typeof valor !== "number" ||
    Number.isNaN(valor) ||
    valor < 0
  ) {
    throw new AppError(
      `${campo} debe ser un número válido mayor o igual a cero.`,
      400
    );
  }
}

function validarStock(
  valor: number,
  campo: string
) {
  if (
    typeof valor !== "number" ||
    Number.isNaN(valor) ||
    !Number.isFinite(valor) ||
    valor < 0
  ) {
    throw new AppError(
      `${campo} debe ser un número válido mayor o igual a cero.`,
      400
    );
  }
}

export class ProductoService {
  async listar() {
    return productoRepository.listar();
  }

  async obtenerPorId(
    id: string
  ) {
    if (!id?.trim()) {
      throw new AppError(
        "El identificador del producto es obligatorio.",
        400
      );
    }

    const producto =
      await productoRepository.obtenerPorId(
        id
      );

    if (!producto) {
      throw new AppError(
        "El producto no fue encontrado.",
        404
      );
    }

    return producto;
  }

  async crear(
    datos: CrearProductoDTO
  ) {
    const sucursalId =
      datos.sucursalId?.trim();

    const categoriaId =
      datos.categoriaId?.trim();

    const nombre =
      datos.nombre?.trim();

    const descripcion =
      datos.descripcion?.trim() ||
      undefined;

    const imagenUrl =
      datos.imagenUrl?.trim() ||
      undefined;

    if (!sucursalId) {
      throw new AppError(
        "La sucursal es obligatoria.",
        400
      );
    }

    if (!categoriaId) {
      throw new AppError(
        "La categoría es obligatoria.",
        400
      );
    }

    if (
      !nombre ||
      nombre.length < 2
    ) {
      throw new AppError(
        "El nombre debe tener al menos 2 caracteres.",
        400
      );
    }

    validarPrecio(
      datos.precioVenta,
      "El precio de venta"
    );

    validarPrecio(
      datos.costo ?? 0,
      "El costo"
    );

    const tiempoPreparacion =
      datos.tiempoPreparacion ??
      15;

    if (
      !Number.isInteger(
        tiempoPreparacion
      ) ||
      tiempoPreparacion < 0 ||
      tiempoPreparacion > 600
    ) {
      throw new AppError(
        "El tiempo de preparación debe estar entre 0 y 600 minutos.",
        400
      );
    }

    const controlaStock =
      datos.controlaStock ??
      false;

    const stockActual =
      controlaStock
        ? Number(
            datos.stockActual ??
              0
          )
        : 0;

    const stockMinimo =
      controlaStock
        ? Number(
            datos.stockMinimo ??
              0
          )
        : 0;

    validarStock(
      stockActual,
      "El stock actual"
    );

    validarStock(
      stockMinimo,
      "El stock mínimo"
    );

    const categoria =
      await productoRepository.obtenerCategoria(
        categoriaId,
        sucursalId
      );

    if (!categoria) {
      throw new AppError(
        "La categoría seleccionada no existe o está inactiva.",
        400
      );
    }

    const existente =
      await productoRepository.obtenerPorNombre(
        sucursalId,
        nombre
      );

    if (existente) {
      throw new AppError(
        "Ya existe un producto con ese nombre.",
        409
      );
    }

    const ultimo =
      await productoRepository.obtenerUltimoCodigo(
        sucursalId
      );

    const ultimoNumero =
      ultimo
        ? Number(
            ultimo.codigo.replace(
              "PLT-",
              ""
            )
          )
        : 0;

    const codigo =
      generarCodigo(
        "PLT",
        ultimoNumero + 1
      );

    const disponible =
      controlaStock
        ? stockActual > 0 &&
          (datos.disponible ??
            true)
        : datos.disponible ??
          true;

    return productoRepository.crear(
      {
        sucursalId,
        categoriaId,
        nombre,
        descripcion,
        precioVenta:
          datos.precioVenta,
        costo:
          datos.costo ?? 0,
        tiempoPreparacion,
        imagenUrl,

        controlaStock,
        stockActual,
        stockMinimo,

        disponible,
      },
      codigo
    );
  }

  async actualizar(
    id: string,
    datos: ActualizarProductoDTO
  ) {
    const productoActual =
      await this.obtenerPorId(
        id
      );

    const categoriaId =
      datos.categoriaId?.trim();

    const nombre =
      datos.nombre?.trim();

    const descripcion =
      datos.descripcion?.trim() ||
      undefined;

    const imagenUrl =
      datos.imagenUrl?.trim() ||
      undefined;

    if (!categoriaId) {
      throw new AppError(
        "La categoría es obligatoria.",
        400
      );
    }

    if (
      !nombre ||
      nombre.length < 2
    ) {
      throw new AppError(
        "El nombre debe tener al menos 2 caracteres.",
        400
      );
    }

    validarPrecio(
      datos.precioVenta,
      "El precio de venta"
    );

    validarPrecio(
      datos.costo ?? 0,
      "El costo"
    );

    const tiempoPreparacion =
      datos.tiempoPreparacion ??
      15;

    if (
      !Number.isInteger(
        tiempoPreparacion
      ) ||
      tiempoPreparacion < 0 ||
      tiempoPreparacion > 600
    ) {
      throw new AppError(
        "El tiempo de preparación debe estar entre 0 y 600 minutos.",
        400
      );
    }

    const controlaStock =
      datos.controlaStock;

    const stockActual =
      controlaStock
        ? Number(
            datos.stockActual ??
              0
          )
        : 0;

    const stockMinimo =
      controlaStock
        ? Number(
            datos.stockMinimo ??
              0
          )
        : 0;

    validarStock(
      stockActual,
      "El stock actual"
    );

    validarStock(
      stockMinimo,
      "El stock mínimo"
    );

    const categoria =
      await productoRepository.obtenerCategoria(
        categoriaId,
        productoActual.sucursalId
      );

    if (!categoria) {
      throw new AppError(
        "La categoría seleccionada no existe o está inactiva.",
        400
      );
    }

    const productoConMismoNombre =
      await productoRepository.obtenerPorNombre(
        productoActual.sucursalId,
        nombre
      );

    if (
      productoConMismoNombre &&
      productoConMismoNombre.id !==
        id
    ) {
      throw new AppError(
        "Ya existe otro producto con ese nombre.",
        409
      );
    }

    const disponible =
      controlaStock
        ? stockActual > 0 &&
          datos.disponible
        : datos.disponible;

    return productoRepository.actualizar(
      id,
      {
        categoriaId,
        nombre,
        descripcion,
        precioVenta:
          datos.precioVenta,
        costo:
          datos.costo ?? 0,
        tiempoPreparacion,
        imagenUrl,

        controlaStock,
        stockActual,
        stockMinimo,

        disponible,
        activo:
          datos.activo,
      }
    );
  }

  async cambiarDisponibilidad(
    id: string,
    disponible: boolean
  ) {
    const producto =
      await this.obtenerPorId(
        id
      );

    if (
      disponible &&
      producto.controlaStock &&
      Number(
        producto.stockActual
      ) <= 0
    ) {
      throw new AppError(
        "No puedes marcar el producto como disponible porque no tiene stock.",
        409
      );
    }

    return productoRepository.cambiarDisponibilidad(
      id,
      disponible
    );
  }

  async desactivar(
    id: string
  ) {
    const producto =
      await this.obtenerPorId(
        id
      );

    if (!producto.activo) {
      throw new AppError(
        "El producto ya se encuentra inactivo.",
        400
      );
    }

    return productoRepository.desactivar(
      id
    );
  }
}

export const productoService =
  new ProductoService();