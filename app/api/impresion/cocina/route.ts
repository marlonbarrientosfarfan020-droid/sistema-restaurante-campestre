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
    const { pedidoId } = body;

    if (!pedidoId || typeof pedidoId !== "string") {
      return respuestaError("El identificador del pedido (pedidoId) es obligatorio.", 400);
    }

    const resultado = await printerService.imprimirComandaCocina(pedidoId);

    const mensaje = resultado.networkPrinted
      ? `Comanda enviada e impresa directamente en Cocina (${resultado.ipAddress}).`
      : `Comanda lista para impresión en navegador (${resultado.error || "Impresora de red no disponible"}).`;

    return respuestaExito(resultado, mensaje);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al imprimir comanda de cocina.";
    return respuestaError(errorMsg, 500);
  }
}
