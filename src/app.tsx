import React from "react";
import { render } from "ink";
import { PosScreen }     from "./modules/pos/PosScreen.js";
import { LoginScreen }   from "./modules/pos/LoginScreen.js";
import { LoadingScreen, preloadBanner, type LoadTask } from "./modules/pos/LoadingScreen.js";
import { initDb }        from "./db/client.js";
import { runCLI }        from "./cli.js";
import path              from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Capture terminal size BEFORE switching to alternate screen ───────────────
// Windows Terminal reports correct dimensions in the main buffer.
// After switching to alternate screen, size detection can fail temporarily.
const initialCols = process.stdout.columns || 80;
const initialRows = process.stdout.rows || 24;

// Store globally for useLayout hook to use as initial values
(globalThis as unknown as { __TERM_COLS__: number; __TERM_ROWS__: number }).__TERM_COLS__ = initialCols;
(globalThis as unknown as { __TERM_COLS__: number; __TERM_ROWS__: number }).__TERM_ROWS__ = initialRows;

// ── CLI mode — skip interactive UI entirely ────────────────────────────────────
const isCliMode = await runCLI();
if (isCliMode === true) process.exit(0);

// ── Alternate screen buffer ────────────────────────────────────────────────────
process.stdout.write("\x1b[?1049h");  // Activate alternate screen
process.stdout.write("\x1b[3J");       // Clear screen + scrollback
process.stdout.write("\x1b[H");        // Cursor to home (0,0)
// Write space to force terminal to commit to dimensions
process.stdout.write(" \r");

function cleanup() {
  process.stdout.write("\x1b[?1049l");
}
process.on("exit",   cleanup);
process.on("SIGINT",  cleanup);
process.on("SIGTERM", cleanup);

// ── App shell ──────────────────────────────────────────────────────────────────
type AppState = "loading" | "login" | "pos";

function App() {
  const [state, setState] = React.useState<AppState>("loading");

  // ── Loading tasks — define what to preload ─────────────────────────────────
  // Each task runs sequentially and is shown in the loading screen list.
  // Add more tasks here (config validation, network checks, etc.) as needed.
  const tasks = React.useMemo<LoadTask[]>(() => [
    {
      label: "Initializing database",
      run:   async () => { initDb(); },
    },
    {
      label: "Loading assets",
      run:   async () => {
        const cols = process.stdout.columns || 80;
        await preloadBanner(cols);
      },
    },
    {
      label: "Checking configuration",
      run:   async () => {
        // Add any config validation here
        await new Promise(r => setTimeout(r, 80));
      },
    },
  ], []);

  if (state === "loading") {
    return (
      <LoadingScreen
        tasks={tasks}
        onReady={() => setState("login")}
      />
    );
  }

  if (state === "login") {
    return <LoginScreen onLogin={() => setState("pos")} />;
  }

  return <PosScreen onLogout={() => setState("login")} />;
}

render(<App />);