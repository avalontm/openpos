import { appendFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const LOG_PATH = resolve(process.cwd(), "openpos.log");

// Inicializar archivo solo si no existe
if (!existsSync(LOG_PATH)) {
  writeFileSync(LOG_PATH, `${"=".repeat(60)}\nOpenPOS Log - ${new Date().toISOString()}\n${"=".repeat(60)}\n`, "utf-8");
}

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function write(level: LogLevel, msg: string, extra?: unknown) {
  try {
    const detail = extra !== undefined
      ? extra instanceof Error
        ? `\n  ${extra.message}\n  ${extra.stack}`
        : `\n  ${JSON.stringify(extra, null, 2)}`
      : "";
    const line = `[${new Date().toISOString()}] [${level}] ${msg}${detail}\n`;
    appendFileSync(LOG_PATH, line, "utf-8");
  } catch {
    // Silently ignore logging errors
  }
}

export const logger = {
  info:  (msg: string, extra?: unknown) => write("INFO",  msg, extra),
  warn:  (msg: string, extra?: unknown) => write("WARN",  msg, extra),
  error: (msg: string, extra?: unknown) => write("ERROR", msg, extra),
  debug: (msg: string, extra?: unknown) => write("DEBUG", msg, extra),
};