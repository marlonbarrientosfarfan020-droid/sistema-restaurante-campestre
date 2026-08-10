import {
  NextRequest,
  NextResponse,
} from "next/server";

import { AppError } from "@/lib/errors";
import { fail, ok } from "@/lib/response";
import { mesaRepository } from "@/repositories/mesa.repository";

type ContextoRuta = {
  params: Promise<{
    mesaId: string;
  }>;
};

function manejarError(
  error: unknown
) {
  if (
    error instanceof AppError
  ) {
    return NextResponse.json(
      fail(error.message),
      {
        status: error.status,
      }
    );
  }

  console.error(
    "Error obteniendo mesa:",
    error
  );

  return NextResponse.json(
    fail(
      process.env.NODE_ENV ===
        "development"
        ? `Error obteniendo mesa: ${
            error instanceof Error
              ? error.message
              : "Error desconocido"
          }`
        : "No se pudo obtener la mesa."
    ),
    {
      status: 500,
    }
  );
}

export async function GET(
  _request: NextRequest,
  contexto: ContextoRuta
) {
  try {
    const {
      mesaId,
    } = await contexto.params;

    const id =
      mesaId?.trim();

    if (!id) {
      return NextResponse.json(
        fail(
          "La mesa es obligatoria."
        ),
        {
          status: 400,
        }
      );
    }

    const mesa =
      await mesaRepository.obtenerPorId(
        id
      );

    if (!mesa) {
      return NextResponse.json(
        fail(
          "La mesa no fue encontrada."
        ),
        {
          status: 404,
        }
      );
    }

    const atencionActiva =
      await mesaRepository.buscarAtencionActiva(
        id
      );

    return NextResponse.json(
      ok(
        {
          id: mesa.id,
          numero: mesa.numero,
          nombre: mesa.nombre,
          capacidad:
            mesa.capacidad,
          qrCode: mesa.qrCode,
          estado: mesa.estado,
          activa: mesa.activa,

          zona: {
            id: mesa.zona.id,
            nombre:
              mesa.zona.nombre,
            sucursalId:
              mesa.zona.sucursalId,
          },

          atencionActual:
            atencionActiva
              ? {
                  id:
                    atencionActiva.id,
                  codigo:
                    atencionActiva.codigo,
                  estado:
                    atencionActiva.estado,
                  cantidadPersonas:
                    atencionActiva.cantidadPersonas,
                  metodoPagoPrevisto:
                    atencionActiva.metodoPagoPrevisto,
                  subtotal:
                    Number(
                      atencionActiva.subtotal
                    ),
                  descuento:
                    Number(
                      atencionActiva.descuento
                    ),
                  total:
                    Number(
                      atencionActiva.total
                    ),
                  fechaApertura:
                    atencionActiva.fechaApertura.toISOString(),
                }
              : null,
        },
        "Mesa obtenida correctamente."
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}