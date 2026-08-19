import { NextRequest, NextResponse } from "next/server";
import { printerService } from "@/services/printer.service";
import { testPrinterConnection } from "@/lib/network-printer";
import { PrinterTarget } from "@/repositories/printer.repository";
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
    const { target, ipAddress, port, onlyPing } = body;

    if (!target || (target !== "KITCHEN" && target !== "RECEPTION")) {
      return respuestaError("El destino (target) debe ser 'KITCHEN' o 'RECEPTION'.", 400);
    }

    // Si solo se solicita ping rápido a una IP específica
    if (onlyPing && ipAddress) {
      const pingRes = await testPrinterConnection(ipAddress, Number(port) || 9100, 2500);
      return respuestaExito(
        pingRes,
        pingRes.reachable
          ? `Impresora en línea (${pingRes.latencyMs}ms).`
          : pingRes.error || "Impresora no alcanzable."
      );
    }

    // Realizar prueba completa de impresión diagnóstica
    const resultado = await printerService.imprimirTicketPrueba(target as PrinterTarget);

    const mensaje = resultado.networkPrinted
      ? `Ticket de prueba impreso correctamente en ${resultado.printerName} (${resultado.ipAddress}).`
      : `Ticket de prueba generado en modo fallback (${resultado.error || "Impresora de red inactiva o no alcanzable"}).`;

    return respuestaExito(resultado, mensaje);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al procesar prueba de impresión.";
    return respuestaError(errorMsg, 500);
  }
}
