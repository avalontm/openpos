import type { SaleItem } from "../../db/schema.js";

// ── Primitivos de template ─────────────────────────────────────────────────────

export type Align = "left" | "center" | "right";
export type FontSize = "normal" | "double" | "double-width" | "double-height";

/** Elemento de texto libre (header/footer) */
export type TemplateItem = {
  type: "text" | "divider" | "qrcode" | "barcode" | "image";
  value?: string;
  path?: string;
  align?: Align;
  bold?: boolean;
  size?: FontSize;
  /** Condición para renderizar: "width>=48", "method=efectivo" */
  if?: string;
};

export type FieldItem = {
  label: string;
  /** Clave de TicketData o texto literal */
  value: string;
  path?: string;
  format?: "datetime" | "money" | "tax";
};

export type TotalItem = {
  label: string;
  value: string;
  path?: string;
  format?: "money" | "tax";
  align?: Align;
  bold?: boolean;
  size?: FontSize;
};

export type PaymentItem = {
  label: string;
  value: string;
  path?: string;
  align?: Align;
  if?: string;
};

// ── Sección con enabled + items ───────────────────────────────────────────────

export type EnabledSection<T> = {
  enabled: boolean;
  items: T[];
};

export type DividerSection = {
  enabled: boolean;
  char: string;
};

export type QrSection = {
  enabled: boolean;
  /** Soporta {ticket} como placeholder */
  data: string;
  size: number;
};

export type BarcodeSection = {
  enabled: boolean;
  type: "code128" | "ean13" | "upca";
  /** Clave de TicketData */
  value: string;
  path?: string;
};

export type MessageSection = {
  enabled: boolean;
  lines: string[];
};

// ── Config principal ──────────────────────────────────────────────────────────

export interface PrinterConfig {
  printer: {
    type: "epson" | "star" | "raw";
    interface: string;
    width: number;
    characterSet: string;
  };
  billing: {
    apiKey?: string;
    provider?: string;
    sandbox?: boolean;
    printOnTicket?: boolean;
    showUuid?: boolean;
    showVerificationUrl?: boolean;
  };
  template: {
    billing?: {
      printOnTicket?: boolean;
      showUuid?: boolean;
      showVerificationUrl?: boolean;
    };
    width: number;
    header: {
      enabled: boolean;
      items: TemplateItem[];
    };
    body: {
      fields: EnabledSection<FieldItem>;
      divider: DividerSection;
      items: {
        enabled: boolean;
        showUnit: boolean;
        showUnitType: boolean;
        /** "table" = nombre + precio alineados | "list" = una línea por item */
        format: "table" | "list";
      };
    };
    footer: {
      totals: EnabledSection<TotalItem>;
      payment: EnabledSection<PaymentItem>;
      divider: DividerSection;
      qrcode: QrSection;
      barcode: BarcodeSection;
      message: MessageSection;
    };
    actions: {
      cut: boolean;
      cashDrawer: boolean;
      beep: boolean;
    };
  };
  options: {
    printCopies: number;
    previewBeforePrint: boolean;
    timeout: number;
    retryOnFail: boolean;
    maxRetries: number;
  };
}

// ── Datos del ticket ──────────────────────────────────────────────────────────

export interface TicketData {
  ticket: string;
  date: string;
  employee: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  received: number;
  change: number;
  method: string;
  width: number;
  // Billing/CFDI data
  billingStatus?: "idle" | "processing" | "success" | "error";
  billingUuid?: string;
  billingVerificationUrl?: string;
  billingEmailSent?: boolean;
}

// ── Config por defecto ────────────────────────────────────────────────────────

export function getDefaultConfig(): PrinterConfig {
  return {
    printer: {
      type: "epson",
      interface: "tcp://192.168.1.100:9100",
      width: 48,
      characterSet: "PC850_MULTILINGUAL",
    },
    billing: {
      printOnTicket: false,
      showUuid: true,
      showVerificationUrl: true,
    },
    template: {
      width: 48,
      header: {
        enabled: true,
        items: [
          { type: "text", value: "================================", align: "center" },
          { type: "text", value: "▸ TIENDA POS",                    align: "center", bold: true },
          { type: "text", value: "RFC: XXXX-XXXXXX",                align: "center", if: "width>=48" },
          { type: "text", value: "Calle Falsa 123",                 align: "center", if: "width>=48" },
          { type: "text", value: "================================", align: "center" },
        ],
      },
      body: {
        fields: {
          enabled: true,
          items: [
            { label: "Fecha:",   value: "date",     format: "datetime" },
            { label: "Cajero:",  value: "employee" },
            { label: "Ticket:",  value: "ticket" },
          ],
        },
        divider: { enabled: true, char: "-" },
        items: { enabled: true, showUnit: true, showUnitType: true, format: "table" },
      },
      footer: {
        totals: {
          enabled: true,
          items: [
            { label: "Subtotal:", value: "subtotal", align: "right" },
            { label: "IVA 16%:", value: "tax",       align: "right", format: "money" },
            { label: "TOTAL:",   value: "total",     align: "right", bold: true, size: "double" },
          ],
        },
        payment: {
          enabled: true,
          items: [
            { label: "Efectivo:", value: "received", align: "right", if: "method=efectivo" },
            { label: "Cambio:",   value: "change",   align: "right", if: "method=efectivo" },
            { label: "Método:",   value: "method",   align: "right" },
          ],
        },
        divider: { enabled: true, char: "=" },
        qrcode:  { enabled: true,  data: "https://mitienda.com/ticket/{ticket}", size: 6 },
        barcode: { enabled: false, type: "code128", value: "ticket" },
        message: {
          enabled: true,
          lines: ["Gracias por su compra!", "Vuelva pronto"],
        },
      },
      actions: { cut: true, cashDrawer: false, beep: false },
    },
    options: {
      printCopies: 1,
      previewBeforePrint: false,
      timeout: 5000,
      retryOnFail: true,
      maxRetries: 2,
    },
  };
}
