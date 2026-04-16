import { db } from "./client.js";
import { products, type Product } from "./schema.js";
import { eq, like, or, sql } from "drizzle-orm";

export interface PaginatedProducts {
  items: Product[];
  total: number;
}

export function searchProducts(
  query: string,
  offset: number,
  limit: number
): PaginatedProducts {
  const normalizedQuery = query.trim().toLowerCase();

  const items = normalizedQuery
    ? db
        .select()
        .from(products)
        .where(
          or(
            like(products.name, `${normalizedQuery}%`),
            like(products.sku, `${normalizedQuery}%`),
            like(products.barcode, `${normalizedQuery}%`)
          )
        )
        .orderBy(products.name)
        .limit(limit)
        .offset(offset)
        .all()
    : db
        .select()
        .from(products)
        .orderBy(products.name)
        .limit(limit)
        .offset(offset)
        .all();

  const totalCount = normalizedQuery
    ? db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(
          or(
            like(products.name, `${normalizedQuery}%`),
            like(products.sku, `${normalizedQuery}%`),
            like(products.barcode, `${normalizedQuery}%`)
          )
        )
        .get()?.count ?? 0
    : db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .get()?.count ?? 0;

  return { items, total: totalCount };
}

export function findProductByCode(code: string): Product | undefined {
  return db
    .select()
    .from(products)
    .where(or(eq(products.barcode, code), eq(products.sku, code)))
    .limit(1)
    .get();
}