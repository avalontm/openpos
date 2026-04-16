import type {
  PrinterConfig, TicketData,
  TemplateItem, FieldItem, TotalItem, PaymentItem,
  Align, FontSize,
} from "./types.js";
import { logger } from "../../logger.js";

// ── Helpers de formato ────────────────────────────────────────────────────────

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function pad(text: string, width: number, align: Align = "left"): string {
  const len = text.length;
  if (len >= width) return text.substring(0, width);
  const space = width - len;
  switch (align) {
    case "right":  return " ".repeat(space) + text;
    case "center": {
      const left  = Math.floor(space / 2);
      const right = space - left;
      return " ".repeat(left) + text + " ".repeat(right);
    }
    default: return text + " ".repeat(space);
  }
}

function cols(left: string, right: string, width: number): string {
  const gap = width - left.length - right.length;
  if (gap <= 0) return (left + " " + right).substring(0, width);
  return left + " ".repeat(gap) + right;
}

/** Divide un texto largo en líneas de `width` caracteres */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  while (text.length > width) {
    const slice = text.substring(0, width);
    // Intentar cortar en espacio
    const cut = slice.lastIndexOf(" ");
    if (cut > width * 0.5) {
      lines.push(text.substring(0, cut));
      text = text.substring(cut + 1);
    } else {
      lines.push(slice);
      text = text.substring(width);
    }
  }
  if (text) lines.push(text);
  return lines;
}

// ── TicketBuilder ─────────────────────────────────────────────────────────────

export class TicketBuilder {
  private cfg: PrinterConfig;
  private w: number; // ancho en caracteres

  constructor(cfg: PrinterConfig) {
    this.cfg = cfg;
    this.w = cfg.template.width;
  }

  // ── Punto de entrada ───────────────────────────────────────────────────────

