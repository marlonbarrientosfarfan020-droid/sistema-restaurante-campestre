export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export function ok<T>(
  data: T,
  message = "Operación realizada correctamente."
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function fail(
  message: string
): ApiResponse<null> {
  return {
    success: false,
    message,
    data: null,
  };
}