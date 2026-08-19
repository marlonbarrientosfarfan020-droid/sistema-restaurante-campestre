import { NextRequest, NextResponse } from "next/server";
import { printerRepository, PrinterTarget } from "@/repositories/printer.repository";
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

export async function GET(request: NextRequest) {
  try {
    const sesion = await obtenerSesion(request);
    if (!sesion) {
      return respuestaError("No autenticado.", 401);
    }

    const impresoras = await printerRepository.obtenerTodas();
    return respuestaExito(impresoras, "Configuración de impresoras obtenida correctamente.");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener configuraciones.";
    return respuestaError(errorMsg, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sesion = await obtenerSesion(request);
    if (!sesion) {
      return respuestaError("No autenticado.", 401);
    }

    if (sesion.rol !== "SUPERADMIN" && sesion.rol !== "ADMINISTRADOR" && sesion.rol !== "GERENTE") {
      return respuestaError("No tienes permisos para modificar la configuración de impresoras.", 403);
    }

    const body = await request.json();
    const { target, name, ipAddress, port, paperWidth, isActive, autoPrint } = body;

    if (!target || (target !== "KITCHEN" && target !== "RECEPTION")) {
      return respuestaError("El destino (target) debe ser 'KITCHEN' o 'RECEPTION'.", 400);
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return respuestaError("El nombre de la impresora es obligatorio.", 400);
    }

    if (!ipAddress || typeof ipAddress !== "string" || !ipAddress.trim()) {
      return respuestaError("La dirección IP es obligatoria.", 400);
    }

    const portNum = Number(port);
    if (!Number.isInteger(portNum) || portNum <= 0 || portNum > 65535) {
      return respuestaError("El puerto debe ser un número válido entre 1 y 65535.", 400);
    }

    if (paperWidth !== "58mm" && paperWidth !== "80mm") {
      return respuestaError("El ancho de papel debe ser '58mm' o '80mm'.", 400);
    }

    const actualizada = await printerRepository.guardarConfiguracion({
      target: target as PrinterTarget,
      name: name.trim(),
      ipAddress: ipAddress.trim(),
      port: portNum,
      paperWidth,
      isActive: Boolean(isActive),
      autoPrint: Boolean(autoPrint),
    });

    return respuestaExito(actualizada, "Configuración de impresora guardada correctamente.");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al guardar configuración.";
    return respuestaError(errorMsg, 500);
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