  build(data: TicketData): string[] {
    const lines: string[] = [];

    if (this.cfg.template.header.enabled) {
      lines.push(...this.buildHeader(data));
    }

    lines.push(...this.buildBody(data));
    lines.push(...this.buildFooter(data));

    return lines;
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  private buildHeader(data: TicketData): string[] {
    const lines: string[] = [];

    for (const item of this.cfg.template.header.items) {
      if (!this.evalIf(item.if, data)) continue;

      switch (item.type) {
        case "divider":
          lines.push((item.value ?? "-").repeat(this.w));
          break;
        case "image":
          // Marker para que ThermalDriver genere imagen real
          lines.push(`{IMG:${item.path || "banner.png"}}`);
          break;
        case "text":
        default:
          lines.push(...this.renderText(item.value ?? "", item.align ?? "center", item.bold, item.size));
          break;
      }
    }

    return lines;
  }

  // ── Body ───────────────────────────────────────────────────────────────────

  private buildBody(data: TicketData): string[] {
    const lines: string[] = [];
    const body = this.cfg.template.body;

    // Campos (fecha, cajero, ticket)
    if (body.fields.enabled) {
      for (const field of body.fields.items) {
        const raw = this.resolveField(field.value, data);
        const val = this.formatField(raw, field.format);
        lines.push(`${field.label} ${val}`);
      }
    }

    // Separador
    if (body.divider.enabled) {
      lines.push(body.divider.char.repeat(this.w));
    }

    // Productos
    if (body.items.enabled) {
      lines.push(...this.buildItems(data));
    }

    return lines;
  }

  private buildItems(data: TicketData): string[] {
    const lines: string[] = [];
    const cfg = this.cfg.template.body.items;

    for (const item of data.items) {
      const unitType = item.unitType ?? "pza";
      const isPza    = unitType === "pza";

      // Cantidad formateada
      const qtyStr = isPza
        ? `${Math.round(item.qty)}`
        : `${item.qty.toFixed(2)}${unitType}`;

      const total  = money(item.price * item.qty);
      const unit   = cfg.showUnit ? money(item.price) : "";

      if (cfg.format === "table") {
        // Línea 1: nombre (truncado) + total alineado a derecha
        const nameMax = this.w - qtyStr.length - total.length - 3;
        const name    = item.name.substring(0, Math.max(1, nameMax));
        lines.push(cols(`${qtyStr} ${name}`, total, this.w));

        // Línea 2 (opcional): precio unitario si es relevante
        if (cfg.showUnit && item.qty !== 1) {
          lines.push(pad(`    @ ${unit} c/u`, this.w));
        }
      } else {
        // Formato lista: todo en una línea
        const desc = `${qtyStr} x ${item.name} = ${total}`;
        for (const l of wrap(desc, this.w)) lines.push(l);
      }
    }

    return lines;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  private buildFooter(data: TicketData): string[] {
    const lines: string[] = [];
    const footer = this.cfg.template.footer;

    // Separador antes de totales
    if (footer.divider.enabled) {
      lines.push(footer.divider.char.repeat(this.w));
    }

    // Totales (subtotal, IVA, total)
    if (footer.totals.enabled) {
      for (const t of footer.totals.items) {
        const raw   = this.resolveField(t.value, data);
        const val   = this.formatField(raw, t.format ?? "money");
        const label = t.label;

        // Usar formato consistente - label + valor en la misma línea
        // El marker {BIG:} será procesado por ThermalDriver
        if (t.size === "double" || t.size === "double-width") {
          lines.push(`{BIG:${label}${val}}`);
        } else {
          lines.push(...this.renderText(cols(label, val, this.w), t.align ?? "right", t.bold, t.size));
        }
      }
    }

    // Separador
    if (footer.divider.enabled) {
      lines.push(footer.divider.char.repeat(this.w));
    }

    // Pago (efectivo, cambio, método)
    if (footer.payment.enabled) {
      for (const p of footer.payment.items) {
        if (!this.evalIf(p.if, data)) continue;
        const raw = this.resolveField(p.value, data);
        const val = typeof raw === "number" ? money(raw) : String(raw);
        lines.push(...this.renderText(cols(p.label, val, this.w), p.align ?? "right"));
      }
    }

    // Separador final
    if (footer.divider.enabled) {
      lines.push(footer.divider.char.repeat(this.w));
    }

    // QR (representación ASCII — la impresora real lo renderiza con el comando nativo)
    if (footer.qrcode.enabled) {
      const qrData = footer.qrcode.data.replace("{ticket}", data.ticket);
      // Marker para que ThermalDriver genere QR real
      lines.push(`{QR:${qrData}}`);
    }

    // Mensaje final
    if (footer.message.enabled) {
      for (const msg of footer.message.lines) {
        lines.push(pad(msg, this.w, "center"));
      }
    }

    // CFDI / Facturación
    const printOnTicket = this.cfg.template?.billing?.printOnTicket ?? false;
    logger.info("TicketBuilder - billing check:", {
      templateBilling: this.cfg.template?.billing,
      printOnTicket: printOnTicket,
      dataBillingStatus: data.billingStatus,
      dataBillingUuid: data.billingUuid,
      willPrintBilling: printOnTicket && !!data.billingStatus
    });
    if (printOnTicket && data.billingStatus) {
      lines.push("=".repeat(this.w));
      
      if (data.billingStatus === "success") {
        lines.push(pad("FACTURA ELECTRÓNICA", this.w, "center"));
        lines.push(pad("CFDI TIMBRADO", this.w, "center"));
        
        if (this.cfg.template?.billing?.showUuid && data.billingUuid) {
          lines.push("");
          lines.push(pad("UUID:", this.w));
          const uuidLines = wrap(data.billingUuid, this.w);
          for (const l of uuidLines) {
            lines.push(pad(l, this.w, "center"));
          }
        }
        
        if (this.cfg.template?.billing?.showVerificationUrl && data.billingVerificationUrl) {
          lines.push("");
          // Marker para QR de verificación SAT
          lines.push(`{SATQR:${data.billingVerificationUrl}}`);
        }
        
        if (data.billingEmailSent) {
          lines.push("");
          lines.push(pad("✓ Email enviado", this.w, "center"));
        }
      } else if (data.billingStatus === "error") {
        lines.push(pad("ERROR FACTURACIÓN", this.w, "center"));
        if (data.billingUuid) {
          lines.push(pad(data.billingUuid, this.w, "center"));
        }
      } else if (data.billingStatus === "processing") {
        lines.push(pad("FACTURANDO...", this.w, "center"));
      }
    }

    return lines;
  }

  // ── Helpers internos ───────────────────────────────────────────────────────

  /**
   * Resuelve una clave de TicketData a su valor crudo.
   * Si la clave no existe como campo conocido, devuelve el texto literal.
   */
  private resolveField(key: string, data: TicketData): string | number {
    const map: Record<string, string | number> = {
      ticket:   data.ticket,
      date:     data.date,
      datetime: data.date,
      employee: data.employee,
      subtotal: data.subtotal,
      tax:      data.tax,
      discount: data.discount,
      total:    data.total,
      received: data.received,
      change:   data.change,
      method:   data.method,
    };
    return key in map ? map[key]! : key;
  }

  /**
   * Formatea un valor crudo según el formato indicado.
   */
  private formatField(value: string | number, format?: string): string {
    if (typeof value === "number") {
      // Todos los valores numéricos se formatean como dinero por defecto
      return money(value);
    }
    return String(value);
  }

  /**
   * Renderiza texto con alineación y tamaño para preview en consola.
   *
   * Para `size: "double"` el texto ocupa el doble de ancho en la impresora real
   * (comando ESC/POS — manejado en ThermalDriver). En preview lo mostramos
   * en una línea centrada con separación entre caracteres para simular el efecto,
   * pero sin expandir el string completo antes de hacer cols(), ya que eso
   * desplaza el valor a fuera del ancho.
   *
   * Uso correcto: llamar renderText(label, align, bold, size) pasando solo el label
   * cuando hay size double, y renderizar el valor por separado.
   */
  private renderText(
    text: string,
    align: Align = "left",
    bold = false,
    size?: FontSize,
  ): string[] {
    if (size === "double" || size === "double-width") {
      // Preview: expandir caracteres con espacio pero respetar ancho
      const expanded = text.trim().split("").join(" ");
      const trimmed  = expanded.substring(0, this.w);
      return [pad(trimmed, this.w, "center")];
    }
    return [pad(text, this.w, align)];
  }

  /**
   * Evalúa una condición opcional del template.
   * Soporta:
   *   - "width>=48"        → compara this.w
   *   - "method=efectivo"  → compara campo de TicketData
   *   - undefined          → siempre true
   */
  private evalIf(cond: string | undefined, data: TicketData): boolean {
    if (!cond) return true;

    // Condición sobre width
    const widthMatch = cond.match(/^width\s*([<>=!]+)\s*(\d+)$/);
    if (widthMatch) {
      const [, op, rhs] = widthMatch;
      return this.compare(this.w, op!, parseInt(rhs!));
    }

    // Condición campo=valor (ej: method=efectivo)
    const eqMatch = cond.match(/^(\w+)\s*=\s*(.+)$/);
    if (eqMatch) {
      const [, key, expected] = eqMatch;
      const actual = String(this.resolveField(key!.trim(), data)).trim();
      return actual === expected!.trim();
    }

    // Condición campo op número (ej: total>=100)
    const numMatch = cond.match(/^(\w+)\s*([<>=!]+)\s*(\d+(?:\.\d+)?)$/);
    if (numMatch) {
      const [, key, op, rhs] = numMatch;
      const raw = this.resolveField(key!.trim(), data);
      const num = typeof raw === "number" ? raw : parseFloat(String(raw));
      return this.compare(num, op!, parseFloat(rhs!));
    }

    return true;
  }

  private compare(a: number, op: string, b: number): boolean {
    switch (op) {
      case ">=": return a >= b;
      case "<=": return a <= b;
      case ">":  return a > b;
      case "<":  return a < b;
      case "=":
      case "==": return a === b;
      case "!=": return a !== b;
      default:   return true;
    }
  }
}
