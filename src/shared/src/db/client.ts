import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";
import { logger } from "../logger.js";

let sqlite: Database;
let _db: ReturnType<typeof drizzle>;

function getDb() {
  if (!sqlite) {
    sqlite = new Database("pos.db");
    sqlite.exec("PRAGMA journal_mode = WAL;");
    _db = drizzle(sqlite, { schema });
  }
  return sqlite;
}

export const db = new Proxy({} as any, {
  get(_target, prop) {
    const dbInstance = getDb();
    if (prop === "run" || prop === "exec" || prop === "prepare") {
      return dbInstance[prop].bind(dbInstance);
    }
    if (prop === "select" || prop === "insert" || prop === "update" || prop === "delete") {
      return _db ? _db[prop] : (getDb()[prop as keyof typeof dbInstance]);
    }
    return _db ? _db[prop as keyof typeof _db] : dbInstance[prop as keyof typeof dbInstance];
  }
});

export const CONFIG_KEYS = {
  LAST_TICKET: "lastTicketNum",
  STORE_NAME: "storeName",
  STORE_RFC: "storeRfc",
  STORE_ADDRESS: "storeAddress",
  STORE_LEGAL_NAME: "storeLegalName",
  STORE_EMAIL: "storeEmail",
  STORE_PHONE: "storePhone",
  STORE_REGIMEN: "storeRegimen",
  TAX_RATE: "taxRate",
  PRINTER_ENABLED: "printerEnabled",
  BILLING_API_KEY: "billingApiKey",
  BILLING_PROVIDER: "billingProvider",
  BILLING_SANDBOX: "billingSandbox",
  TERMS_ACCEPTED: "termsAccepted",
} as const;

export type ConfigKey = typeof CONFIG_KEYS[keyof typeof CONFIG_KEYS];

export function getConfig(key: string): string | null {
  try {
    const row = (db as any).select().from(schema.config).where(sql`key = ${key}`).get();
    return row?.value ?? null;
  } catch {
    return null;
  }
}

export function setConfig(key: string, value: string): boolean {
  try {
    (db as any)
      .insert(schema.config)
      .values({ key, value, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: schema.config.key,
        set: { value, updatedAt: new Date().toISOString() },
      })
      .run();
    logger.info("Config saved", { key, value });
    return true;
  } catch (err) {
    logger.error("Failed to save config", { key, value, error: String(err) });
    return false;
  }
}

export function getStoreConfig() {
  return {
    name: getConfig(CONFIG_KEYS.STORE_NAME) || "MI TIENDA",
    rfc: getConfig(CONFIG_KEYS.STORE_RFC) || "XAXX010101000",
    address: getConfig(CONFIG_KEYS.STORE_ADDRESS) || "Sin dirección",
    legalName: getConfig(CONFIG_KEYS.STORE_LEGAL_NAME) || "Mi Tienda SA de CV",
    email: getConfig(CONFIG_KEYS.STORE_EMAIL) || "",
    phone: getConfig(CONFIG_KEYS.STORE_PHONE) || "",
    regimen: getConfig(CONFIG_KEYS.STORE_REGIMEN) || "601",
    taxRate: parseFloat(getConfig(CONFIG_KEYS.TAX_RATE) || "16"),
    printerEnabled: getConfig(CONFIG_KEYS.PRINTER_ENABLED) === "true",
  };
}

export function initDb() {
  const dbInstance = getDb();
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode    TEXT UNIQUE,
      sku        TEXT NOT NULL UNIQUE,
      name       TEXT NOT NULL,
      price      REAL NOT NULL,
      cost       REAL DEFAULT 0,
      category   TEXT NOT NULL DEFAULT 'GEN',
      stock      REAL NOT NULL DEFAULT 0,
      min_stock  REAL DEFAULT 5,
      unit_type  TEXT NOT NULL DEFAULT 'pza',
      unit_qty   REAL DEFAULT 1,
      active     INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket     TEXT NOT NULL,
      subtotal   REAL NOT NULL,
      tax        REAL NOT NULL,
      discount   REAL DEFAULT 0,
      total      REAL NOT NULL,
      received   REAL DEFAULT 0,
      change     REAL DEFAULT 0,
      method     TEXT NOT NULL,
      status     TEXT DEFAULT 'completed',
      items      TEXT NOT NULL,
      item_count INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT DEFAULT 'admin',
      customer_rfc TEXT,
      customer_razon_social TEXT,
      customer_email TEXT,
      customer_direccion TEXT,
      cfdi_uuid TEXT,
      cfdi_status TEXT DEFAULT 'none',
      cfdi_pdf_url TEXT,
      cfdi_error TEXT
    )
  `);
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT NOT NULL UNIQUE,
      name       TEXT NOT NULL,
      pin        TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'cashier',
      active     INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      code          TEXT NOT NULL UNIQUE,
      rfc           TEXT NOT NULL UNIQUE,
      razon_social  TEXT NOT NULL,
      email         TEXT,
      telefono      TEXT,
      direccion     TEXT,
      regimen_fiscal TEXT,
      puntos        REAL DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `);

  initDefaultConfig();
}

