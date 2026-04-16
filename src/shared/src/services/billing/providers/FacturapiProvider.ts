import { BaseBillingProvider, type CfdiInvoiceData, type CfdiResult } from "../BillingProvider.js";
import { logger } from "../../../logger.js";
import https from "https";

function httpsRequest(url: string, options: https.RequestOptions, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

interface FacturapiItemProduct {
  description: string;
  product_key: string;
  unit_key: string;
  unit_name?: string;
  price: number;
  taxes?: Array<{
    type: "IVA";
    rate: number;
  }>;
}

interface FacturapiItem {
  product: FacturapiItemProduct;
  quantity: number;
}

export class FacturapiProvider extends BaseBillingProvider {
  private baseUrl: string = "https://www.facturapi.io/v2";

  async initialize(apiKey: string, sandbox: boolean): Promise<void> {
    this.apiKey = apiKey;
    this.sandbox = sandbox;
    this.baseUrl = "https://www.facturapi.io/v2";
    this.initialized = true;
  }

  async createInvoice(data: CfdiInvoiceData): Promise<CfdiResult> {
    this.ensureInitialized();

    logger.info("INICIANDO FACTURACIÓN", { 
      ticket: data.ticket, 
      total: data.total, 
      rfc: data.customer.rfc,
      razonSocial: data.customer.razonSocial,
      email: data.customer.email,
      method: data.method,
      itemCount: data.items.length,
    });

    const items: FacturapiItem[] = data.items.map((item) => ({
      product: {
        description: item.nombre,
        product_key: item.claveProdServ || "60131324",
        unit_key: item.claveUnidad || "H87",
        unit_name: item.unidad,
        price: item.precioUnitario,
        taxes: [
          {
            type: "IVA",
            rate: 0.16,
          },
        ],
      },
      quantity: item.cantidad,
    }));

    const payload = {
      customer: {
        legal_name: data.customer.razonSocial,
        tax_id: data.customer.rfc,
        email: data.customer.email,
        tax_system: "616",
      },
      items,
      payment_form: this.mapPaymentMethod(data.method),
      use: data.customer.usoCfdi,
      type: "I",
      payment_method: "PUE",
currency: "MXN",
    };

    const urlObj = new URL(`${this.baseUrl}/invoices`);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      timeout: 30000,
    };

    const responseText = await httpsRequest(
      `${this.baseUrl}/invoices`,
      options,
      JSON.stringify(payload)
    );

    const responseObj = JSON.parse(responseText);

    if (responseObj.error || responseObj.message) {
      logger.error("ERROR FACTURACIÓN API", { 
        ticket: data.ticket,
        error: responseObj,
      });
      throw new Error(`Facturapi error: ${JSON.stringify(responseObj)}`);
    }

    const result = responseObj as { id: string; uuid: string; pdf_url?: string; xml_url?: string; status?: string; date?: string; verification_url?: string };

    logger.info("FACTURACIÓN EXITOSA", {
      ticket: data.ticket,
      uuid: result.uuid,
      status: result.status,
      pdfUrl: result.pdf_url,
    });

    return {
      id: result.id,
      uuid: result.uuid,
      pdfUrl: result.pdf_url || "",
      xmlUrl: result.xml_url,
      status: result.status === "valid" ? "sent" : "pending",
      fechaTimbrado: result.date || new Date().toISOString(),
      verificationUrl: result.verification_url,
    };
  }

  async cancelInvoice(uuid: string, motivo: string): Promise<{ success: boolean }> {
    this.ensureInitialized();

    const response = await fetch(`${this.baseUrl}/invoices/${uuid}/cancel`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ motive: motivo }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facturapi cancel error: ${JSON.stringify(error)}`);
    }

    return { success: true };
  }

  async getInvoicePdf(uuid: string): Promise<string> {
    this.ensureInitialized();

    const response = await fetch(`${this.baseUrl}/invoices/${uuid}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Facturapi error getting invoice: ${await response.text()}`);
    }

    const result = await response.json() as { pdf_url?: string };
    return result.pdf_url || "";
  }

  async sendInvoiceEmail(invoiceId: string, email: string): Promise<void> {
    this.ensureInitialized();

    logger.info("ENVIANDO FACTURA POR EMAIL", { invoiceId, email });

    const urlObj = new URL(`${this.baseUrl}/invoices/${invoiceId}/email`);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
    };

    const responseText = await httpsRequest(
      `${this.baseUrl}/invoices/${invoiceId}/email`,
      options,
      JSON.stringify({ email })
    );

    const responseObj = JSON.parse(responseText);

    if (responseObj.error || responseObj.message) {
      logger.error("ERROR AL ENVIAR EMAIL", { invoiceId, email, error: responseObj });
      throw new Error(`Facturapi email error: ${JSON.stringify(responseObj)}`);
    }

    logger.info("EMAIL ENVIADO EXITOSAMENTE", { invoiceId, email });
  }

  private mapPaymentMethod(method: string): string {
    const map: Record<string, string> = {
      efectivo: "01",
      tarjeta: "04",
      "transf.": "03",
      "qr/codi": "17",
    };
    return map[method] || "01";
  }
}