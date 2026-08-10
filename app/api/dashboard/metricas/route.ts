import {
  NextResponse,
} from "next/server";

import {
  AppError,
} from "@/lib/errors";

import {
  fail,
  ok,
} from "@/lib/response";

import {
  cajaService,
} from "@/services/caja.service";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const metricas =
      await cajaService.obtenerMetricasDashboard();

    return NextResponse.json(
      ok(
        metricas,
        "Métricas del panel obtenidas correctamente."
      )
    );
  } catch (error) {
    if (
      error instanceof
      AppError
    ) {
      return NextResponse.json(
        fail(
          error.message
        ),
        {
          status:
            error.status,
        }
      );
    }

    console.error(
      "Error obteniendo métricas del dashboard:",
      error
    );

    return NextResponse.json(
      fail(
        "No se pudieron obtener las métricas del panel."
      ),
      {
        status: 500,
      }
    );
  }
}