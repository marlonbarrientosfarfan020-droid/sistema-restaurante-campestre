import { prisma } from "@/lib/prisma";
import { EscPosBuilder, PaperWidth } from "@/lib/escpos";
import {
  sendToNetworkPrinter,
  testPrinterConnection,
} from "@/lib/network-printer";
import {
  printerRepository,
  PrinterTarget,
} from "@/repositories/printer.repository";
import { AppError } from "@/lib/errors";

function formatearFecha(fecha: Date | string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "America/Lima",
  }).format(new Date(fecha));
}

function formatearHora(fecha: Date | string) {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Lima",
  }).format(new Date(fecha));
}

export type ImpresionResult = {
  success: boolean;
  networkPrinted: boolean;
  target: PrinterTarget;
  printerName: string;
  ipAddress: string;
  paperWidth: PaperWidth;
  error?: string;
  ticketHtml: string;
  titulo?: string;
};

export class PrinterService {
  /**
   * Genera el HTML térmico base para impresión por navegador (Fallback y vista previa)
   */
  private envolverHtmlTicket(contenidoHtml: string, paperWidth: PaperWidth, titulo = "Ticket Térmico"): string {
    const anchoCss = paperWidth === "58mm" ? "58mm" : "80mm";
    const anchoPx = paperWidth === "58mm" ? "240px" : "320px";

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    @page {
      margin: 0;
      size: ${anchoCss} auto;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      background-color: #fff;
      color: #000;
      font-size: ${paperWidth === "58mm" ? "11px" : "12px"};
      line-height: 1.25;
      padding: 6px;
      width: ${anchoPx};
      margin: 0 auto;
    }
    .ticket-container {
      width: 100%;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .text-lg { font-size: ${paperWidth === "58mm" ? "14px" : "16px"}; }
    .text-xl { font-size: ${paperWidth === "58mm" ? "16px" : "18px"}; }
    .text-xs { font-size: ${paperWidth === "58mm" ? "9px" : "10px"}; }
    .divider {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .divider-double {
      border-top: 2px solid #000;
      margin: 5px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 2px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3px;
    }
    .item-cant {
      font-weight: bold;
      width: ${paperWidth === "58mm" ? "22px" : "28px"};
      flex-shrink: 0;
    }
    .item-desc {
      flex: 1;
      padding-right: 4px;
    }
    .item-total {
      font-weight: bold;
      text-align: right;
      white-space: nowrap;
    }
    .obs-box {
      font-weight: bold;
      padding-left: ${paperWidth === "58mm" ? "22px" : "28px"};
      font-size: ${paperWidth === "58mm" ? "10px" : "11px"};
      margin-bottom: 3px;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border: 1px solid #000;
      font-weight: bold;
      border-radius: 3px;
      margin: 3px 0;
    }
    @media print {
      body {
        width: 100%;
        padding: 0 2px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    ${contenidoHtml}
  </div>
</body>
</html>`;
  }

  /**
   * Imprime un ticket de prueba diagnóstica
   */
  async imprimirTicketPrueba(target: PrinterTarget): Promise<ImpresionResult> {
    const config = await printerRepository.obtenerPorTarget(target);
    const paperWidth = (config.paperWidth as PaperWidth) || "80mm";
    const fechaHora = formatearFecha(new Date());

    // 1. Construir comandos ESC/POS
    const escpos = new EscPosBuilder(paperWidth);
    escpos
      .centerText("RESTAURANTE CHINKA CHINKA", { bold: true, size: "double-height" })
      .centerText("Donde te pierdes con el buen sabor", { size: "normal" })
      .line("=")
      .centerText("TICKET DE PRUEBA ESC/POS", { bold: true, invert: true })
      .line()
      .twoColumns("DESTINO:", target === "KITCHEN" ? "COCINA" : "CAJA / RECEPCION", true)
      .twoColumns("IMPRESORA:", config.name)
      .twoColumns("IP:", `${config.ipAddress}:${config.port}`)
      .twoColumns("ANCHO PAPEL:", paperWidth)
      .twoColumns("FECHA/HORA:", fechaHora)
      .line()
      .centerText("CARACTERES ESPECIALES:")
      .centerText("á é í ó ú ñ Á É Í Ó Ú Ñ")
      .centerText("0 1 2 3 4 5 6 7 8 9")
      .line()
      .twoColumns("PRUEBA COLUMNAS", "OK", true)
      .twoColumns("ESTADO COMUNICACION", "ACTIVO", true)
      .line("=")
      .centerText("IMPRESION TERMINADA CON EXITO", { bold: true })
      .feed(1);

    if (target === "KITCHEN") {
      escpos.beep(2);
    } else {
      escpos.openDrawer();
    }

    escpos.cut(true);
    const buffer = escpos.build();

    // 2. Construir HTML Fallback
    const htmlContenido = `
      <div class="text-center font-bold text-lg">RESTAURANTE CHINKA CHINKA</div>
      <div class="text-center text-xs">Donde te pierdes con el buen sabor</div>
      <div class="divider-double"></div>
      <div class="text-center font-bold badge">TICKET DE PRUEBA</div>
      <div class="divider"></div>
      <div class="row"><span>DESTINO:</span><span class="font-bold">${target === "KITCHEN" ? "COCINA" : "CAJA / RECEPCIÓN"}</span></div>
      <div class="row"><span>IMPRESORA:</span><span>${config.name}</span></div>
      <div class="row"><span>DIRECCIÓN IP:</span><span>${config.ipAddress}:${config.port}</span></div>
      <div class="row"><span>ANCHO:</span><span>${paperWidth}</span></div>
      <div class="row"><span>FECHA:</span><span>${fechaHora}</span></div>
      <div class="divider"></div>
      <div class="text-center font-bold">CARACTERES ESPECIALES:</div>
      <div class="text-center">á é í ó ú ñ Á É Í Ó Ú Ñ</div>
      <div class="divider"></div>
      <div class="row font-bold"><span>ESTADO:</span><span>CONEXIÓN EXITOSA</span></div>
      <div class="divider-double"></div>
      <div class="text-center font-bold text-xs">SISTEMA CHINKA CHINKA POS</div>
    `;
    const ticketHtml = this.envolverHtmlTicket(htmlContenido, paperWidth, "Ticket de Prueba");

    // 3. Envío directo TCP si está activa
    let networkPrinted = false;
    let error: string | undefined;

    if (config.isActive) {
      const netRes = await sendToNetworkPrinter(config.ipAddress, config.port, buffer, 3000);
      networkPrinted = netRes.success;
      if (!netRes.success) {
        error = netRes.error;
      }
    } else {
      error = "La impresora está marcada como inactiva en la configuración.";
    }

    return {
      success: true, // La operación concluye con éxito entregando buffer o fallback
      networkPrinted,
      target,
      printerName: config.name,
      ipAddress: config.ipAddress,
      paperWidth,
      error,
      ticketHtml,
      titulo: "Prueba de Impresión",
    };
  }

  /**
   * Imprime la Comanda de Cocina para un pedido
   */
  async imprimirComandaCocina(pedidoId: string): Promise<ImpresionResult> {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        atencion: {
          include: {
            mesa: {
              include: {
                zona: true,
              },
            },
            mozo: true,
          },
        },
        registradoPor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new AppError("El pedido no existe.", 404);
    }

    const config = await printerRepository.obtenerPorTarget("KITCHEN");
    const paperWidth = (config.paperWidth as PaperWidth) || "80mm";

    const mesaNombre = pedido.atencion.mesa.nombre;
    const zonaNombre = pedido.atencion.mesa.zona.nombre;
    const mozoNombre = pedido.registradoPor
      ? `${pedido.registradoPor.nombres} ${pedido.registradoPor.apellidos}`
      : pedido.atencion.mozo
      ? `${pedido.atencion.mozo.nombres} ${pedido.atencion.mozo.apellidos}`
      : "Mozo General";
    const fechaHora = formatearFecha(pedido.fechaPedido);
    const hora = formatearHora(pedido.fechaPedido);

    // 1. ESC/POS Builder
    const escpos = new EscPosBuilder(paperWidth);
    escpos
      .centerText("COMANDA DE COCINA", { bold: true, size: "title" })
      .line("=")
      .centerText(`MESA: ${mesaNombre}`, { bold: true, size: "title" })
      .centerText(`(${zonaNombre})`, { bold: true })
      .line()
      .twoColumns("PEDIDO:", pedido.numero, true)
      .twoColumns("HORA:", hora, true)
      .twoColumns("MOZO:", mozoNombre)
      .twoColumns("ORIGEN:", pedido.origen)
      .twoColumns("FECHA:", fechaHora)
      .line("=")
      .centerText("PRODUCTOS Y CANTIDADES", { bold: true })
      .line();

    let totalItems = 0;
    for (const det of pedido.detalles) {
      const cant = Number(det.cantidad);
      totalItems += cant;
      escpos.itemRow(cant, det.producto.nombre);
      if (det.observacion) {
        escpos.note(det.observacion);
      }
    }

    escpos.line();
    escpos.twoColumns("TOTAL PRODUCTOS:", `${totalItems} items`, true);

    if (pedido.observacion) {
      escpos.line();
      escpos.centerText("OBSERVACION GENERAL:", { bold: true });
      escpos.textLine(pedido.observacion);
    }

    escpos
      .line("=")
      .centerText(`COMANDA #${pedido.numero}`, { bold: true })
      .beep(2)
      .cut(true);

    const buffer = escpos.build();

    // 2. HTML Fallback
    const itemsHtml = pedido.detalles
      .map(
        (d) => `
        <div class="item-row">
          <div class="item-cant font-bold text-lg">${Number(d.cantidad)}x</div>
          <div class="item-desc font-bold text-lg">${d.producto.nombre}</div>
        </div>
        ${
          d.observacion
            ? `<div class="obs-box">⚠️ OBS: ${d.observacion}</div>`
            : ""
        }
      `
      )
      .join("");

    const htmlContenido = `
      <div class="text-center font-bold text-xl">COMANDA COCINA</div>
      <div class="divider-double"></div>
      <div class="text-center font-bold text-xl">MESA: ${mesaNombre}</div>
      <div class="text-center text-xs">(${zonaNombre})</div>
      <div class="divider"></div>
      <div class="row"><span class="font-bold">PEDIDO:</span><span class="font-bold">${pedido.numero}</span></div>
      <div class="row"><span>HORA:</span><span class="font-bold">${hora}</span></div>
      <div class="row"><span>MOZO:</span><span>${mozoNombre}</span></div>
      <div class="row"><span>ORIGEN:</span><span>${pedido.origen}</span></div>
      <div class="divider"></div>
      <div class="font-bold text-xs" style="margin-bottom: 4px;">PRODUCTOS:</div>
      ${itemsHtml}
      <div class="divider"></div>
      <div class="row font-bold"><span>TOTAL ITEMS:</span><span>${totalItems}</span></div>
      ${
        pedido.observacion
          ? `<div class="divider"></div><div class="font-bold">OBSERVACIÓN:</div><div>${pedido.observacion}</div>`
          : ""
      }
      <div class="divider-double"></div>
      <div class="text-center font-bold text-xs">COMANDA #${pedido.numero}</div>
    `;

    const ticketHtml = this.envolverHtmlTicket(
      htmlContenido,
      paperWidth,
      `Comanda ${pedido.numero} - ${mesaNombre}`
    );

    // 3. Envío de Red
    let networkPrinted = false;
    let error: string | undefined;

    if (config.isActive) {
      const netRes = await sendToNetworkPrinter(config.ipAddress, config.port, buffer, 3500);
      networkPrinted = netRes.success;
      if (!netRes.success) {
        error = netRes.error;
      }
    } else {
      error = "Impresora de cocina inactiva en la configuración.";
    }

    return {
      success: true,
      networkPrinted,
      target: "KITCHEN",
      printerName: config.name,
      ipAddress: config.ipAddress,
      paperWidth,
      error,
      ticketHtml,
      titulo: `Comanda ${pedido.numero}`,
    };
  }

  /**
   * Imprime la Pre-cuenta / Ticket de consumo para una atención de mesa
   */
  async imprimirPrecuenta(atencionId: string): Promise<ImpresionResult> {
    const atencion = await prisma.atencion.findUnique({
      where: { id: atencionId },
      include: {
        mesa: {
          include: {
            zona: true,
          },
        },
        mozo: true,
        sucursal: {
          include: {
            empresa: true,
          },
        },
        pedidos: {
          where: {
            estado: {
              not: "ANULADO",
            },
          },
          include: {
            detalles: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
    });

    if (!atencion) {
      throw new AppError("La atención no existe.", 404);
    }

    const config = await printerRepository.obtenerPorTarget("RECEPTION");
    const paperWidth = (config.paperWidth as PaperWidth) || "80mm";

    const empresa = atencion.sucursal?.empresa;
    const empresaNombre = empresa?.nombre || "RESTAURANTE CHINKA CHINKA";
    const empresaRuc = empresa?.ruc ? `RUC: ${empresa.ruc}` : "";
    const empresaDir = empresa?.direccion || "";
    const mesaNombre = atencion.mesa.nombre;
    const zonaNombre = atencion.mesa.zona.nombre;
    const mozoNombre = atencion.mozo
      ? `${atencion.mozo.nombres} ${atencion.mozo.apellidos}`
      : "Atención General";
    const fechaHora = formatearFecha(new Date());

    // Agrupar items consolidados
    const itemsConsolidados = new Map<
      string,
      {
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
      }
    >();

    for (const ped of atencion.pedidos) {
      for (const det of ped.detalles) {
        if (det.estado === "ANULADO") continue;
        const key = det.productoId;
        const cant = Number(det.cantidad);
        const pu = Number(det.precioUnitario);
        const st = Number(det.subtotal);

        const existente = itemsConsolidados.get(key);
        if (existente) {
          existente.cantidad += cant;
          existente.subtotal += st;
        } else {
          itemsConsolidados.set(key, {
            nombre: det.producto.nombre,
            cantidad: cant,
            precioUnitario: pu,
            subtotal: st,
          });
        }
      }
    }

    const subtotal = Number(atencion.subtotal);
    const descuento = Number(atencion.descuento);
    const total = Number(atencion.total);

    // 1. ESC/POS
    const escpos = new EscPosBuilder(paperWidth);
    escpos
      .centerText(empresaNombre, { bold: true, size: "double-height" })
      .centerText("Donde te pierdes con el buen sabor", { size: "normal" });

    if (empresaRuc) escpos.centerText(empresaRuc);
    if (empresaDir) escpos.centerText(empresaDir);

    escpos
      .line("=")
      .centerText("PRE-CUENTA DE CONSUMO", { bold: true, invert: true })
      .centerText("*** NO ES UN COMPROBANTE DE PAGO ***", { size: "normal" })
      .line()
      .twoColumns("ATENCION:", atencion.codigo, true)
      .twoColumns("MESA:", `${mesaNombre} (${zonaNombre})`, true)
      .twoColumns("MOZO:", mozoNombre)
      .twoColumns("PERSONAS:", `${atencion.cantidadPersonas}`)
      .twoColumns("FECHA/HORA:", fechaHora)
      .line("=")
      .twoColumns("CANT DESCRIPCION", "TOTAL", true)
      .line();

    for (const item of itemsConsolidados.values()) {
      escpos.itemRow(
        item.cantidad,
        item.nombre,
        `S/ ${item.subtotal.toFixed(2)}`,
        `S/ ${item.precioUnitario.toFixed(2)}`
      );
    }

    escpos.line();
    escpos.twoColumns("SUBTOTAL:", `S/ ${subtotal.toFixed(2)}`);
    if (descuento > 0) {
      escpos.twoColumns("DESCUENTO:", `- S/ ${descuento.toFixed(2)}`);
    }
    escpos.line("=");
    escpos.twoColumns("TOTAL A PAGAR:", `S/ ${total.toFixed(2)}`, true);
    escpos.line("=");
    escpos
      .centerText("¡GRACIAS POR SU PREFERENCIA!", { bold: true })
      .centerText("Solicite su comprobante en caja")
      .feed(2)
      .cut(true);

    const buffer = escpos.build();

    // 2. HTML Fallback
    const rowsHtml = Array.from(itemsConsolidados.values())
      .map(
        (item) => `
        <div class="item-row">
          <div class="item-cant font-bold">${item.cantidad}x</div>
          <div class="item-desc">
            <div>${item.nombre}</div>
            <div class="text-xs" style="color: #444;">P.Unit: S/ ${item.precioUnitario.toFixed(2)}</div>
          </div>
          <div class="item-total">S/ ${item.subtotal.toFixed(2)}</div>
        </div>
      `
      )
      .join("");

    const htmlContenido = `
      <div class="text-center font-bold text-lg">${empresaNombre}</div>
      <div class="text-center text-xs">Donde te pierdes con el buen sabor</div>
      ${empresaRuc ? `<div class="text-center text-xs">${empresaRuc}</div>` : ""}
      ${empresaDir ? `<div class="text-center text-xs">${empresaDir}</div>` : ""}
      <div class="divider-double"></div>
      <div class="text-center font-bold badge">PRE-CUENTA DE CONSUMO</div>
      <div class="text-center text-xs" style="margin-top:2px;">*** NO ES COMPROBANTE DE PAGO ***</div>
      <div class="divider"></div>
      <div class="row"><span class="font-bold">ATENCIÓN:</span><span class="font-bold">${atencion.codigo}</span></div>
      <div class="row"><span class="font-bold">MESA:</span><span class="font-bold">${mesaNombre} (${zonaNombre})</span></div>
      <div class="row"><span>MOZO:</span><span>${mozoNombre}</span></div>
      <div class="row"><span>PERSONAS:</span><span>${atencion.cantidadPersonas}</span></div>
      <div class="row"><span>EMISIÓN:</span><span>${fechaHora}</span></div>
      <div class="divider"></div>
      <div class="row font-bold text-xs"><span>CANT / PRODUCTO</span><span>TOTAL</span></div>
      <div class="divider"></div>
      ${rowsHtml}
      <div class="divider"></div>
      <div class="row"><span>SUBTOTAL:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
      ${
        descuento > 0
          ? `<div class="row"><span>DESCUENTO:</span><span>- S/ ${descuento.toFixed(2)}</span></div>`
          : ""
      }
      <div class="divider-double"></div>
      <div class="row font-bold text-lg"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div>
      <div class="divider-double"></div>
      <div class="text-center font-bold text-xs">¡GRACIAS POR SU PREFERENCIA!</div>
      <div class="text-center text-xs">Solicite su boleta o factura en caja</div>
    `;

    const ticketHtml = this.envolverHtmlTicket(
      htmlContenido,
      paperWidth,
      `Precuenta ${atencion.codigo} - ${mesaNombre}`
    );

    // 3. Envío de Red
    let networkPrinted = false;
    let error: string | undefined;

    if (config.isActive) {
      const netRes = await sendToNetworkPrinter(config.ipAddress, config.port, buffer, 3500);
      networkPrinted = netRes.success;
      if (!netRes.success) {
        error = netRes.error;
      }
    } else {
      error = "Impresora de recepción inactiva en la configuración.";
    }

    return {
      success: true,
      networkPrinted,
      target: "RECEPTION",
      printerName: config.name,
      ipAddress: config.ipAddress,
      paperWidth,
      error,
      ticketHtml,
      titulo: `Precuenta ${atencion.codigo}`,
    };
  }

  /**
   * Imprime un comprobante emitido (Boleta, Factura o Nota de Venta)
   */
  async imprimirComprobante(comprobanteId: string): Promise<ImpresionResult> {
    const comprobante = await prisma.comprobante.findUnique({
      where: { id: comprobanteId },
      include: {
        sucursal: {
          include: {
            empresa: true,
          },
        },
        atencion: {
          include: {
            mesa: {
              include: {
                zona: true,
              },
            },
            mozo: true,
            pagos: true,
            pedidos: {
              where: { estado: { not: "ANULADO" } },
              include: {
                detalles: {
                  include: {
                    producto: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comprobante) {
      throw new AppError("El comprobante no existe.", 404);
    }

    const config = await printerRepository.obtenerPorTarget("RECEPTION");
    const paperWidth = (config.paperWidth as PaperWidth) || "80mm";

    const empresa = comprobante.sucursal?.empresa;
    const empresaNombre = empresa?.nombre || "RESTAURANTE CHINKA CHINKA";
    const empresaRuc = empresa?.ruc ? `RUC: ${empresa.ruc}` : "";
    const empresaDir = empresa?.direccion || "";
    const tipoTexto =
      comprobante.tipo === "FACTURA"
        ? "FACTURA ELECTRÓNICA"
        : comprobante.tipo === "BOLETA"
        ? "BOLETA ELECTRÓNICA"
        : "NOTA DE VENTA";
    const numeroComprobante = comprobante.numero;
    const fechaHora = formatearFecha(comprobante.fechaEmision);
    const mesaNombre = comprobante.atencion.mesa.nombre;
    const mozoNombre = comprobante.atencion.mozo
      ? `${comprobante.atencion.mozo.nombres} ${comprobante.atencion.mozo.apellidos}`
      : "Caja";

    // Consolidar items
    const items = new Map<
      string,
      {
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
      }
    >();

    for (const ped of comprobante.atencion.pedidos) {
      for (const det of ped.detalles) {
        if (det.estado === "ANULADO") continue;
        const key = det.productoId;
        const cant = Number(det.cantidad);
        const pu = Number(det.precioUnitario);
        const st = Number(det.subtotal);

        const existente = items.get(key);
        if (existente) {
          existente.cantidad += cant;
          existente.subtotal += st;
        } else {
          items.set(key, {
            nombre: det.producto.nombre,
            cantidad: cant,
            precioUnitario: pu,
            subtotal: st,
          });
        }
      }
    }

    const subtotal = Number(comprobante.subtotal);
    const igv = Number(comprobante.igv);
    const total = Number(comprobante.total);

    // 1. ESC/POS
    const escpos = new EscPosBuilder(paperWidth);
    escpos
      .centerText(empresaNombre, { bold: true, size: "double-height" })
      .centerText("Donde te pierdes con el buen sabor");

    if (empresaRuc) escpos.centerText(empresaRuc);
    if (empresaDir) escpos.centerText(empresaDir);

    escpos
      .line("=")
      .centerText(tipoTexto, { bold: true, size: "double-height" })
      .centerText(numeroComprobante, { bold: true })
      .line()
      .twoColumns("FECHA EMISIÓN:", fechaHora)
      .twoColumns("MESA:", mesaNombre)
      .twoColumns("ATENDIDO POR:", mozoNombre);

    if (comprobante.clienteDocumento) {
      escpos.twoColumns("DOC. CLIENTE:", comprobante.clienteDocumento);
    }
    if (comprobante.clienteNombre) {
      escpos.twoColumns("CLIENTE:", comprobante.clienteNombre);
    }
    if (comprobante.clienteDireccion) {
      escpos.twoColumns("DIRECCIÓN:", comprobante.clienteDireccion);
    }

    escpos
      .line("=")
      .twoColumns("CANT DESCRIPCION", "TOTAL", true)
      .line();

    for (const item of items.values()) {
      escpos.itemRow(
        item.cantidad,
        item.nombre,
        `S/ ${item.subtotal.toFixed(2)}`,
        `S/ ${item.precioUnitario.toFixed(2)}`
      );
    }

    escpos.line();
    if (igv > 0) {
      escpos.twoColumns("OP. GRAVADA:", `S/ ${subtotal.toFixed(2)}`);
      escpos.twoColumns("I.G.V. (18%):", `S/ ${igv.toFixed(2)}`);
    } else {
      escpos.twoColumns("SUBTOTAL:", `S/ ${subtotal.toFixed(2)}`);
    }

    escpos.line("=");
    escpos.twoColumns("IMPORTE TOTAL:", `S/ ${total.toFixed(2)}`, true);
    escpos.line("=");

    // Pagos
    if (comprobante.atencion.pagos.length > 0) {
      escpos.centerText("DETALLE DE PAGO:", { bold: true });
      for (const pago of comprobante.atencion.pagos) {
        escpos.twoColumns(`PAGO ${pago.metodo}:`, `S/ ${Number(pago.monto).toFixed(2)}`);
        if (pago.vuelto && Number(pago.vuelto) > 0) {
          escpos.twoColumns("VUELTO:", `S/ ${Number(pago.vuelto).toFixed(2)}`);
        }
      }
      escpos.line();
    }

    escpos
      .centerText("¡GRACIAS POR SU COMPRA!", { bold: true })
      .openDrawer()
      .feed(2)
      .cut(true);

    const buffer = escpos.build();

    // 2. HTML Fallback
    const rowsHtml = Array.from(items.values())
      .map(
        (item) => `
        <div class="item-row">
          <div class="item-cant font-bold">${item.cantidad}x</div>
          <div class="item-desc">
            <div>${item.nombre}</div>
            <div class="text-xs" style="color: #444;">P.Unit: S/ ${item.precioUnitario.toFixed(2)}</div>
          </div>
          <div class="item-total">S/ ${item.subtotal.toFixed(2)}</div>
        </div>
      `
      )
      .join("");

    const pagosHtml = comprobante.atencion.pagos
      .map(
        (p) => `
        <div class="row"><span>MÉTODO (${p.metodo}):</span><span>S/ ${Number(p.monto).toFixed(2)}</span></div>
        ${p.vuelto && Number(p.vuelto) > 0 ? `<div class="row"><span>VUELTO:</span><span>S/ ${Number(p.vuelto).toFixed(2)}</span></div>` : ""}
      `
      )
      .join("");

    const htmlContenido = `
      <div class="text-center font-bold text-lg">${empresaNombre}</div>
      <div class="text-center text-xs">Donde te pierdes con el buen sabor</div>
      ${empresaRuc ? `<div class="text-center text-xs">${empresaRuc}</div>` : ""}
      ${empresaDir ? `<div class="text-center text-xs">${empresaDir}</div>` : ""}
      <div class="divider-double"></div>
      <div class="text-center font-bold text-lg">${tipoTexto}</div>
      <div class="text-center font-bold">${numeroComprobante}</div>
      <div class="divider"></div>
      <div class="row"><span>FECHA:</span><span>${fechaHora}</span></div>
      <div class="row"><span>MESA:</span><span>${mesaNombre}</span></div>
      <div class="row"><span>CAJERO/MOZO:</span><span>${mozoNombre}</span></div>
      ${comprobante.clienteDocumento ? `<div class="row"><span>DOC. CLIENTE:</span><span>${comprobante.clienteDocumento}</span></div>` : ""}
      ${comprobante.clienteNombre ? `<div class="row"><span>CLIENTE:</span><span>${comprobante.clienteNombre}</span></div>` : ""}
      <div class="divider"></div>
      <div class="row font-bold text-xs"><span>CANT / DESCRIPCIÓN</span><span>TOTAL</span></div>
      <div class="divider"></div>
      ${rowsHtml}
      <div class="divider"></div>
      ${
        igv > 0
          ? `<div class="row"><span>OP. GRAVADA:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
             <div class="row"><span>I.G.V. (18%):</span><span>S/ ${igv.toFixed(2)}</span></div>`
          : `<div class="row"><span>SUBTOTAL:</span><span>S/ ${subtotal.toFixed(2)}</span></div>`
      }
      <div class="divider-double"></div>
      <div class="row font-bold text-lg"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div>
      <div class="divider-double"></div>
      ${pagosHtml ? `<div class="font-bold text-xs" style="margin-bottom:2px;">FORMA DE PAGO:</div>${pagosHtml}<div class="divider"></div>` : ""}
      <div class="text-center font-bold text-xs">¡GRACIAS POR SU COMPRA!</div>
    `;

    const ticketHtml = this.envolverHtmlTicket(
      htmlContenido,
      paperWidth,
      `${tipoTexto} ${numeroComprobante}`
    );

    // 3. Envío de Red
    let networkPrinted = false;
    let error: string | undefined;

    if (config.isActive) {
      const netRes = await sendToNetworkPrinter(config.ipAddress, config.port, buffer, 3500);
      networkPrinted = netRes.success;
      if (!netRes.success) {
        error = netRes.error;
      }
    } else {
      error = "Impresora de recepción inactiva en la configuración.";
    }

    return {
      success: true,
      networkPrinted,
      target: "RECEPTION",
      printerName: config.name,
      ipAddress: config.ipAddress,
      paperWidth,
      error,
      ticketHtml,
      titulo: `${tipoTexto} ${numeroComprobante}`,
    };
  }
}

export const printerService = new PrinterService();
