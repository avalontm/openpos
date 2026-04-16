import type { PrinterConfig, TicketData, FontSize } from "./types.js";
import { TicketBuilder } from "./TicketBuilder.js";
import { logger } from "../../logger.js";

export interface PrintResult {
  success: boolean;
  error?: string;
  lines?: string[];
  copies?: number;
}

// ── Helpers ESC/POS ───────────────────────────────────────────────────────────

const ESC = 0x1b;
const GS  = 0x1d;

function esc(...bytes: number[]): Buffer {
  return Buffer.from([ESC, ...bytes]);
}

function gs(...bytes: number[]): Buffer {
  return Buffer.from([GS, ...bytes]);
}

const INIT        = esc(0x40);
const BOLD_ON     = esc(0x45, 1);
const BOLD_OFF    = esc(0x45, 0);
const DOUBLE_ON   = gs(0x21, 0x11);
const DOUBLE_OFF  = gs(0x21, 0x00);
const DBLW_ON     = gs(0x21, 0x10);
const CUT         = gs(0x56, 0x41, 0x03);
const CASH_DRAWER = esc(0x70, 0x00, 0x19, 0xfa);
const BEEP        = esc(0x42, 0x03, 0x02);

function alignCmd(a: "left" | "center" | "right"): Buffer {
  const map = { left: 0, center: 1, right: 2 };
  return esc(0x61, map[a]);
}

function qrCommand(data: string, size: number = 6): Buffer {
  const chunks: Buffer[] = [];
  
  chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
  chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size]));
  chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30]));
  
  const len = data.length + 3;
  chunks.push(Buffer.from([GS, 0x28, 0x6b, len & 0xff, (len >> 8) & 0xff, 0x31, 0x50, 0x30]));
  chunks.push(Buffer.from(data));
  chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));
  
  return Buffer.concat(chunks);
}

function pad(text: string, width: number, align: "left" | "center" | "right" = "left"): string {
  const len = text.length;
  if (len >= width) return text.substring(0, width);
  const space = width - len;
  switch (align) {
    case "right": return " ".repeat(space) + text;
    case "center": {
      const left = Math.floor(space / 2);
      const right = space - left;
      return " ".repeat(left) + text + " ".repeat(right);
    }
    default: return text + " ".repeat(space);
  }
}

// ── Character set map ─────────────────────────────────────────────────────────

const CHARACTER_SET_MAP: Record<string, string> = {
  PC437:               "PC437_USA",
  PC850:               "PC850_MULTILINGUAL",
  PC860:               "PC860_PORTUGUESE",
  PC863:               "PC863_CANADIAN_FRENCH",
  PC865:               "PC865_NORDIC",
  PC858:               "PC858_EURO",
  PC866:               "PC866_CYRILLIC2",
  PC852:               "PC852_LATIN2",
  WPC1252:             "WPC1252",
  PC437_USA:           "PC437_USA",
  PC850_MULTILINGUAL:  "PC850_MULTILINGUAL",
  PC858_EURO:          "PC858_EURO",
  WPC1250_LATIN2:      "WPC1250_LATIN2",
  WPC1251_CYRILLIC:    "WPC1251_CYRILLIC",
};

function resolveCharacterSet(cs: string): string {
  return CHARACTER_SET_MAP[cs] ?? CHARACTER_SET_MAP[cs.toUpperCase()] ?? "PC850_MULTILINGUAL";
}

// ── Interface type detection ──────────────────────────────────────────────────

type InterfaceKind = "tcp" | "windows-printer" | "file";

