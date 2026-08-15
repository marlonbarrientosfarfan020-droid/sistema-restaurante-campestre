import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  EstadoAtencion,
} from "@/app/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  fail,
  ok,
} from "@/lib/response";
import { cajaService } from "@/services/caja.service";

export const runtime = "nodejs";

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
    "Error liberando mesa desde QR:",
    error
  );

  return NextResponse.json(
    fail(
      process.env.NODE_ENV ===
        "development"
        ? `Error liberando mesa: ${
            error instanceof Error
              ? error.message
              : "Error desconocido"
          }`
        : "No se pudo liberar la mesa."
    ),
    {
      status: 500,
    }
  );
}

export async function POST(
  _request: NextRequest,
  contexto: ContextoRuta
) {
  try {
    const {
      mesaId: mesaIdParametro,
    } =
      await contexto.params;

    const mesaId =
      mesaIdParametro?.trim();

    if (!mesaId) {
      return NextResponse.json(
        fail(
          "La mesa es obligatoria."
        ),
        {
          status: 400,
        }
      );
    }

    const atencion =
      await prisma.atencion.findFirst({
        where: {
          mesaId,
          estado:
            EstadoAtencion.PAGADA,
        },
        orderBy: {
          fechaPago: "desc",
        },
        select: {
          id: true,
          codigo: true,
          mesa: {
            select: {
              id: true,
              nombre: true,
              estado: true,
            },
          },
        },
      });

    if (!atencion) {
      return NextResponse.json(
        fail(
          "No existe una atención pagada pendiente de liberar para esta mesa."
        ),
        {
          status: 409,
        }
      );
    }

    const resultado =
      await cajaService.liberarMesa(
        atencion.id
      );

    return NextResponse.json(
      ok(
        resultado,
        `${atencion.mesa.nombre} liberada correctamente.`
      )
    );
  } catch (error) {
    return manejarError(error);
  }
}
