import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  SESSION_COOKIE,
  verificarTokenSesion,
} from "@/lib/session";

export async function GET(
  request: NextRequest
) {
  const token = request.cookies.get(
    SESSION_COOKIE
  )?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "No autenticado.",
      },
      {
        status: 401,
      }
    );
  }

  const sesion =
    await verificarTokenSesion(token);

  if (!sesion) {
    return NextResponse.json(
      {
        success: false,
        message: "Sesión inválida o vencida.",
      },
      {
        status: 401,
      }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Sesión activa.",
    data: sesion,
  });
}