export type RolSesion =
  | "SUPERADMIN"
  | "ADMINISTRADOR"
  | "CAJERO"
  | "MOZO"
  | "COCINA"
  | "BARRA"
  | "GERENTE";

export type SesionUsuario = {
  sub: string;
  sucursalId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolSesion;
  exp: number;
};

export const SESSION_COOKIE = "chinka_session";

function base64UrlEncode(input: Uint8Array | string) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : input;

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string) {
  const normalized = input
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function getSigningKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET debe existir y tener al menos 32 caracteres."
    );
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );
}

export async function crearTokenSesion(
  payload: Omit<SesionUsuario, "exp">,
  duracionSegundos = 60 * 60 * 12
) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const cuerpo: SesionUsuario = {
    ...payload,
    exp:
      Math.floor(Date.now() / 1000) +
      duracionSegundos,
  };

  const parteHeader = base64UrlEncode(
    JSON.stringify(header)
  );

  const partePayload = base64UrlEncode(
    JSON.stringify(cuerpo)
  );

  const contenido = `${parteHeader}.${partePayload}`;
  const key = await getSigningKey();

  const firma = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(contenido)
  );

  return `${contenido}.${base64UrlEncode(
    new Uint8Array(firma)
  )}`;
}

export async function verificarTokenSesion(
  token: string
): Promise<SesionUsuario | null> {
  try {
    const partes = token.split(".");

    if (partes.length !== 3) {
      return null;
    }

    const [header, payload, firma] = partes;
    const contenido = `${header}.${payload}`;
    const key = await getSigningKey();

    const firmaValida = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(firma),
      new TextEncoder().encode(contenido)
    );

    if (!firmaValida) {
      return null;
    }

    const datos = JSON.parse(
      new TextDecoder().decode(
        base64UrlDecode(payload)
      )
    ) as SesionUsuario;

    if (
      !datos.sub ||
      !datos.rol ||
      !datos.exp ||
      datos.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return datos;
  } catch {
    return null;
  }
}

export function rutaInicialPorRol(
  rol: RolSesion
) {
  switch (rol) {
    case "MOZO":
      return "/dashboard/mozo";

    case "COCINA":
    case "BARRA":
      return "/dashboard/cocina";

    case "CAJERO":
      return "/dashboard/caja";

    case "SUPERADMIN":
    case "ADMINISTRADOR":
    case "GERENTE":
    default:
      return "/dashboard";
  }
}
