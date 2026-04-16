import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { execSync } from "child_process";
import type { PrinterConfig, TicketData } from "./types.js";
import { getDefaultConfig } from "./types.js";
import { ThermalDriver, type PrintResult } from "./ThermalDriver.js";
import { TicketBuilder } from "./TicketBuilder.js";
import { getStoreConfig } from "../../db/client.js";
import { logger } from "../../logger.js";

function getExeDir(): string {
  const execPath = process.argv[1] || process.execPath;
  if (!execPath) return process.cwd();
  return dirname(resolve(execPath));
}

function findConfigPath(): string {
  const exeDir = getExeDir();
  const cwdDir = process.cwd();
  
  const exeConfig = resolve(exeDir, "config.json");
  if (existsSync(exeConfig)) return exeConfig;
  
  const cwdConfig = resolve(cwdDir, "config.json");
  if (existsSync(cwdConfig)) return cwdConfig;
  
  return exeConfig;
}

function findTemplatePath(): string {
  const exeDir = getExeDir();
  const cwdDir = process.cwd();
  
  const exeTemplate = resolve(exeDir, "assets", "ticket.json");
  if (existsSync(exeTemplate)) return exeTemplate;
  
  const cwdTemplate = resolve(cwdDir, "assets", "ticket.json");
  if (existsSync(cwdTemplate)) return cwdTemplate;
  
  return exeTemplate;
}

const configPath = findConfigPath();
const templatePath = findTemplatePath();

let config: PrinterConfig | null = null;

export function loadConfig(): PrinterConfig {
  if (config) return config;

  let loadedConfig: PrinterConfig | null = null;

  try {
    // Load main config (without template)
    if (existsSync(configPath)) {
      const file = readFileSync(configPath, "utf-8");
      const rawConfig = JSON.parse(file);
      loadedConfig = { ...getDefaultConfig(), ...rawConfig };
    } else {
      loadedConfig = getDefaultConfig();
    }
  } catch {
    loadedConfig = getDefaultConfig();
  }

  // Load template from assets/ticket.json
  try {
    if (existsSync(templatePath)) {
      const templateFile = readFileSync(templatePath, "utf-8");
      const template = JSON.parse(templateFile) as Record<string, unknown>;
      if (template && loadedConfig) {
        // Merge individual template properties (preserves billing inside template)
        if (template.width !== undefined) loadedConfig.template.width = template.width as number;
        if (template.header) loadedConfig.template.header = template.header as typeof loadedConfig.template.header;
        if (template.body) loadedConfig.template.body = template.body as typeof loadedConfig.template.body;
        if (template.footer) loadedConfig.template.footer = template.footer as typeof loadedConfig.template.footer;
        if (template.actions) loadedConfig.template.actions = template.actions as typeof loadedConfig.template.actions;
        if (template.billing) loadedConfig.template.billing = template.billing as typeof loadedConfig.template.billing;
      }
    }
  } catch (e) {
    console.warn("Could not load template from assets/ticket.json, using default");
  }

  if (!loadedConfig) {
    loadedConfig = getDefaultConfig();
  }

  const storeConfig = getStoreConfig();

  const bannerPath = resolve(process.cwd(), "assets", "banner.png");

  // Update header items with store data from database
  if (loadedConfig.template?.header?.enabled && loadedConfig.template.header.items) {
    for (const item of loadedConfig.template.header.items) {
      if (item.type === "text") {
        // Replace placeholder texts with actual store data from DB
        if (item.value && (
            item.value.includes("TIENDA") || 
            item.value.includes("▸") || 
            item.value.includes("POS") ||
            item.value.includes("MI TIENDA")
        )) {
          item.value = storeConfig.name;
          item.bold = true;
        } else if (item.value && item.value.includes("RFC:")) {
          item.value = `RFC: ${storeConfig.rfc}`;
        } else if (item.value && (
            item.value.includes("Calle") || 
            item.value.includes("Falsa") ||
            item.value.includes("Direcc")
        )) {
          item.value = storeConfig.address;
        }
      }
    }
  }

  // Add banner to header if exists and no image present
  if (existsSync(bannerPath) && loadedConfig.template?.header?.enabled) {
    const hasImage = loadedConfig.template.header.items?.some(item => item.type === "image");
    if (!hasImage) {
      loadedConfig.template.header.items = [
        { type: "image", path: bannerPath, align: "center" },
        ...(loadedConfig.template.header.items || []),
      ];
    }
  }

  config = loadedConfig;
  return config;
}

export function getConfig(): PrinterConfig {
  return config || loadConfig();
}

export function updateConfig(newConfig: Partial<PrinterConfig>): void {
  config = { ...loadConfig(), ...newConfig };
}

export function getWidth(): number {
  return loadConfig().template.width;
}

export async function printTicket(data: TicketData): Promise<PrintResult> {
  const cfg = loadConfig();
  
  logger.info("PRINT TICKET - Config billing:", {
    configBilling: cfg.billing,
    templateBilling: cfg.template.billing,
    printOnTicket: cfg.template?.billing?.printOnTicket,
    showUuid: cfg.template?.billing?.showUuid,
    showVerificationUrl: cfg.template?.billing?.showVerificationUrl,
  });
  
  logger.info("PRINT TICKET - Data billing:", {
    billingStatus: data.billingStatus,
    billingUuid: data.billingUuid,
    billingVerificationUrl: data.billingVerificationUrl,
    billingEmailSent: data.billingEmailSent,
  });
  
  const driver = new ThermalDriver(cfg);
  return driver.print(data, cfg.options.previewBeforePrint);
}

export function buildTicketLines(data: TicketData): string[] {
  const cfg = loadConfig();
  const builder = new TicketBuilder(cfg);
  return builder.build(data);
}

export async function testPrint(): Promise<PrintResult> {
  const cfg = loadConfig();
  const driver = new ThermalDriver(cfg);
  return driver.test();
}

export * from "./types.js";
export * from "./TicketBuilder.js";
export * from "./ThermalDriver.js";

export function getWindowsPrinters(): string[] {
    if (process.platform !== "win32") {
        return [];
    }

    try {
        const output = execSync('wmic printer get name', {
            encoding: "utf-8",
            windowsHide: true,
            timeout: 5000,
        });

        const printers = output
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && line !== "Name")
            .map((line) => line.replace(/^\\\\[^\\]+\\/, "").trim());

        return printers;
    } catch (err) {
        logger.warn("Failed to get Windows printers", { error: String(err) });
        return [];
    }
}
