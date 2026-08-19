import net from "node:net";

export type PrintNetworkResult = {
  success: boolean;
  error?: string;
  bytesWritten?: number;
};

export type PingResult = {
  reachable: boolean;
  latencyMs?: number;
  error?: string;
};

/**
 * Envía un buffer de comandos ESC/POS a una impresora de red vía TCP/IP en el puerto 9100.
 */
export async function sendToNetworkPrinter(
  ipAddress: string,
  port = 9100,
  data: Buffer,
  timeoutMs = 3500
): Promise<PrintNetworkResult> {
  return new Promise((resolve) => {
    const ip = ipAddress.trim();
    if (!ip) {
      return resolve({
        success: false,
        error: "Dirección IP de la impresora no especificada.",
      });
    }

    const socket = new net.Socket();
    let hasResolved = false;

    const cleanup = () => {
      if (!socket.destroyed) {
        socket.destroy();
      }
    };

    // Temporizador de timeout
    socket.setTimeout(timeoutMs);

    socket.on("timeout", () => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({
          success: false,
          error: `Tiempo de espera agotado (${timeoutMs}ms) al conectar con la impresora en ${ip}:${port}.`,
        });
      }
    });

    socket.on("error", (err) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        const errorMsg =
          err.name === "Error" && (err as NodeJS.ErrnoException).code === "ECONNREFUSED"
            ? `Conexión rechazada por la impresora en ${ip}:${port}. Verifique que esté encendida y en el puerto 9100.`
            : `Error de red con la impresora (${ip}:${port}): ${err.message}`;
        resolve({
          success: false,
          error: errorMsg,
        });
      }
    });

    socket.connect(port, ip, () => {
      socket.write(data, (err) => {
        if (!hasResolved) {
          hasResolved = true;
          if (err) {
            cleanup();
            resolve({
              success: false,
              error: `Error al transferir datos a la impresora: ${err.message}`,
            });
          } else {
            // Dar un breve tiempo para que el socket termine de vaciar los buffers
            socket.end(() => {
              cleanup();
              resolve({
                success: true,
                bytesWritten: data.length,
              });
            });
          }
        }
      });
    });
  });
}

/**
 * Prueba la conectividad TCP con la impresora térmica (Ping al puerto 9100).
 */
export async function testPrinterConnection(
  ipAddress: string,
  port = 9100,
  timeoutMs = 2500
): Promise<PingResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const ip = ipAddress.trim();
    if (!ip) {
      return resolve({
        reachable: false,
        error: "Dirección IP no especificada.",
      });
    }

    const socket = new net.Socket();
    let hasResolved = false;

    const cleanup = () => {
      if (!socket.destroyed) {
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);

    socket.on("timeout", () => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({
          reachable: false,
          error: `No se pudo alcanzar la impresora en ${ip}:${port} (Timeout ${timeoutMs}ms).`,
        });
      }
    });

    socket.on("error", (err) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({
          reachable: false,
          error: `Impresora no alcanzable (${err.message}).`,
        });
      }
    });

    socket.connect(port, ip, () => {
      if (!hasResolved) {
        hasResolved = true;
        const latencyMs = Date.now() - startTime;
        cleanup();
        resolve({
          reachable: true,
          latencyMs,
        });
      }
    });
  });
}
