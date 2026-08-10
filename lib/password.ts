import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(
    password,
    salt,
    KEY_LENGTH
  ).toString("hex");

  return `scrypt$${salt}$${derivedKey}`;
}

export function verificarPassword(
  password: string,
  almacenado: string
) {
  if (!almacenado.startsWith("scrypt$")) {
    return {
      valido: password === almacenado,
      legado: true,
    };
  }

  const [, salt, hashHex] = almacenado.split("$");

  if (!salt || !hashHex) {
    return {
      valido: false,
      legado: false,
    };
  }

  const candidato = scryptSync(
    password,
    salt,
    KEY_LENGTH
  );

  const esperado = Buffer.from(hashHex, "hex");

  if (candidato.length !== esperado.length) {
    return {
      valido: false,
      legado: false,
    };
  }

  return {
    valido: timingSafeEqual(
      candidato,
      esperado
    ),
    legado: false,
  };
}
