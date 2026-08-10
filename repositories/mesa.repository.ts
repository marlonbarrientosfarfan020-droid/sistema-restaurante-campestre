import { prisma } from "@/lib/prisma";

import {
  EstadoAtencion,
  EstadoMesa,
  MetodoPago,
} from "@/app/generated/prisma/client";

type CrearAtencionRepositorio = {
  mesaId: string;
  sucursalId: string;
  mozoId?: string;
  codigo: string;
  cantidadPersonas: number;
  metodoPagoPrevisto?: MetodoPago;
  observacion?: string;
};

const ESTADOS_ATENCION_ACTIVA: EstadoAtencion[] = [
  EstadoAtencion.ABIERTA,
  EstadoAtencion.SOLICITO_CUENTA,
  EstadoAtencion.PAGADA,
];

export class MesaRepository {
  listarPorSucursal(sucursalId: string) {
    return prisma.mesa.findMany({
      where: {
        activa: true,
        zona: {
          sucursalId,
        },
      },
      include: {
        zona: {
          select: {
            id: true,
            nombre: true,
          },
        },
        atenciones: {
          where: {
            estado: {
              in: ESTADOS_ATENCION_ACTIVA,
            },
          },
          orderBy: {
            fechaApertura: "desc",
          },
          take: 1,
          include: {
            mozo: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },
            _count: {
              select: {
                pedidos: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          zona: {
            nombre: "asc",
          },
        },
        {
          numero: "asc",
        },
      ],
    });
  }

  obtenerPorId(id: string) {
    return prisma.mesa.findUnique({
      where: {
        id,
      },
      include: {
        zona: {
          select: {
            id: true,
            nombre: true,
            sucursalId: true,
          },
        },
      },
    });
  }

  buscarAtencionActiva(mesaId: string) {
    return prisma.atencion.findFirst({
      where: {
        mesaId,
        estado: {
          in: ESTADOS_ATENCION_ACTIVA,
        },
      },
      orderBy: {
        fechaApertura: "desc",
      },
    });
  }

  obtenerUltimaAtencion(sucursalId: string) {
    return prisma.atencion.findFirst({
      where: {
        sucursalId,
        codigo: {
          startsWith: "AT-",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        codigo: true,
      },
    });
  }

  async abrirAtencion(
    datos: CrearAtencionRepositorio
  ) {
    return prisma.$transaction(async (tx) => {
      const atencionExistente =
        await tx.atencion.findFirst({
          where: {
            mesaId: datos.mesaId,
            estado: {
              in: ESTADOS_ATENCION_ACTIVA,
            },
          },
        });

      if (atencionExistente) {
        throw new Error(
          "ATENCION_ACTIVA_EXISTENTE"
        );
      }

      const atencion = await tx.atencion.create({
        data: {
          sucursalId: datos.sucursalId,
          mesaId: datos.mesaId,
          mozoId: datos.mozoId,
          codigo: datos.codigo,
          cantidadPersonas:
            datos.cantidadPersonas,
          metodoPagoPrevisto:
            datos.metodoPagoPrevisto,
          observacion: datos.observacion,
          estado: EstadoAtencion.ABIERTA,
        },
        include: {
          mesa: {
            select: {
              id: true,
              numero: true,
              nombre: true,
            },
          },
          mozo: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
      });

      await tx.mesa.update({
        where: {
          id: datos.mesaId,
        },
        data: {
          estado: EstadoMesa.OCUPADA,
        },
      });

      return atencion;
    });
  }
}

export const mesaRepository =
  new MesaRepository();