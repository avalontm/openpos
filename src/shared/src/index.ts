export * from "./theme.js";
export { logger } from "./logger.js";
export { getBillingConfig, loadConfig, saveBillingConfig, resetConfigCache, getPrinterConfig, savePrinterConfig } from "./config.js";
export * from "./components/index.js";
export * from "./hooks/index.js";

export { db, initDb, getConfig, setConfig, CONFIG_KEYS, getStoreConfig } from "./db/client.js";
export { products, sales, users, config, clients, UNIT_TYPES } from "./db/schema.js";
export type { Product, Sale, User, Client, UnitType } from "./db/schema.js";

export { getClientByRfc, getClientByCode, getOrCreateClient, listClients, updateClientPoints } from "./db/client.js";
export type { CreateClientData } from "./db/client.js";

export { eq, and, or, not, sql, like, type SQL } from "drizzle-orm";

export { searchProducts, findProductByCode, type PaginatedProducts } from "./db/pagination.js";

export * from "./store/cart.js";
export * from "./store/auth.js";
export * from "./store/windowManager.js";

export * from "./utils/printer/index.js";

export { runSeed } from "./db/seed.js";
export { runImport } from "./db/import-csv.js";

export { billingService, type BillingService, type BillingProviderType } from "./services/billing/BillingService.js";
export type { CfdiInvoiceData, CfdiResult, CfdiCustomer, CfdiItem } from "./services/billing/BillingProvider.js";