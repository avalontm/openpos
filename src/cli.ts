import { resolve } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { db, initDb, getConfig, setConfig, CONFIG_KEYS, products, users, logger } from "@openpos/shared";
import { sql } from "drizzle-orm";

logger.info("CLI module loaded");

function setupGlobalErrorHandlers() {
  process.on("uncaughtException", (err) => {
    logger.error("uncaughtException", { error: String(err), stack: err.stack });
    console.error("\n❌ Error crítico. Revisa openpos.log para detalles.");
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("unhandledRejection", { reason: String(reason), stack: reason instanceof Error ? reason.stack : undefined });
    console.error("\n❌ Error crítico. Revisa openpos.log para detalles.");
    process.exit(1);
  });
}

function isInteractiveTerminal(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true;
}

function checkTerminalSupport(): boolean {
  const stdinTTY = process.stdin.isTTY === true;
  const stdoutTTY = process.stdout.isTTY === true;
  
  logger.info("Terminal check", { stdin: stdinTTY, stdout: stdoutTTY });
  
  if (!stdinTTY || !stdoutTTY) {
    logger.warn("Non-interactive terminal detected", {
      stdin: process.stdin.isTTY,
      stdout: process.stdout.isTTY
    });
    console.error("\n⚠️  Error: Se requiere un terminal interactivo para ejecutar el modo TUI.");
    console.error("   Usa --help para ver comandos disponibles.");
    console.error("   Para modo gráfico, usa: npm run dev:gui");
    return false;
  }
  return true;
}

const VERSION = "1.0.0";

const HELP_TEXT = `
╔════════════════════════════════════════════════════════════════╗
║ OPENPOS v1.0.0                                                 ║
║ Sistema de Punto de Venta                                      ║
╚════════════════════════════════════════════════════════════════╝

USO:
  pos.exe [COMANDO] [OPCIONES]

COMANDOS:
  (sin comando)    Iniciar modo interactivo
  --settings       Abrir configuración (TUI)
  import products  Importar productos desde archivo CSV
  export products Exportar productos a archivo CSV
  seed            Insertar productos de ejemplo
  add user        Agregar nuevo usuario
  config get      Ver configuracion actual
  config set      Actualizar configuracion

  OPCIONES:
  -h, --help      Mostrar esta ayuda
  -v, --version   Mostrar version
  --dry-run       Simular sin guardar cambios
  --replace       Vaciar productos antes de importar

EJEMPLOS:
  pos.exe           Modo interactivo
  pos.exe --settings Configuración TUI
  import products   Importar productos
  import products --replace  Importar reemplazando todo
  export products   Exportar productos
  seed              Productos de ejemplo
  add user juan 1234                    Agregar usuario (role: cashier)
  add user juan 1234 --role admin       Agregar usuario admin
  config get        Ver configuracion
  config set        Actualizar configuracion
`;

const VALID_UNIT_TYPES = ["pza", "kg", "g", "lt", "ml", "m", "cm"];
const VALID_CONFIG_KEYS = Object.values(CONFIG_KEYS);
const VALID_ROLES = ["admin", "cashier"];

function showHelp(): void {
  console.log(HELP_TEXT);
}

function showVersion(): void {
  console.log(`OPENPOS v${VERSION}`);
}

