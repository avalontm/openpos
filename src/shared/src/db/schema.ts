import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const UNIT_TYPES = {
  pza: "pza",
  kg: "kg",
  g: "g",
  lt: "lt",
  ml: "ml",
  m: "m",
  cm: "cm",
} as const;
export type UnitType = typeof UNIT_TYPES[keyof typeof UNIT_TYPES];

export const products = sqliteTable("products", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  barcode:    text("barcode").unique(),
  sku:        text("sku").notNull().unique(),
  name:       text("name").notNull(),
  price:      real("price").notNull(),
  cost:       real("cost").default(0),
  category:   text("category").notNull().default("GEN"),
  stock:      real("stock").notNull().default(0),
  minStock:   real("min_stock").default(5),
  unitType:   text("unit_type").notNull().default("pza"),
  unitQty:    real("unit_qty").default(1),
  active:     integer("active").default(1),
  createdAt:  text("created_at").default(new Date().toISOString()),
  updatedAt:  text("updated_at").default(new Date().toISOString()),
});

export const config = sqliteTable("config", {
  key:        text("key").primaryKey(),
  value:      text("value").notNull(),
  updatedAt:  text("updated_at").default(new Date().toISOString()),
});

export const sales = sqliteTable("sales", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  ticket:     text("ticket").notNull(),
  subtotal:   real("subtotal").notNull(),
  tax:        real("tax").notNull(),
  discount:   real("discount").default(0),
  total:      real("total").notNull(),
  received:   real("received").default(0),
  change:     real("change").default(0),
  method:     text("method").notNull(),
  status:     text("status").default("completed"),
  items:      text("items").notNull(),
  itemCount:  integer("item_count").notNull(),
  createdAt:  text("created_at").notNull(),
  createdBy:  text("created_by").default("admin"),
  customerRfc: text("customer_rfc"),
  customerRazonSocial: text("customer_razon_social"),
  customerEmail: text("customer_email"),
  cfdiStatus: text("cfdi_status"),
  cfdiUuid:   text("cfdi_uuid"),
});

export const users = sqliteTable("users", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  username:   text("username").notNull().unique(),
  name:       text("name").notNull(),
  pin:        text("pin").notNull(),
  role:       text("role").notNull().default("cashier"),
  active:     integer("active").default(1),
  createdAt:  text("created_at").default(new Date().toISOString()),
  updatedAt:  text("updated_at").default(new Date().toISOString()),
});

export type Product = typeof products.$inferSelect;
export type Sale    = typeof sales.$inferSelect;
export type User    = typeof users.$inferSelect;

// Tipos para reportes
export type SaleItem = {
  sku: string;
  name: string;
  price: number;
  qty: number;
  unitType: string;
};

export type DailyReport = {
  date: string;
  totalSales: number;
  totalTickets: number;
  totalItems: number;
  totalDiscount: number;
  totalTax: number;
  byMethod: Record<string, { count: number; total: number }>;
};

export type ProductSales = {
  sku: string;
  name: string;
  category: string;
  qtySold: number;
  totalRevenue: number;
};

export const clients = sqliteTable("clients", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  code:         text("code").notNull().unique(),
  rfc:          text("rfc").notNull().unique(),
  razonSocial:  text("razon_social").notNull(),
  email:        text("email"),
  telefono:     text("telefono"),
  direccion:    text("direccion"),
  regimenFiscal:text("regimen_fiscal"),
  puntos:       real("puntos").default(0),
  createdAt:    text("created_at").default(new Date().toISOString()),
  updatedAt:    text("updated_at").default(new Date().toISOString()),
});

export type Client = typeof clients.$inferSelect;
