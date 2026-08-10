export function generarCodigo(
  prefijo: string,
  numero: number
) {

  return `${prefijo}-${String(numero).padStart(
    6,
    "0"
  )}`;

}