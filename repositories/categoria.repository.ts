import { prisma } from "@/lib/prisma";
import type {
  CrearCategoriaDTO,
  ActualizarCategoriaDTO,
} from "@/types/categoria";

export class CategoriaRepository {
  listar() {
    return prisma.categoria.findMany({
      where: {
        activa: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });
  }

  obtenerPorId(id: string) {
    return prisma.categoria.findUnique({
      where: {
        id,
      },
    });
  }

  obtenerPorNombre(
    sucursalId: string,
    nombre: string
  ) {
    return prisma.categoria.findFirst({
      where: {
        sucursalId,
        nombre: {
          equals: nombre,
          mode: "insensitive",
        },
      },
    });
  }

  contar(sucursalId: string) {
    return prisma.categoria.count({
      where: {
        sucursalId,
      },
    });
  }

  crear(data: CrearCategoriaDTO, codigo: string) {
    return prisma.categoria.create({
      data: {
        ...data,
        codigo,
      },
    });
  }

  actualizar(
    id: string,
    data: ActualizarCategoriaDTO
  ) {
    return prisma.categoria.update({
      where: {
        id,
      },
      data,
    });
  }

  desactivar(id: string) {
    return prisma.categoria.update({
      where: {
        id,
      },
      data: {
        activa: false,
      },
    });
  }
}

export const categoriaRepository =
  new CategoriaRepository();