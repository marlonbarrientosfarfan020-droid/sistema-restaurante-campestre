/**
 * Generador de comandos binarios ESC/POS para impresoras térmicas (80mm y 58mm).
 * Compatible con impresoras de red EPSON, Xprinter, Rongta, Bixolon, Sunmi, etc.
 */

export type PaperWidth = "58mm" | "80mm";

export class EscPosBuilder {
  private buffer: Buffer[] = [];
  private widthCols: number;
  private paperWidth: PaperWidth;

  constructor(paperWidth: PaperWidth = "80mm") {
    this.paperWidth = paperWidth;
    // 80mm típicamente soporta 42 a 48 caracteres en Fuente A
    // 58mm típicamente soporta 30 a 32 caracteres en Fuente A
    this.widthCols = paperWidth === "58mm" ? 32 : 44;
    this.init();
  }

  public getWidthCols(): number {
    return this.widthCols;
  }

  public getPaperWidth(): PaperWidth {
    return this.paperWidth;
  }

  private append(data: Buffer | number[] | string) {
    if (typeof data === "string") {
      // Convertir caracteres a ISO-8859-1 (Latin1) para soporte nativo de tildes y ñ
      this.buffer.push(Buffer.from(data, "latin1"));
    } else if (Array.isArray(data)) {
      this.buffer.push(Buffer.from(data));
    } else {
      this.buffer.push(data);
    }
    return this;
  }

  /**
   * Inicializa la impresora y resetea configuraciones
   */
  public init() {
    this.append([0x1b, 0x40]); // ESC @
    // Selección de página de códigos CP850 / Latin1 para español
    this.append([0x1b, 0x74, 0x10]); // ESC t 16 (WPC1252 / Latin1)
    return this;
  }

  public alignLeft() {
    this.append([0x1b, 0x61, 0x00]); // ESC a 0
    return this;
  }

  public alignCenter() {
    this.append([0x1b, 0x61, 0x01]); // ESC a 1
    return this;
  }

  public alignRight() {
    this.append([0x1b, 0x61, 0x02]); // ESC a 2
    return this;
  }

  public bold(enable = true) {
    this.append([0x1b, 0x45, enable ? 0x01 : 0x00]); // ESC E n
    return this;
  }

  public invert(enable = true) {
    this.append([0x1d, 0x42, enable ? 0x01 : 0x00]); // GS B n
    return this;
  }

  public underline(enable = true) {
    this.append([0x1b, 0x2d, enable ? 0x01 : 0x00]); // ESC - n
    return this;
  }

  public setSize(size: "normal" | "double-height" | "double-width" | "title" | "large") {
    let mode = 0x00;
    if (size === "double-height") mode = 0x01;
    else if (size === "double-width") mode = 0x10;
    else if (size === "title") mode = 0x11; // 2x alto y 2x ancho
    else if (size === "large") mode = 0x22; // 3x
    this.append([0x1d, 0x21, mode]); // GS ! n
    return this;
  }

  public text(str: string) {
    this.append(str);
    return this;
  }

  public textLine(str = "") {
    this.append(str + "\n");
    return this;
  }

  public centerText(
    str: string,
    options?: {
      bold?: boolean;
      size?: "normal" | "double-height" | "double-width" | "title" | "large";
      invert?: boolean;
    }
  ) {
    this.alignCenter();
    if (options?.bold) this.bold(true);
    if (options?.invert) this.invert(true);
    if (options?.size) this.setSize(options.size);

    this.textLine(str);

    if (options?.bold) this.bold(false);
    if (options?.invert) this.invert(false);
    if (options?.size) this.setSize("normal");
    this.alignLeft();
    return this;
  }

  public line(char = "-") {
    const divider = char.repeat(this.widthCols);
    this.alignLeft();
    this.textLine(divider);
    return this;
  }

  public doubleLine() {
    return this.line("=");
  }

