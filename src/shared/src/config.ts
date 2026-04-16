import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

interface BillingConfig {
  provider: string;
  apiKey: string;
  sandbox: boolean;
  printOnTicket?: boolean;
  showUuid?: boolean;
  showVerificationUrl?: boolean;
}

interface AppConfig {
  printer?: PrinterConfig;
  billing?: BillingConfig;
  template?: TemplateConfig;
  options?: OptionsConfig;
}

interface PrinterConfig {
  type: string;
  interface: string;
  width: number;
  characterSet: string;
}

interface TemplateConfig {
  width: number;
  header: HeaderConfig;
  body: BodyConfig;
  footer: FooterConfig;
  actions: ActionsConfig;
}

interface HeaderConfig {
  enabled: boolean;
  items: HeaderItem[];
}

interface HeaderItem {
  type: string;
  value: string;
  align?: string;
  bold?: boolean;
  if?: string;
}

interface BodyConfig {
  fields: FieldsConfig;
  divider: DividerConfig;
  items: ItemsConfig;
}

interface FieldsConfig {
  enabled: boolean;
  items: FieldItem[];
}

interface FieldItem {
  label: string;
  value: string;
  format?: string;
}

interface DividerConfig {
  enabled: boolean;
  char: string;
}

interface ItemsConfig {
  enabled: boolean;
  showUnit: boolean;
  showUnitType: boolean;
  format: string;
}

interface FooterConfig {
  totals: TotalsConfig;
  payment: PaymentConfig;
  divider: DividerConfig;
  qrcode: QrcodeConfig;
  barcode: BarcodeConfig;
  message: MessageConfig;
}

interface TotalsConfig {
  enabled: boolean;
  items: TotalItem[];
}

interface TotalItem {
  label: string;
  value: string;
  align?: string;
  bold?: boolean;
  size?: string;
  format?: string;
}

interface PaymentConfig {
  enabled: boolean;
  items: PaymentItem[];
}

interface PaymentItem {
  label: string;
  value: string;
  align?: string;
  if?: string;
}

interface QrcodeConfig {
  enabled: boolean;
  data: string;
  size: number;
}

interface BarcodeConfig {
  enabled: boolean;
  type: string;
  value: string;
}

interface MessageConfig {
  enabled: boolean;
  lines: string[];
}

interface ActionsConfig {
  cut: boolean;
  cashDrawer: boolean;
  beep: boolean;
}

interface OptionsConfig {
  printCopies: number;
  previewBeforePrint: boolean;
  timeout: number;
  retryOnFail: boolean;
  maxRetries: number;
}

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (!_config) {
    const configPath = resolve(process.cwd(), "config.json");
    if (existsSync(configPath)) {
      const content = readFileSync(configPath, "utf-8");
      _config = JSON.parse(content);
    } else {
      _config = {};
    }
  }
  return _config!;
}

export function getBillingConfig(): BillingConfig | null {
  return loadConfig().billing || null;
}

export function saveBillingConfig(config: BillingConfig): void {
  const configPath = resolve(process.cwd(), "config.json");
  let appConfig: AppConfig = {};
  
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, "utf-8");
    appConfig = JSON.parse(content);
  }
  
  appConfig.billing = config;
  writeFileSync(configPath, JSON.stringify(appConfig, null, 2), "utf-8");
  _config = appConfig;
}

export function getPrinterConfig(): PrinterConfig | null {
  return loadConfig().printer || null;
}

export function savePrinterConfig(config: PrinterConfig): void {
  const configPath = resolve(process.cwd(), "config.json");
  let appConfig: AppConfig = {};
  
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, "utf-8");
    appConfig = JSON.parse(content);
  }
  
  appConfig.printer = config;
  writeFileSync(configPath, JSON.stringify(appConfig, null, 2), "utf-8");
  _config = appConfig;
}

export function resetConfigCache(): void {
  _config = null;
}