function showError(msg: string): void {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV vacío o sin encabezados");

  const headers = lines[0]!.split(",").map(h => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]!.split(",").map(v => v.trim());
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

function normalizeProduct(row: Record<string, string>) {
  return {
    barcode: row.barcode || null,
    sku: row.sku?.trim() || "",
    name: row.name?.trim() || "",
    price: parseFloat(row.price) || 0,
    cost: parseFloat(row.cost) || 0,
    category: row.category?.trim() || "GEN",
    stock: parseFloat(row.stock) || 0,
    minStock: parseFloat(row.minstock) || 5,
    unitType: (row.unittype?.trim() || "pza").toLowerCase(),
    unitQty: parseFloat(row.unitqty) || 1,
    active: 1,
  };
}

async function importProducts(filePath: string, dryRun: boolean, replace: boolean = false): Promise<void> {
  if (!filePath) {
    showError("Falta archivo. Uso: pos.exe import products <archivo.csv>");
  }

  const fullPath = resolve(process.cwd(), filePath);
  if (!existsSync(fullPath)) {
    showError(`Archivo no encontrado: ${filePath}`);
  }

  console.log(`📂 Importando: ${filePath}${replace ? " (REPLACE)" : ""}`);

  initDb();

  if (replace) {
    console.log("🗑️  Limpiando productos existentes...");
    db.delete(products).run();
    console.log("✅ Productos eliminados");
  }

  const content = readFileSync(fullPath, "utf-8");
  const rows = parseCSV(content);

  console.log(`📊 ${rows.length} productos encontrados en CSV`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const lineNum = i + 2;

    if (!row.sku || !row.name) {
      errors.push(`Línea ${lineNum}: Falta SKU o nombre`);
      continue;
    }

    if (!row.price || isNaN(parseFloat(row.price))) {
      errors.push(`Línea ${lineNum}: Precio inválido`);
      continue;
    }

    if (row.unittype && !VALID_UNIT_TYPES.includes(row.unittype.toLowerCase())) {
      errors.push(`Línea ${lineNum}: unitType inválido (use: pza, kg, g, lt, ml, m, cm)`);
      continue;
    }

    const product = normalizeProduct(row);
    const existing = db.select().from(products).where(sql`sku = ${product.sku}`).get();

    if (existing) {
      if (dryRun) {
        console.log(`  🔄 [dry-run] Se actualizaría: ${product.sku} - ${product.name}`);
        updated++;
      } else {
        db.run(sql`
          UPDATE products SET
            name = ${product.name},
            price = ${product.price},
            cost = ${product.cost},
            category = ${product.category},
            stock = ${product.stock},
            barcode = ${product.barcode},
            unitType = ${product.unitType},
            unitQty = ${product.unitQty},
            minStock = ${product.minStock},
            updated_at = datetime('now')
          WHERE sku = ${product.sku}
        `);
        console.log(`  🔄 ${product.sku} - actualizado`);
        updated++;
      }
    } else {
      if (dryRun) {
        console.log(`  ✅ [dry-run] Se insertaría: ${product.sku} - ${product.name}`);
        inserted++;
      } else {
        db.insert(products).values({
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).run();
        console.log(`  ✅ ${product.sku} - ${product.name}`);
        inserted++;
      }
    }
  }

  console.log("\n📈 RESUMEN:");
  console.log(`   ✅ Insertados: ${inserted}`);
  console.log(`   🔄 Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos: ${skipped}`);
  console.log(`   ❌ Errores: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n❌ ERRORES:");
    errors.forEach(e => console.log(`   ${e}`));
  }
}

async function exportProducts(filePath: string): Promise<void> {
  if (!filePath) {
    showError("Falta archivo. Uso: pos.exe export products <archivo.csv>");
  }

  initDb();

  const allProducts = db.select().from(products).all();

  if (allProducts.length === 0) {
    showError("No hay productos para exportar");
  }

  const headers = ["sku", "name", "price", "cost", "category", "stock", "barcode", "unittype", "unitqty", "minstock"];
  const csvLines = [headers.join(",")];

  for (const p of allProducts) {
    const row = [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.price.toString(),
      (p.cost ?? 0).toString(),
      p.category,
      p.stock.toString(),
      p.barcode || "",
      p.unitType,
      (p.unitQty ?? 1).toString(),
      (p.minStock ?? 5).toString(),
    ];
    csvLines.push(row.join(","));
  }

  const fullPath = resolve(process.cwd(), filePath);
  writeFileSync(fullPath, csvLines.join("\n"), "utf-8");

  console.log(`✅ Exportados ${allProducts.length} productos a: ${filePath}`);
}

async function runSeed(dryRun: boolean): Promise<void> {
  initDb();

  const sample = [
    { barcode: "7501234560014", sku: "BEB001", name: "Agua Bonafont 600ml", price: 15, cost: 8, category: "BEB", stock: 100, minStock: 20, unitType: "pza", unitQty: 0.6 },
    { barcode: "7501234560021", sku: "BEB002", name: "Coca-Cola 600ml", price: 22, cost: 12, category: "BEB", stock: 80, minStock: 15, unitType: "pza", unitQty: 0.6 },
    { barcode: "7501234560038", sku: "BEB003", name: "Cafe Americano", price: 35, cost: 18, category: "BEB", stock: 50, minStock: 10, unitType: "pza", unitQty: 1 },
    { barcode: "7503000100019", sku: "BOT001", name: "Papas Fritas Sabritas", price: 28, cost: 14, category: "BOT", stock: 60, minStock: 15, unitType: "pza", unitQty: 1 },
    { barcode: "7503000100026", sku: "BOT002", name: "Chicles Orbit Menta", price: 12, cost: 5, category: "BOT", stock: 100, minStock: 20, unitType: "pza", unitQty: 1 },
    { barcode: "7505000100014", sku: "GEN001", name: "Cigarros Camel", price: 55, cost: 38, category: "GEN", stock: 40, minStock: 10, unitType: "pza", unitQty: 1 },
    { barcode: "7505000100021", sku: "GEN002", name: "Encendedor Bic", price: 15, cost: 6, category: "GEN", stock: 50, minStock: 15, unitType: "pza", unitQty: 1 },
  ];

  let inserted = 0;
  for (const p of sample) {
    const existing = db.select().from(products).where(sql`sku = ${p.sku}`).get();
    if (existing) continue;

    if (dryRun) {
      console.log(`  ✅ [dry-run] Se insertaría: ${p.sku} - ${p.name}`);
    } else {
      db.insert(products).values({
        ...p,
        active: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();
      console.log(`  ✅ ${p.sku} - ${p.name}`);
    }
    inserted++;
  }

  console.log(`\n📈 Seed: ${inserted} productos insertados (dry-run: ${dryRun})`);
}

async function configGet(key: string): Promise<void> {
  if (!key) {
    console.log("Available config keys:");
    VALID_CONFIG_KEYS.forEach(k => {
      const val = getConfig(k);
      console.log(`  ${k}: ${val || "(no value)"}`);
    });
    return;
  }

  if (!VALID_CONFIG_KEYS.includes(key as any)) {
    showError(`Invalid key. Use: ${VALID_CONFIG_KEYS.join(", ")}`);
  }

  const val = getConfig(key);
  console.log(`${key} = ${val || "(no value)"}`);
}

async function configSet(key: string, value: string): Promise<void> {
  if (!key || value === undefined) {
    showError("Missing parameters. Usage: pos.exe config set <key> <value>");
  }

  if (!VALID_CONFIG_KEYS.includes(key as any)) {
    showError(`Invalid key. Use: ${VALID_CONFIG_KEYS.join(", ")}`);
  }

  const ok = setConfig(key, value);
  if (ok) {
    console.log(`✅ ${key} = ${value}`);
  } else {
    showError(`Failed to save ${key}`);
  }
}

async function addUser(username: string, pin: string, role: string): Promise<void> {
  if (!username || !pin) {
    showError("Missing parameters. Usage: pos.exe add user <username> <pin> [--role <role>]");
  }

  if (username.includes(" ")) {
    showError("Username cannot contain spaces");
  }

  if (pin.includes(" ")) {
    showError("PIN cannot contain spaces");
  }

  if (username.length < 2) {
    showError("Username must be at least 2 characters");
  }

  if (pin.length < 4) {
    showError("PIN must be at least 4 characters");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showError("Username can only contain letters, numbers and underscores");
  }

  const finalRole = role || "cashier";
  if (!VALID_ROLES.includes(finalRole as any)) {
    showError(`Invalid role. Use: ${VALID_ROLES.join(", ")}`);
  }

  initDb();

  const existing = db.select().from(users).where(sql`username = ${username}`).get();
  if (existing) {
    showError(`User '${username}' already exists`);
  }

  db.insert(users).values({
    username,
    name: username,
    pin,
    role: finalRole,
    active: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).run();

  console.log(`✅ User '${username}' created with role '${finalRole}'`);
}

export async function runCLI(): Promise<boolean> {
  setupGlobalErrorHandlers();
  
  const args = process.argv.slice(2);

  if (args.length === 0) {
    if (!checkTerminalSupport()) {
      return false;
    }

    process.stdout.write("\x1b[?1049h");
    process.stdout.write("\x1b[3J");
    process.stdout.write("\x1b[H");
    process.stdout.write(" \r");
    
    initDb();
    
    try {
      const { render } = await import("ink");
      const React = await import("react");
      const { App } = await import("./app.js");
      
      function cleanup() {
        process.stdout.write("\x1b[?1049l");
      }
      process.on("exit", cleanup);
      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);
      
      render(React.default.createElement(App));
      return true;
    } catch (err) {
      const errMsg = String(err);
      const isRawModeError = errMsg.includes("Raw mode") || errMsg.includes("is not supported");
      
      if (isRawModeError) {
        logger.error("TUI render failed: Raw mode not supported", { 
          error: errMsg,
          stdin: process.stdin.isTTY,
          stdout: process.stdout.isTTY
        });
      } else {
        logger.error("TUI render failed", { error: errMsg, stack: err instanceof Error ? err.stack : undefined });
      }
      
      console.error("\n❌ Error al iniciar la interfaz TUI.");
      if (isRawModeError) {
        console.error("   El terminal no soporta modo raw.");
      }
      console.error("   Revisa openpos.log para detalles.");
      console.error("   Prueba: npm run dev:gui (modo gráfico)");
      
      process.stdout.write("\x1b[?1049l");
      process.exit(1);
    }
  }

  initDb();

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");
  const replace = args.includes("--replace");

  const cmd = args[0];
  const subcmd = args[1];
  const param = args[2];

  switch (cmd) {
    case "--settings":
      if (!checkTerminalSupport()) {
        return false;
      }

      process.stdout.write("\x1b[?1049h");
      process.stdout.write("\x1b[3J");
      process.stdout.write("\x1b[H");
      process.stdout.write(" \r");
      
      const initialCols = process.stdout.columns || 80;
      const initialRows = process.stdout.rows || 24;
      (globalThis as unknown as { __TERM_COLS__: number; __TERM_ROWS__: number }).__TERM_COLS__ = initialCols;
      (globalThis as unknown as { __TERM_COLS__: number; __TERM_ROWS__: number }).__TERM_ROWS__ = initialRows;
      logger.info(`Settings: starting — terminal ${initialCols}x${initialRows}`);
      
      (async () => {
        try {
          const { render } = await import("ink");
          const React = await import("react");
          const { SettingsApp } = await import("./modules/settings/SettingsApp.js");
          const { initDb } = await import("@openpos/shared");
          initDb();
          
          function cleanup() {
            process.stdout.write("\x1b[?1049l");
          }
          process.on("exit", cleanup);
          process.on("SIGINT", cleanup);
          process.on("SIGTERM", cleanup);
          
          render(React.default.createElement(SettingsApp));
          logger.info("Settings: rendered");
        } catch (err) {
          logger.error("Settings render failed", { error: String(err), stack: err instanceof Error ? err.stack : undefined });
          console.error("\n❌ Error al iniciar configuración.");
          console.error("   Revisa openpos.log para detalles.");
          process.exit(1);
        }
      })();
      return true;

    case "import":
      if (subcmd === "products") {
        await importProducts(param, dryRun, replace);
        process.exit(0);
      }
      showError("Uso: pos.exe import products <archivo.csv> [--replace]");
      break;

    case "export":
      if (subcmd === "products") {
        await exportProducts(param);
        process.exit(0);
      }
      showError("Uso: pos.exe export products <archivo.csv>");
      break;

    case "seed":
      await runSeed(dryRun);
      process.exit(0);

    case "config":
      if (subcmd === "get") {
        await configGet(param);
        process.exit(0);
      }
      if (subcmd === "set") {
        await configSet(param, args[3]);
        process.exit(0);
      }
      showError("Uso: pos.exe config get <key> | set <key> <value>");
      break;

    case "add":
      if (subcmd === "user") {
        const roleIdx = args.indexOf("--role");
        const role = roleIdx !== -1 ? args[roleIdx + 1] : undefined;
        const userIdx = args.indexOf("user");
        const username = args[userIdx + 1];
        const pin = args[userIdx + 2];
        if (!username || !pin) {
          showError("Missing parameters. Usage: pos.exe add user <username> <pin> [--role <role>]");
        }
        await addUser(username, pin, role || "cashier");
        process.exit(0);
      }
      showError("Usage: pos.exe add user <username> <pin> [--role <role>]");
      break;

    default:
      console.log(`Comando desconocido: ${cmd}`);
      console.log("Use --help para ver los comandos disponibles");
      process.exit(1);
  }

  return false;
}

runCLI();