  /**
   * Imprime dos columnas alineadas a los extremos (Izquierda y Derecha)
   * Ejemplo: "Subtotal:        S/ 120.00"
   */
  public twoColumns(leftText: string, rightText: string, bold = false) {
    if (bold) this.bold(true);
    this.alignLeft();

    const maxLeftLen = this.widthCols - rightText.length - 1;
    let safeLeft = leftText;
    if (safeLeft.length > maxLeftLen) {
      safeLeft = safeLeft.substring(0, maxLeftLen);
    }

    const spaces = Math.max(1, this.widthCols - safeLeft.length - rightText.length);
    const line = safeLeft + " ".repeat(spaces) + rightText;
    this.textLine(line);

    if (bold) this.bold(false);
    return this;
  }

  /**
   * Imprime una fila de detalle de pedido con soporte para nombres largos que hacen salto de línea
   * Formato: [CANT x] [DESCRIPCIÓN                   ] [TOTAL]
   */
  public itemRow(
    cant: number | string,
    descripcion: string,
    total?: string,
    precioUnitario?: string
  ) {
    const cantStr = `${cant}x `.padEnd(this.paperWidth === "58mm" ? 3 : 4, " ");
    const totalStr = total ? ` ${total}` : "";

    const descWidth = this.widthCols - cantStr.length - totalStr.length;

    if (descripcion.length <= descWidth) {
      const spaces = Math.max(1, descWidth - descripcion.length);
      this.textLine(`${cantStr}${descripcion}${" ".repeat(spaces)}${totalStr}`);
    } else {
      // Cortar en varias líneas
      const firstLine = descripcion.substring(0, descWidth);
      const rest = descripcion.substring(descWidth);
      const spaces = Math.max(1, descWidth - firstLine.length);

      this.textLine(`${cantStr}${firstLine}${" ".repeat(spaces)}${totalStr}`);

      // Imprimir el resto indentado
      const indent = " ".repeat(cantStr.length);
      const maxRestWidth = this.widthCols - indent.length;

      let remaining = rest;
      while (remaining.length > 0) {
        const chunk = remaining.substring(0, maxRestWidth);
        remaining = remaining.substring(maxRestWidth);
        this.textLine(`${indent}${chunk}`);
      }
    }

    if (precioUnitario && this.paperWidth === "80mm") {
      const indent = " ".repeat(cantStr.length);
      this.textLine(`${indent}(P.Unit: ${precioUnitario})`);
    }

    return this;
  }

  /**
   * Imprime una nota u observación destacada
   */
  public note(text: string) {
    this.bold(true);
    const prefix = "  * OBS: ";
    const maxWidth = this.widthCols - prefix.length;
    let remaining = text;

    let isFirst = true;
    while (remaining.length > 0) {
      const chunk = remaining.substring(0, maxWidth);
      remaining = remaining.substring(maxWidth);
      if (isFirst) {
        this.textLine(`${prefix}${chunk}`);
        isFirst = false;
      } else {
        this.textLine(`         ${chunk}`);
      }
    }
    this.bold(false);
    return this;
  }

  public feed(lines = 3) {
    this.append([0x1b, 0x64, lines]); // ESC d n
    return this;
  }

  /**
   * Corte de papel (Full / Partial)
   */
  public cut(partial = true) {
    this.feed(3);
    // GS V 66 0 (Feed y corte parcial)
    this.append([0x1d, 0x56, partial ? 0x42 : 0x41, 0x00]);
    return this;
  }

  /**
   * Alerta sonora (Buzzer)
   */
  public beep(times = 2) {
    // ESC B n t (Beep n veces, t*100ms)
    this.append([0x1b, 0x42, Math.min(times, 5), 0x02]);
    return this;
  }

  /**
   * Pulso para abrir gaveta de dinero
   */
  public openDrawer() {
    this.append([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    return this;
  }

  /**
   * Obtiene el buffer final completo
   */
  public build(): Buffer {
    return Buffer.concat(this.buffer);
  }
}
