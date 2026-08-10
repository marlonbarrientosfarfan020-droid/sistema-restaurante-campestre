import { AppError } from "@/lib/errors";

import {
  comprobanteRepository,
} from "@/repositories/comprobante.repository";

import type {
  CrearNotaVentaDTO,
} from "@/types/comprobante";

export class ComprobanteService {
  async listarNotasVenta() {
    return comprobanteRepository.listarNotasVenta();
  }

  async obtenerNotaVenta(
    id: string
  ) {
    const comprobanteId =
      id?.trim();

    if (!comprobanteId) {
      throw new AppError(
        "El identificador de la nota de venta es obligatorio.",
        400
      );
    }

    const nota =
      await comprobanteRepository.obtenerNotaVenta(
        comprobanteId
      );

    if (!nota) {
      throw new AppError(
        "La nota de venta no fue encontrada.",
        404
      );
    }

    return nota;
  }

  async crearNotaVenta(
    datos: CrearNotaVentaDTO
  ) {
    const atencionId =
      datos.atencionId?.trim();

    if (!atencionId) {
      throw new AppError(
        "La atención es obligatoria.",
        400
      );
    }

    const clienteDocumento =
      datos.clienteDocumento?.trim() ||
      undefined;

    const clienteNombre =
      datos.clienteNombre?.trim() ||
      undefined;

    const clienteDireccion =
      datos.clienteDireccion?.trim() ||
      undefined;

    /*
     * Para una Nota de Venta los datos
     * del cliente son opcionales.
     *
     * Cuando hagamos BOLETA y FACTURA
     * aplicaremos validaciones distintas.
     */

    if (
      clienteDocumento &&
      clienteDocumento.length > 20
    ) {
      throw new AppError(
        "El documento del cliente no es válido.",
        400
      );
    }

    if (
      clienteNombre &&
      clienteNombre.length > 200
    ) {
      throw new AppError(
        "El nombre del cliente es demasiado largo.",
        400
      );
    }

    if (
      clienteDireccion &&
      clienteDireccion.length > 300
    ) {
      throw new AppError(
        "La dirección del cliente es demasiado larga.",
        400
      );
    }

    try {
      return await comprobanteRepository.crearNotaVenta({
        atencionId,
        clienteDocumento,
        clienteNombre,
        clienteDireccion,
      });
    } catch (error) {
      if (
        error instanceof Error
      ) {
        if (
          error.message ===
          "ATENCION_NO_EXISTE"
        ) {
          throw new AppError(
            "La atención no existe.",
            404
          );
        }

        if (
          error.message ===
          "ATENCION_NO_PAGADA"
        ) {
          throw new AppError(
            "Solo puedes generar una nota de venta para una atención pagada.",
            400
          );
        }

        if (
          error.message.startsWith(
            "NOTA_VENTA_YA_EXISTE|"
          )
        ) {
          const numero =
            error.message.split(
              "|"
            )[1];

          throw new AppError(
            `Esta atención ya tiene la Nota de Venta ${numero}.`,
            409
          );
        }

        /*
         * Prisma también protege la
         * numeración mediante índices
         * únicos en la base de datos.
         */
        if (
          error.message.includes(
            "Unique constraint"
          )
        ) {
          throw new AppError(
            "No se pudo asignar el correlativo de la Nota de Venta. Intenta nuevamente.",
            409
          );
        }
      }

      throw error;
    }
  }
}

export const comprobanteService =
  new ComprobanteService();