function initDefaultConfig(): void {
  const defaults: Record<string, string> = {
    [CONFIG_KEYS.LAST_TICKET]: "1",
    [CONFIG_KEYS.STORE_NAME]: "MI TIENDA",
    [CONFIG_KEYS.STORE_RFC]: "XAXX010101000",
    [CONFIG_KEYS.STORE_ADDRESS]: "Calle Principal 123",
    [CONFIG_KEYS.STORE_LEGAL_NAME]: "Mi Tienda SA de CV",
    [CONFIG_KEYS.STORE_EMAIL]: "",
    [CONFIG_KEYS.STORE_PHONE]: "",
    [CONFIG_KEYS.STORE_REGIMEN]: "601",
    [CONFIG_KEYS.TAX_RATE]: "16",
    [CONFIG_KEYS.PRINTER_ENABLED]: "false",
    [CONFIG_KEYS.BILLING_PROVIDER]: "facturapi",
    [CONFIG_KEYS.BILLING_SANDBOX]: "true",
  };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const existing = getConfig(key);
    if (existing === null) {
      setConfig(key, defaultValue);
    }
  }
}

function getNextClientCode(): string {
  const row = (db as any).select().from(schema.clients).orderBy(sql`id DESC`).limit(1).get();
  if (!row) return "CL-00001";
  const lastNum = parseInt(row.code.replace("CL-", ""), 10);
  return `CL-${String(lastNum + 1).padStart(5, "0")}`;
}

export function getClientByRfc(rfc: string): schema.Client | null {
  try {
    return (db as any).select().from(schema.clients).where(sql`rfc = ${rfc}`).get() ?? null;
  } catch {
    return null;
  }
}

export function getClientByCode(code: string): schema.Client | null {
  try {
    return (db as any).select().from(schema.clients).where(sql`code = ${code}`).get() ?? null;
  } catch {
    return null;
  }
}

export interface CreateClientData {
  rfc: string;
  razonSocial: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  regimenFiscal?: string;
}

export function getOrCreateClient(data: CreateClientData): schema.Client {
  const existing = getClientByRfc(data.rfc);
  if (existing) return existing;

  const code = getNextClientCode();
  const now = new Date().toISOString();

  (db as any)
    .insert(schema.clients)
    .values({
      code,
      rfc: data.rfc,
      razonSocial: data.razonSocial,
      email: data.email ?? null,
      telefono: data.telefono ?? null,
      direccion: data.direccion ?? null,
      regimenFiscal: data.regimenFiscal ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return getClientByRfc(data.rfc)!;
}

export function listClients(search?: string): schema.Client[] {
  try {
    if (search) {
      return (db as any).select().from(schema.clients).where(sql`
        rfc LIKE ${'%' + search + '%'} OR 
        razon_social LIKE ${'%' + search + '%'} OR 
        email LIKE ${'%' + search + '%'} OR
        code LIKE ${'%' + search + '%'}
      `).all();
    }
    return (db as any).select().from(schema.clients).orderBy(sql`razon_social ASC`).all();
  } catch {
    return [];
  }
}

export function updateClientPoints(rfc: string, puntos: number): boolean {
  try {
    (db as any)
      .update(schema.clients)
      .set({ puntos: puntos, updatedAt: new Date().toISOString() })
      .where(sql`rfc = ${rfc}`)
      .run();
    return true;
  } catch {
    return false;
  }
}