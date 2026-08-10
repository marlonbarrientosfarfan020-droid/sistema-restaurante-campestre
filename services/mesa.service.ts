import {
  MetodoPago,
} from "@/app/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { mesaRepository } from "@/repositories/mesa.repository";

import type {
  AbrirAtencionDTO,
} from "@/types/mesa";

function generarCodigoAtencion() {
  const ahora = new Date();

  const fecha = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
  ].join("");

  const hora = [
    String(ahora.getHours()).padStart(2, "0"),
    String(ahora.getMinutes()).padStart(2, "0"),
    String(ahora.getSeconds()).padStart(2, "0"),
  ].join("");

  const aleatorio = String(
    Math.floor(Math.random() * 1000)
  ).padStart(3, "0");

  return `AT-${fecha}-${hora}${aleatorio}`;
}

export class MesaService {
  async listar(sucursalId: string) {
    const id = sucursalId?.trim();

    if (!id) {
      throw new AppError(
        "El identificador de la sucursal es obligatorio.",
        400
      );
    }

    const mesas =
      await mesaRepository.listarPorSucursal(id);

    return mesas.map((mesa) => {
      const atencion = mesa.atenciones[0] ?? null;

      return {
        id: mesa.id,
        numero: mesa.numero,
        nombre: mesa.nombre,
        capacidad: mesa.capacidad,
        qrCode: mesa.qrCode,
        estado: mesa.estado,
        activa: mesa.activa,
        zona: mesa.zona,

        atencionActual: atencion
          ? {
              id: atencion.id,
              codigo: atencion.codigo,
              estado: atencion.estado,
              cantidadPersonas:
                atencion.cantidadPersonas,
              metodoPagoPrevisto:
                atencion.metodoPagoPrevisto,
              subtotal: atencion.subtotal.toString(),
              descuento:
                atencion.descuento.toString(),
              total: atencion.total.toString(),
              fechaApertura:
                atencion.fechaApertura.toISOString(),
              mozo: atencion.mozo,
              cantidadPedidos:
                atencion._count.pedidos,
            }
          : null,
      };
    });
  }

  async abrirAtencion(
    datos: AbrirAtencionDTO
  ) {
    const mesaId = datos.mesaId?.trim();
    const sucursalId =
      datos.sucursalId?.trim();
    const mozoId =
      datos.mozoId?.trim() || undefined;

    if (!mesaId) {
      throw new AppError(
        "La mesa es obligatoria.",
        400
      );
    }

    if (!sucursalId) {
      throw new AppError(
        "La sucursal es obligatoria.",
        400
      );
    }

    if (
      !Number.isInteger(datos.cantidadPersonas) ||
      datos.cantidadPersonas < 1 ||
      datos.cantidadPersonas > 100
    ) {
      throw new AppError(
        "La cantidad de personas debe estar entre 1 y 100.",
        400
      );
    }

    const mesa =
      await mesaRepository.obtenerPorId(mesaId);

    if (!mesa) {
      throw new AppError(
        "La mesa no fue encontrada.",
        404
      );
    }

    if (!mesa.activa) {
      throw new AppError(
        "La mesa se encuentra inactiva.",
        400
      );
    }

    if (mesa.zona.sucursalId !== sucursalId) {
      throw new AppError(
        "La mesa no pertenece a la sucursal seleccionada.",
        400
      );
    }

    const atencionActiva =
      await mesaRepository.buscarAtencionActiva(
        mesaId
      );

    if (atencionActiva) {
      throw new AppError(
        `La mesa ya tiene abierta la atención ${atencionActiva.codigo}.`,
        409
      );
    }

    try {
      return await mesaRepository.abrirAtencion({
        mesaId,
        sucursalId,
        mozoId,
        codigo: generarCodigoAtencion(),
        cantidadPersonas:
          datos.cantidadPersonas,
        metodoPagoPrevisto:
          datos.metodoPagoPrevisto
            ? MetodoPago[
                datos.metodoPagoPrevisto
              ]
            : undefined,
        observacion:
          datos.observacion?.trim() ||
          undefined,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "ATENCION_ACTIVA_EXISTENTE"
      ) {
        throw new AppError(
          "La mesa ya posee una atención activa.",
          409
        );
      }

      throw error;
    }
  }
}

export const mesaService =
  new MesaService();