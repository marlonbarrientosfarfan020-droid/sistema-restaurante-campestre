import { NextRequest, NextResponse } from "next/server";
import { printerService } from "@/services/printer.service";
import { SESSION_COOKIE, verificarTokenSesion } from "@/lib/session";

export const runtime = "nodejs";

function respuestaError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function respuestaExito<T>(data: T, message = "Operación exitosa") {
  return NextResponse.json({ success: true, message, data });
}

async function obtenerSesion(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verificarTokenSesion(token);
}

export async function POST(request: NextRequest) {
  try {
    const sesion = await obtenerSesion(request);
    if (!sesion) {
      return respuestaError("No autenticado.", 401);
    }

    const body = await request.json().catch(() => ({}));
    const { comprobanteId } = body;

    if (!comprobanteId || typeof comprobanteId !== "string") {
      return respuestaError("El identificador del comprobante (comprobanteId) es obligatorio.", 400);
    }

    const resultado = await printerService.imprimirComprobante(comprobanteId);

    const mensaje = resultado.networkPrinted
      ? `Comprobante impreso directamente en Caja (${resultado.ipAddress}).`
      : `Comprobante listo para impresión en navegador (${resultado.error || "Impresora de red no disponible"}).`;

    return respuestaExito(resultado, mensaje);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al imprimir comprobante.";
    return respuestaError(errorMsg, 500);
  }
}
