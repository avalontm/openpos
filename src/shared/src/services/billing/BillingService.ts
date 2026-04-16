import { type BillingProvider, type CfdiInvoiceData, type CfdiResult } from "./BillingProvider";
import { FacturapiProvider } from "./providers/FacturapiProvider";

export type BillingProviderType = "facturapi";

const PROVIDERS: Record<BillingProviderType, BillingProvider> = {
  facturapi: new FacturapiProvider(),
};

export class BillingService {
  private provider: BillingProvider | null = null;
  private providerType: BillingProviderType | null = null;
  private initialized: boolean = false;

  async initialize(
    providerType: BillingProviderType,
    apiKey: string,
    sandbox: boolean
  ): Promise<void> {
    const provider = PROVIDERS[providerType];
    if (!provider) {
      throw new Error(`Unknown billing provider: ${providerType}`);
    }

    await provider.initialize(apiKey, sandbox);
    this.provider = provider;
    this.providerType = providerType;
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getProviderType(): BillingProviderType | null {
    return this.providerType;
  }

  async createInvoice(data: CfdiInvoiceData): Promise<CfdiResult> {
    if (!this.provider) {
      throw new Error("Billing service not initialized");
    }
    return this.provider.createInvoice(data);
  }

  async cancelInvoice(uuid: string, motivo: string): Promise<{ success: boolean }> {
    if (!this.provider) {
      throw new Error("Billing service not initialized");
    }
    return this.provider.cancelInvoice(uuid, motivo);
  }

  async getInvoicePdf(uuid: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Billing service not initialized");
    }
    return this.provider.getInvoicePdf(uuid);
  }

  async sendInvoiceEmail(invoiceId: string, email: string): Promise<void> {
    if (!this.provider) {
      throw new Error("Billing service not initialized");
    }
    return this.provider.sendInvoiceEmail(invoiceId, email);
  }
}

export const billingService = new BillingService();