function detectInterfaceKind(iface: string): InterfaceKind {
  if (/^tcp:\/\//i.test(iface))     return "tcp";
  if (/^printer:/i.test(iface))     return "windows-printer";
  return "file";
}

function parsePrinterName(iface: string): string {
  return iface.replace(/^printer:/i, "").trim();
}

// ── Mock printer for ESC/POS buffer collection ────────────────────────────────

class EscPosBuffer {
  private chunks: Buffer[] = [];

  raw(buf: Buffer): void {
    this.chunks.push(buf);
  }

  println(text: string): void {
    // Use latin1 encoding to preserve byte values for ESC/POS
    this.chunks.push(Buffer.from(text + "\n", "latin1"));
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

// ── ThermalDriver ─────────────────────────────────────────────────────────────

export class ThermalDriver {
  private cfg: PrinterConfig;
  private builder: TicketBuilder;

  constructor(cfg: PrinterConfig) {
    this.cfg     = cfg;
    this.builder = new TicketBuilder(cfg);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async print(data: TicketData, preview = false): Promise<PrintResult> {
    const lines = this.builder.build(data);

    logger.info("ThermalDriver.print - lines generated:", { lineCount: lines.length, preview });
    logger.info("First 5 lines:", lines.slice(0, 5));
    logger.info("Last 5 lines:", lines.slice(-5));

    if (preview) {
      return { success: true, lines, copies: 1 };
    }

    const copies    = Math.max(1, this.cfg.options.printCopies);
    const maxRetries = this.cfg.options.retryOnFail ? this.cfg.options.maxRetries : 0;

    logger.info("ThermalDriver.print - about to send to printer", { copies, maxRetries, interface: this.cfg.printer.interface });

    let lastError = "";
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.sendToPrinter(data, lines, copies);
      if (result.success) {
        logger.info("ThermalDriver.print - success", { attempt });
        return result;
      }
      lastError = result.error ?? "Unknown error";
      logger.warn("ThermalDriver.print - attempt failed", { attempt, error: lastError });
      if (attempt < maxRetries) {
        await sleep(500 * (attempt + 1));
      }
    }

    return { success: false, error: lastError, lines };
  }

  async test(): Promise<PrintResult> {
    const testData: TicketData = {
      ticket:   "TEST-001",
      date:     new Date().toLocaleString("es-MX"),
      employee: "TEST",
      items: [
        { sku: "001", name: "Producto de Prueba",     price: 100,  qty: 1,   unitType: "pza" },
        { sku: "002", name: "Producto por Kilogramo", price: 45.5, qty: 1.5, unitType: "kg"  },
      ],
      subtotal: 168.25,
      tax:      26.92,
      discount: 0,
      total:    195.17,
      received: 200,
      change:   4.83,
      method:   "efectivo",
      width:    this.cfg.template.width,
    };

    return this.print(testData, true);
  }

  // ── Routing ───────────────────────────────────────────────────────────────

  private async sendToPrinter(
    data: TicketData,
    lines: string[],
    copies: number,
  ): Promise<PrintResult> {
    const kind = detectInterfaceKind(this.cfg.printer.interface);

    switch (kind) {
      case "windows-printer":
        return this.sendWindows(data, lines, copies);
      case "tcp":
      case "file":
      default:
        return this.sendViaNtp(data, lines, copies);
    }
  }

  // ── Strategy: node-thermal-printer (TCP / file) ───────────────────────────

  private async sendViaNtp(
    data: TicketData,
    lines: string[],
    copies: number,
  ): Promise<PrintResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("node-thermal-printer") as any;
      const ThermalPrinter = mod.printer ?? mod.default ?? mod;

      const printer = new ThermalPrinter({
        type:         (this.cfg.printer.type || "epson") as any,
        interface:    this.cfg.printer.interface,
        characterSet: resolveCharacterSet(this.cfg.printer.characterSet) as any,
        timeout:      this.cfg.options.timeout,
      });

      const connected = await printer.isPrinterConnected();
      if (!connected) {
        return { success: false, error: "Printer not connected", lines };
      }

      for (let copy = 0; copy < copies; copy++) {
        printer.raw(INIT);
        // Usar las líneas generadas por TicketBuilder (procesar markers QR y BIG)
        for (const line of lines) {
          if (line.startsWith("{QR:") && line.endsWith("}")) {
            const qrData = line.slice(4, -1);
            // TCP printer doesn't support qrCommand, just print as text
            printer.println("[QR: " + qrData + "]");
          } else if (line.startsWith("{SATQR:") && line.endsWith("}")) {
            const qrData = line.slice(7, -1);
            printer.println("[QR SAT: " + qrData + "]");
          } else if (line.startsWith("{BIG:") && line.endsWith("}")) {
            const text = line.slice(5, -1);
            printer.raw(BOLD_ON);
            printer.println(text);
            printer.raw(BOLD_OFF);
          } else {
            printer.println(line);
          }
        }
        if (this.cfg.template.actions.cut)        printer.raw(CUT);
        if (this.cfg.template.actions.cashDrawer) printer.raw(CASH_DRAWER);
        if (this.cfg.template.actions.beep)       printer.raw(BEEP);
        if (copy < copies - 1) await sleep(300);
      }

      await printer.execute();
      return { success: true, lines, copies };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Print error";
      return { success: false, error, lines };
    }
  }

  // ── Strategy: Windows spooler via winspool.drv P/Invoke ─────────────────────

  private async sendWindows(
    data: TicketData,
    lines: string[],
    copies: number,
  ): Promise<PrintResult> {
    try {
      const { execSync } = await import("child_process");
      const fs           = await import("fs");
      const os           = await import("os");
      const path         = await import("path");
      const { resolve }  = await import("path");

      const printerName = parsePrinterName(this.cfg.printer.interface);

      // Build ESC/POS buffer - usar las líneas generadas por TicketBuilder
      const buf = new EscPosBuffer();
      for (let copy = 0; copy < copies; copy++) {
        buf.raw(INIT);
        
        // Escribir las líneas generadas por TicketBuilder (procesar markers)
        for (const line of lines) {
          if (line.startsWith("{IMG:") && line.endsWith("}")) {
            const imgPath = line.slice(5, -1);
            try {
              const bannerPath = resolve(process.cwd(), "assets", imgPath);
              const imageBuffer = await pngToEscPosBitmap(bannerPath);
              if (imageBuffer) {
                buf.raw(imageBuffer);
                buf.println("");
              }
            } catch {
              buf.println("[Imagen no encontrada]");
            }
          } else if (line.startsWith("{QR:") && line.endsWith("}")) {
            const qrData = line.slice(4, -1);
            buf.raw(alignCmd("center"));
            buf.raw(qrCommand(qrData, this.cfg.template.footer.qrcode.size));
            buf.println("");
          } else if (line.startsWith("{SATQR:") && line.endsWith("}")) {
            const qrData = line.slice(7, -1);
            buf.raw(alignCmd("center"));
            buf.raw(qrCommand(qrData, 6));
            buf.println("");
            buf.println(pad("Verificar en SAT", this.cfg.template.width, "center"));
            buf.println("");
          } else if (line.startsWith("{BIG:") && line.endsWith("}")) {
            const text = line.slice(5, -1);
            buf.raw(alignCmd("right"));
            buf.raw(DOUBLE_ON);
            buf.println(text);
            buf.raw(DOUBLE_OFF);
          } else {
            buf.println(line);
          }
        }
        
        if (this.cfg.template.actions.cut)        buf.raw(CUT);
        if (this.cfg.template.actions.cashDrawer) buf.raw(CASH_DRAWER);
        if (this.cfg.template.actions.beep)       buf.raw(BEEP);
      }

      const tmpBin = path.join(os.tmpdir(), `ticket_${Date.now()}.bin`);
      fs.writeFileSync(tmpBin, buf.toBuffer());

      // Write PowerShell script to a temp file to avoid quoting issues
      const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrint {
    [DllImport("winspool.drv", CharSet=CharSet.Auto, SetLastError=true)]
    public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);
    [DllImport("winspool.drv", CharSet=CharSet.Auto, SetLastError=true)]
    public static extern bool ClosePrinter(IntPtr h);
    [DllImport("winspool.drv", CharSet=CharSet.Auto, SetLastError=true)]
    public static extern int StartDocPrinter(IntPtr h, int level, ref DOCINFO di);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndDocPrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool StartPagePrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndPagePrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool WritePrinter(IntPtr h, byte[] b, int n, out int w);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Auto)]
    public struct DOCINFO {
        [MarshalAs(UnmanagedType.LPTStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPTStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPTStr)] public string pDataType;
    }
}
"@
$printerName = '${printerName}'
$binPath     = '${tmpBin.replace(/\\/g, "\\\\")}'
$bytes  = [System.IO.File]::ReadAllBytes($binPath)
$hPrinter = [IntPtr]::Zero
if (-not [RawPrint]::OpenPrinter($printerName, [ref]$hPrinter, [IntPtr]::Zero)) {
    Write-Host "ERR:Cannot open printer $printerName"
    exit 1
}
$di = New-Object RawPrint+DOCINFO
$di.pDocName  = "ticket"
$di.pDataType = "RAW"
[RawPrint]::StartDocPrinter($hPrinter, 1, [ref]$di) | Out-Null
[RawPrint]::StartPagePrinter($hPrinter) | Out-Null
$written = 0
[RawPrint]::WritePrinter($hPrinter, $bytes, $bytes.Length, [ref]$written) | Out-Null
[RawPrint]::EndPagePrinter($hPrinter) | Out-Null
[RawPrint]::EndDocPrinter($hPrinter) | Out-Null
[RawPrint]::ClosePrinter($hPrinter) | Out-Null
Write-Host "OK:$written"
`;

      const tmpPs = path.join(os.tmpdir(), `rawprint_${Date.now()}.ps1`);
      fs.writeFileSync(tmpPs, psScript, "utf8");

      try {
        const out = execSync(
          `powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`,
          { stdio: "pipe", timeout: this.cfg.options.timeout },
        ).toString().trim();

        fs.unlinkSync(tmpBin);
        fs.unlinkSync(tmpPs);

        if (out.startsWith("OK:")) {
          const written = parseInt(out.slice(3));
          if (written > 0) return { success: true, lines, copies };
          return { success: false, error: "WritePrinter wrote 0 bytes", lines };
        }
        return { success: false, error: out || "WritePrinter failed", lines };
      } catch (err) {
        try { fs.unlinkSync(tmpBin); } catch { /* ignore */ }
        try { fs.unlinkSync(tmpPs); } catch { /* ignore */ }
        const error = err instanceof Error ? err.message : "PowerShell error";
        return { success: false, error, lines };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Windows print error";
      return { success: false, error, lines };
    }
  }

  // ── ESC/POS construction ──────────────────────────────────────────────────

  private async writeEscPos(printer: EscPosBuffer | any, data: TicketData): Promise<void> {
    const tpl = this.cfg.template;
    const w   = tpl.width;

    const println = (text: string, a: "left" | "center" | "right" = "left") => {
      printer.raw(alignCmd(a));
      printer.println(text);
    };

    const divider = (char: string) => printer.println(char.repeat(w));

    // Header
    if (tpl.header.enabled) {
      for (const item of tpl.header.items) {
        if (!this.evalIf(item.if, data)) continue;
        if (item.bold) printer.raw(BOLD_ON);
        this.applySize(printer, item.size);
        switch (item.type) {
          case "divider": divider(item.value ?? "-"); break;
          // Image handled in sendWindows/sendViaNtp directly
          default:        println(item.value ?? "", item.align ?? "center");
        }
        this.resetSize(printer, item.size);
        if (item.bold) printer.raw(BOLD_OFF);
      }
    }

    // Body: fields
    printer.raw(alignCmd("left"));
    if (tpl.body.fields.enabled) {
      for (const f of tpl.body.fields.items) {
        const raw = this.resolveField(f.value, data);
        const val = typeof raw === "number" ? `$${raw.toFixed(2)}` : String(raw);
        printer.println(`${f.label} ${val}`);
      }
    }

    // Body: divider
    if (tpl.body.divider.enabled) divider(tpl.body.divider.char);

    // Body: items
    if (tpl.body.items.enabled) {
      for (const item of data.items) {
        const unitType = item.unitType ?? "pza";
        const isPza    = unitType === "pza";
        const qtyStr   = isPza ? `${Math.round(item.qty)}` : `${item.qty.toFixed(2)}${unitType}`;
        const total    = `$${(item.price * item.qty).toFixed(2)}`;
        const nameMax  = w - qtyStr.length - total.length - 3;
        const name     = item.name.substring(0, Math.max(1, nameMax));
        const gap      = w - qtyStr.length - 1 - name.length - total.length;
        printer.println(`${qtyStr} ${name}${" ".repeat(Math.max(1, gap))}${total}`);
        if (tpl.body.items.showUnit && item.qty !== 1) {
          printer.println(`    @ $${item.price.toFixed(2)} c/u`);
        }
      }
    }

    // Footer: divider
    if (tpl.footer.divider.enabled) divider(tpl.footer.divider.char);

    // Footer: totals
    if (tpl.footer.totals.enabled) {
      for (const t of tpl.footer.totals.items) {
        const raw = this.resolveField(t.value, data);
        const val = `$${(raw as number).toFixed(2)}`;
        if (t.bold) printer.raw(BOLD_ON);
        this.applySize(printer, t.size);
        printer.raw(alignCmd(t.align ?? "right"));
        printer.println(`${t.label} ${val}`);
        this.resetSize(printer, t.size);
        if (t.bold) printer.raw(BOLD_OFF);
      }
    }

    // Footer: divider
    if (tpl.footer.divider.enabled) divider(tpl.footer.divider.char);

    // Footer: payment
    if (tpl.footer.payment.enabled) {
      printer.raw(alignCmd("right"));
      for (const p of tpl.footer.payment.items) {
        if (!this.evalIf(p.if, data)) continue;
        const raw = this.resolveField(p.value, data);
        const val = typeof raw === "number" ? `$${raw.toFixed(2)}` : String(raw);
        printer.println(`${p.label} ${val}`);
      }
    }

    // Footer: QR
    if (tpl.footer.qrcode.enabled) {
      const qrData = tpl.footer.qrcode.data.replace("{ticket}", data.ticket);
      const size   = tpl.footer.qrcode.size;
      printer.raw(alignCmd("center"));
      const len = qrData.length + 3;
      const pL  = len & 0xff;
      const pH  = (len >> 8) & 0xff;
      printer.raw(gs(0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00));
      printer.raw(gs(0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size));
      printer.raw(gs(0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30));
      printer.raw(Buffer.from([GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...Buffer.from(qrData)]));
      printer.raw(gs(0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30));
    }

    // Footer: barcode
    if (tpl.footer.barcode.enabled) {
      const raw = this.resolveField(tpl.footer.barcode.value, data);
      const val = String(raw);
      printer.raw(alignCmd("center"));
      printer.raw(gs(0x6b, 0x49, val.length, ...Buffer.from(val)));
    }

    // Footer: message
    if (tpl.footer.message.enabled) {
      printer.raw(alignCmd("center"));
      for (const line of tpl.footer.message.lines) {
        printer.println(line);
      }
    }

    printer.println("");
    printer.println("");
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private applySize(printer: any, size?: FontSize): void {
    switch (size) {
      case "double":        printer.raw(DOUBLE_ON);           break;
      case "double-width":  printer.raw(DBLW_ON);             break;
      case "double-height": printer.raw(gs(0x21, 0x01));      break;
    }
  }

  private resetSize(printer: any, size?: FontSize): void {
    if (size === "double" || size === "double-width" || size === "double-height") {
      printer.raw(DOUBLE_OFF);
    }
  }

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

  private evalIf(cond: string | undefined, data: TicketData): boolean {
    if (!cond) return true;
    const widthMatch = cond.match(/^width\s*([<>=!]+)\s*(\d+)$/);
    if (widthMatch) return this.compare(this.cfg.template.width, widthMatch[1]!, parseInt(widthMatch[2]!));
    const eqMatch = cond.match(/^(\w+)\s*=\s*(.+)$/);
    if (eqMatch) return String(this.resolveField(eqMatch[1]!.trim(), data)).trim() === eqMatch[2]!.trim();
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

  private async printImage(printer: any, imagePath: string): Promise<void> {
    try {
      const { existsSync } = await import("fs");
      if (!existsSync(imagePath)) {
        printer.println("[Imagen no encontrada]");
        return;
      }
      try {
        await printer.printImage(imagePath);
      } catch (imgErr) {
        const msg = imgErr instanceof Error ? imgErr.message : String(imgErr);
        printer.println(`[Err img: ${msg.substring(0, 20)}]`);
      }
    } catch (err) {
      printer.println("[Error imagen]");
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ── PNG to ESC/POS bitmap converter ─────────────────────────────────────────────

async function pngToEscPosBitmap(imagePath: string): Promise<Buffer | null> {
  try {
    const { readFileSync } = await import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PNG = require("pngjs").PNG;
    
    const data = readFileSync(imagePath);
    const png = PNG.sync.read(data);
    
    const origWidth = png.width;
    const origHeight = png.height;
    const maxWidth = 576;
    const scale = origWidth > maxWidth ? maxWidth / origWidth : 1;
    const width = Math.floor(origWidth * scale);
    const height = Math.floor(origHeight * scale);
    
    const imageBufferArray: number[] = [];
    const bytesPerLine = Math.ceil(width / 8);
    
    for (let y = 0; y < height; y++) {
      for (let byteX = 0; byteX < bytesPerLine; byteX++) {
        let byte = 0x0;
        for (let bit = 0; bit < 8; bit++) {
          const pixelX = byteX * 8 + bit;
          if (pixelX >= width) continue;
          
          const srcX = Math.floor(pixelX / scale);
          const srcY = Math.floor(y / scale);
          const idx = (srcY * origWidth + srcX) << 2;
          
          const r = png.data[idx];
          const g = png.data[idx + 1];
          const b = png.data[idx + 2];
          const a = png.data[idx + 3];
          
          if (a > 126) {
            const grayscale = Math.floor(0.2126 * r + 0.7152 * g + 0.0722 * b);
            if (grayscale < 128) {
              byte |= (1 << (7 - bit));
            }
          }
        }
        imageBufferArray.push(byte);
      }
    }
    
    const xBytes = bytesPerLine;
    const xL = xBytes & 0xff;
    const xH = (xBytes >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;
    
    const header = Buffer.from([
      0x1d, 0x76, 0x30, 48,
      xL, xH,
      yL, yH
    ]);
    
    const bitmapBuffer = Buffer.from(imageBufferArray);
    return Buffer.concat([header, bitmapBuffer]);
  } catch (err) {
    return null;
  }
}