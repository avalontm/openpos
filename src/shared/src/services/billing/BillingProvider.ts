import type { Product } from "../../db/schema";

export interface CfdiCustomer {
  rfc: string;
  razonSocial: string;
  email: string;
  usoCfdi: string;
  direccion?: string;
}

export interface CfdiItem {
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  claveProdServ: string;
  claveUnidad: string;
  unidad?: string;
}

export interface CfdiInvoiceData {
  ticket: string;
  subtotal: number;
  tax: number;
  total: number;
  method: string;
  customer: CfdiCustomer;
  items: CfdiItem[];
}

export interface CfdiResult {
  uuid: string;
  id: string;
  pdfUrl: string;
  xmlUrl?: string;
  status: "pending" | "sent" | "cancelled";
  fechaTimbrado: string;
  verificationUrl?: string;
}

export interface BillingProvider {
  initialize(apiKey: string, sandbox: boolean): Promise<void>;
  createInvoice(data: CfdiInvoiceData): Promise<CfdiResult>;
  cancelInvoice(uuid: string, motivo: string): Promise<{ success: boolean }>;
  getInvoicePdf(uuid: string): Promise<string>;
  sendInvoiceEmail(invoiceId: string, email: string): Promise<void>;
}

export abstract class BaseBillingProvider implements BillingProvider {
  protected apiKey: string = "";
  protected sandbox: boolean = false;
  protected initialized: boolean = false;

  abstract initialize(apiKey: string, sandbox: boolean): Promise<void>;
  abstract createInvoice(data: CfdiInvoiceData): Promise<CfdiResult>;
  abstract cancelInvoice(uuid: string, motivo: string): Promise<{ success: boolean }>;
  abstract getInvoicePdf(uuid: string): Promise<string>;
  abstract sendInvoiceEmail(invoiceId: string, email: string): Promise<void>;

  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("Billing provider not initialized. Call initialize() first.");
    }
  }
}