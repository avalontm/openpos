import { ThermalDriver } from "./ThermalDriver.js";
import { loadConfig } from "./index.js";

async function detectUSB(): Promise<boolean> {
  console.log("Probando conexión USB...");
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("node-thermal-printer") as any;
    const ThermalPrinter = mod.printer ?? mod.default ?? mod;

    const printer = new ThermalPrinter({
      type: "epson" as any,
      interface: "USB",
      characterSet: "PC850" as any,
      timeout: 3000,
    });

    const connected = await printer.isPrinterConnected();
    if (connected) {
      console.log("✓ Impresora USB detectada");
      return true;
    }
  } catch (err) {
    console.log("✗ USB no disponible:", err instanceof Error ? err.message : "Error");
  }

  return false;
}

async function testPrint(configInterface: string): Promise<{success: boolean; error?: string; lines?: string[]}> {
  const cfg = loadConfig();

  const testData = {
    ticket: "TEST-" + Date.now().toString().slice(-4),
    date: new Date().toLocaleString("es-MX"),
    employee: "TEST",
    items: [
      { sku: "001", name: "Producto Prueba", price: 100, qty: 1, unitType: "pza" },
    ],
    subtotal: 100,
    tax: 16,
    discount: 0,
    total: 116,
    received: 200,
    change: 84,
    method: "efectivo",
    width: cfg.template.width,
  };

  const testConfig = {
    printer: {
      type: cfg.printer.type,
      interface: configInterface,
      width: cfg.printer.width,
      characterSet: cfg.printer.characterSet,
    },
    billing: cfg.billing,
    template: cfg.template,
    options: { ...cfg.options, previewBeforePrint: false },
  };

  const driver = new ThermalDriver(testConfig);
  return driver.print(testData, false);
}

async function main() {
  console.log("=== Test de Impresión POS ===\n");

  const cfg = loadConfig();
  console.log("Config actual:");
  console.log(`  Tipo: ${cfg.printer.type}`);
  console.log(`  Interfaz: ${cfg.printer.interface}`);
  console.log(`  Ancho: ${cfg.printer.width} col\n`);

  console.log("1. Probando interfaz actual...");
  const result = await testPrint(cfg.printer.interface);
  
  console.log(`  Resultado: ${result.success ? "✓ ÉXITO" : "✗ FALLO"}`);
  if (result.error) console.log(`  Error: ${result.error}`);
  if (result.lines) console.log(`\nPreview:\n${result.lines.join("\n")}`);

  if (!result.success) {
    console.log("\n2. Probando USB...");
    const usbOk = await detectUSB();
    if (usbOk) {
      console.log("\n3. Test por USB...");
      const usbResult = await testPrint("USB");
      console.log(`  Resultado: ${usbResult.success ? "✓ ÉXITO" : "✗ FALLO"}`);
      if (usbResult.error) console.log(`  Error: ${usbResult.error}`);
    }
  }

  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});