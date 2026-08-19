import { prisma } from "@/lib/prisma";

export type PrinterTarget = "KITCHEN" | "RECEPTION";

export type PrinterConfigData = {
  id?: string;
  target: PrinterTarget;
  name: string;
  ipAddress: string;
  port: number;
  paperWidth: "58mm" | "80mm";
  isActive: boolean;
  autoPrint: boolean;
};

const DEFAULT_CONFIGS: Record<PrinterTarget, Omit<PrinterConfigData, "id">> = {
  KITCHEN: {
    target: "KITCHEN",
    name: "Impresora Cocina (Comandas)",
    ipAddress: "192.168.1.200",
    port: 9100,
    paperWidth: "80mm",
    isActive: true,
    autoPrint: true,
  },
  RECEPTION: {
    target: "RECEPTION",
    name: "Impresora Caja / Recepción (Pre-cuentas y Comprobantes)",
    ipAddress: "192.168.1.201",
    port: 9100,
    paperWidth: "80mm",
    isActive: true,
    autoPrint: true,
  },
};

export class PrinterRepository {
  /**
   * Obtiene la configuración de una impresora por su target (KITCHEN o RECEPTION).
   * Si no existe en la base de datos, la crea con valores predeterminados.
   */
  async obtenerPorTarget(target: PrinterTarget) {
    const config = await prisma.printerConfig.findUnique({
      where: { target },
    });

    if (config) {
      return config;
    }

    const defaultConfig = DEFAULT_CONFIGS[target];
    return prisma.printerConfig.create({
      data: {
        target: defaultConfig.target,
        name: defaultConfig.name,
        ipAddress: defaultConfig.ipAddress,
        port: defaultConfig.port,
        paperWidth: defaultConfig.paperWidth,
        isActive: defaultConfig.isActive,
        autoPrint: defaultConfig.autoPrint,
      },
    });
  }

  /**
   * Lista todas las configuraciones de impresoras. Asegura que existan ambas (KITCHEN y RECEPTION).
   */
  async obtenerTodas() {
    const configs = await prisma.printerConfig.findMany({
      orderBy: { target: "asc" },
    });

    const targets: PrinterTarget[] = ["KITCHEN", "RECEPTION"];
    const results = [];

    for (const target of targets) {
      const encontrada = configs.find((c) => c.target === target);
      if (encontrada) {
        results.push(encontrada);
      } else {
        const creada = await this.obtenerPorTarget(target);
        results.push(creada);
      }
    }

    return results;
  }

  /**
   * Actualiza o crea la configuración de una impresora.
   */
  async guardarConfiguracion(data: PrinterConfigData) {
    return prisma.printerConfig.upsert({
      where: { target: data.target },
      create: {
        target: data.target,
        name: data.name.trim(),
        ipAddress: data.ipAddress.trim(),
        port: Number(data.port) || 9100,
        paperWidth: data.paperWidth === "58mm" ? "58mm" : "80mm",
        isActive: Boolean(data.isActive),
        autoPrint: Boolean(data.autoPrint),
      },
      update: {
        name: data.name.trim(),
        ipAddress: data.ipAddress.trim(),
        port: Number(data.port) || 9100,
        paperWidth: data.paperWidth === "58mm" ? "58mm" : "80mm",
        isActive: Boolean(data.isActive),
        autoPrint: Boolean(data.autoPrint),
      },
    });
  }
}

export const printerRepository = new PrinterRepository();
