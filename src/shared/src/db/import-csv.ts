import { readFileSync } from "fs";
import { db, initDb } from "./client.js";
import { products } from "./schema.js";
import { sql } from "drizzle-orm";

const VALID_UNIT_TYPES = ["pza", "kg", "g", "lt", "ml", "m", "cm"];

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV vacío o sin encabezados");
  
  const headers = lines[0]!.split(",").map(h => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]!.split(",").map(v => v.trim());
    if (values.length !== headers.length) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  
  return rows;
}

function validateRow(row: Record<string, string>, lineNum: number): string | null {
  if (!row.sku) return `Línea ${lineNum}: Falta SKU`;
  if (!row.name) return `Línea ${lineNum}: Falta nombre`;
  if (!row.price || isNaN(parseFloat(row.price))) return `Línea ${lineNum}: Precio inválido`;
  if (row.unittype && !VALID_UNIT_TYPES.includes(row.unittype)) {
    return `Línea ${lineNum}: unitType inválido (use: pza, kg, g, lt, ml, m, cm)`;
  }
  return null;
}

export async function runImport(filePath: string) {
  console.log(`📂 Importando: ${filePath}`);

  initDb();

  const content = readFileSync(filePath, "utf-8");
  const rows = parseCSV(content);
  
  console.log(`📊 ${rows.length} productos encontrados`);

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const lineNum = i + 2;
    
    const error = validateRow(row, lineNum);
    if (error) {
      errors.push(error);
      continue;
    }

    const existing = db.select().from(products).where(sql`sku = ${row.sku}`).get();
    if (existing) {
      skipped++;
      console.log(`  ⏭️  ${row.sku} - ya existe`);
      continue;
    }

    const normalized = {
      barcode: row.barcode || null,
      sku: row.sku,
      name: row.name,
      price: parseFloat(row.price) || 0,
      cost: parseFloat(row.cost) || 0,
      category: row.category || "GEN",
      stock: parseFloat(row.stock) || 0,
      minStock: parseFloat(row.minstock) || 5,
      unitType: row.unittype || "pza",
      unitQty: parseFloat(row.unitqty) || 1,
      active: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inserted++;
    console.log(`  ✅ ${row.sku} - ${row.name}`);
  }

  console.log("\n📈 RESUMEN:");
  console.log(`   ✅ Insertados: ${inserted}`);
  console.log(`   ⏭️  Omitidos (ya existen): ${skipped}`);
  console.log(`   ❌ Errores: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log("\n❌ ERRORES:");
    errors.forEach(e => console.log(`   ${e}`));
  }
}
