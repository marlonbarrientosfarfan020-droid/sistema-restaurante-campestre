import { prisma } from "@/lib/prisma";

import type {
  ActualizarProductoDTO,
  CrearProductoDTO,
} from "@/types/producto";

export class ProductoRepository {
  listar() {
    return prisma.producto.findMany({
      include: {
        categoria: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },

      orderBy: {
        nombre: "asc",
      },
    });
  }

  obtenerPorId(
    id: string
  ) {
    return prisma.producto.findUnique({
      where: {
        id,
      },

      include: {
        categoria: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });
  }

  obtenerPorNombre(
    sucursalId: string,
    nombre: string
  ) {
    return prisma.producto.findFirst({
      where: {
        sucursalId,

        nombre: {
          equals: nombre,
          mode: "insensitive",
        },
      },
    });
  }

  obtenerUltimoCodigo(
    sucursalId: string
  ) {
    return prisma.producto.findFirst({
      where: {
        sucursalId,

        codigo: {
          startsWith: "PLT-",
        },
      },

      orderBy: {
        codigo: "desc",
      },

      select: {
        codigo: true,
      },
    });
  }

  obtenerCategoria(
    categoriaId: string,
    sucursalId: string
  ) {
    return prisma.categoria.findFirst({
      where: {
        id:
          categoriaId,

        sucursalId,

        activa:
          true,
      },
    });
  }

  crear(
    datos: CrearProductoDTO,
    codigo: string
  ) {
    return prisma.producto.create({
      data: {
        sucursalId:
          datos.sucursalId,

        categoriaId:
          datos.categoriaId,

        codigo,

        nombre:
          datos.nombre,

        descripcion:
          datos.descripcion,

        precioVenta:
          datos.precioVenta,

        costo:
          datos.costo ?? 0,

        tiempoPreparacion:
          datos.tiempoPreparacion ??
          15,

        imagenUrl:
          datos.imagenUrl,

        controlaStock:
          datos.controlaStock ??
          false,

        stockActual:
          datos.stockActual ??
          0,

        stockMinimo:
          datos.stockMinimo ??
          0,

        disponible:
          datos.disponible ??
          true,

        activo:
          true,
      },

      include: {
        categoria: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });
  }

  actualizar(
    id: string,
    datos: ActualizarProductoDTO
  ) {
    return prisma.producto.update({
      where: {
        id,
      },

      data: {
        categoriaId:
          datos.categoriaId,

        nombre:
          datos.nombre,

        descripcion:
          datos.descripcion,

        precioVenta:
          datos.precioVenta,

        costo:
          datos.costo ?? 0,

        tiempoPreparacion:
          datos.tiempoPreparacion ??
          15,

        imagenUrl:
          datos.imagenUrl,

        controlaStock:
          datos.controlaStock,

        stockActual:
          datos.stockActual,

        stockMinimo:
          datos.stockMinimo,

        disponible:
          datos.disponible,

        activo:
          datos.activo,
      },

      include: {
        categoria: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });
  }

  cambiarDisponibilidad(
    id: string,
    disponible: boolean
  ) {
    return prisma.producto.update({
      where: {
        id,
      },

      data: {
        disponible,
      },

      include: {
        categoria: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });
  }

  desactivar(
    id: string
  ) {
    return prisma.producto.update({
      where: {
        id,
      },

      data: {
        activo:
          false,

        disponible:
          false,
      },

      include: {
        categoria: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });
  }
}

export const productoRepository =
  new ProductoRepository();