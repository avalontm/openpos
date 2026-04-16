import React from "react";
import { render } from "ink";
import { PosScreen } from "./modules/pos/PosScreen.js";
import { LoginScreen } from "./modules/pos/LoginScreen.js";
import { TermsScreen } from "./modules/pos/TermsScreen.js";
import { LoadingScreen, preloadBanner, type LoadTask } from "./modules/pos/LoadingScreen.js";
import { initDb, logger, getBillingConfig, billingService, getConfig, CONFIG_KEYS } from "@openpos/shared";

const initialCols = process.stdout.columns || 80;
const initialRows = process.stdout.rows || 24;
(globalThis as unknown as { __TERM_COLS__: number; __TERM_ROWS__: number }).__TERM_COLS__ = initialCols;
(globalThis as unknown as { __TERM_COLS__: number; __TERM_ROWS__: number }).__TERM_ROWS__ = initialRows;
logger.info(`App initiating — terminal ${initialCols}x${initialRows}`);

logger.info("Modo TUI — iniciando interfaz de terminal");

process.stdout.write("\x1b[?1049h");
process.stdout.write("\x1b[3J");
process.stdout.write("\x1b[H");
process.stdout.write(" \r");

function cleanup() {
  process.stdout.write("\x1b[?1049l");
}
process.on("exit", cleanup);
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

type AppState = "loading" | "terms" | "login" | "pos";

export function App() {
  const [state, setState] = React.useState<AppState>("loading");

  const tasks = React.useMemo<LoadTask[]>(() => [
    {
      label: "Initializing database",
      run: async () => {
        logger.info("Task: initDb");
        initDb();
      },
    },
    {
      label: "Loading assets",
      run: async () => {
        const cols = process.stdout.columns || 80;
        logger.info(`Task: preloadBanner cols=${cols}`);
        await preloadBanner(cols);
      },
    },
    {
      label: "Checking configuration",
      run: async () => {
        logger.info("Task: checking configuration");
        await new Promise(r => setTimeout(r, 80));
      },
    },
    {
      label: "Initializing billing service",
      run: async () => {
        const billingConfig = getBillingConfig();
        
        if (billingConfig?.apiKey && billingConfig?.provider) {
          logger.info("Task: initBilling", { 
            provider: billingConfig.provider, 
            sandbox: billingConfig.sandbox 
          });
          
          await billingService.initialize(
            billingConfig.provider as "facturapi",
            billingConfig.apiKey,
            billingConfig.sandbox ?? false
          );
          
          logger.info("Billing service initialized", { provider: billingConfig.provider });
        } else {
          logger.info("Task: initBilling - no billing config in config.json, skipping");
        }
      },
    },
  ], []);

  const handleLoadingReady = React.useCallback(() => {
    const termsAccepted = getConfig(CONFIG_KEYS.TERMS_ACCEPTED);
    if (termsAccepted === "true") {
      logger.info("LoadingScreen → login (terms accepted)");
      setState("login");
    } else {
      logger.info("LoadingScreen → terms");
      setState("terms");
    }
  }, []);

  if (state === "loading") {
    return (
      <LoadingScreen
        tasks={tasks}
        onReady={handleLoadingReady}
      />
    );
  }

  if (state === "terms") {
    return <TermsScreen onAccept={() => { logger.info("TermsScreen → login"); setState("login"); }} />;
  }

  if (state === "login") {
    return <LoginScreen onLogin={() => { logger.info("LoginScreen → pos"); setState("pos"); }} />;
  }

  return <PosScreen onLogout={() => { logger.info("PosScreen → login"); setState("login"); }} />;
}

export { App as default };