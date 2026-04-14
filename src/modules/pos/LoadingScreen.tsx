import React from "react";
import { Box, Text } from "ink";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { theme } from "../../shared/theme.js";
import { useLayout } from "../../shared/useLayout.js";

// ── Paths ──────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
export const BANNER_PATH = path.resolve(__dirname, "../../../assets/logo.png");

// ── Shared banner cache — loaded once, reused by LoginScreen ──────────────────
export let cachedBannerLines: string[] | null = null;

export async function preloadBanner(cols: number): Promise<void> {
  if (cachedBannerLines !== null) return;
  if (!existsSync(BANNER_PATH)) return;

  try {
    const { default: terminalImage } = await import("terminal-image");
    const buffer   = readFileSync(BANNER_PATH);
    const maxWidth = Math.min(cols - 4, 60);
    const rendered = await terminalImage.buffer(buffer, {
      width: maxWidth,
      preserveAspectRatio: true,
    });
    cachedBannerLines = rendered.split("\n").filter(l => l.length > 0);
  } catch {
    cachedBannerLines = null;
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────
export type LoadTask = {
  label: string;
  run:   () => Promise<void>;
};

type Props = {
  tasks:   LoadTask[];
  onReady: () => void;
};

// ── Spinner frames ─────────────────────────────────────────────────────────────
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// ── Component ──────────────────────────────────────────────────────────────────
export function LoadingScreen({ tasks, onReady }: Props) {
  const layout         = useLayout();
  const { cols, rows, refresh } = layout;

  const [frame,   setFrame]   = React.useState(0);
  const [current, setCurrent] = React.useState(0);
  const [done,    setDone]    = React.useState(false);
  const [error,   setError]   = React.useState<string | null>(null);

  // Refresh layout dimensions after mount (quick, no delay needed since size was pre-captured)
  React.useEffect(() => {
    const t = setTimeout(refresh, 16);
    return () => clearTimeout(t);
  }, [refresh]);

  // Spinner tick
  React.useEffect(() => {
    if (done || error) return;
    const t = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 80);
    return () => clearInterval(t);
  }, [done, error]);

  // Run tasks sequentially
  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      for (let i = 0; i < tasks.length; i++) {
        if (cancelled) return;
        setCurrent(i);
        try {
          await tasks[i]!.run();
        } catch (e) {
          if (!cancelled) setError(String(e));
          return;
        }
      }
      if (!cancelled) {
        setDone(true);
        setTimeout(onReady, 300);
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  const panelW  = Math.min(cols - 4, layout.loadPanelW);
  const innerW  = panelW - 8;
  const spinner = SPINNER[frame]!;

  return (
    <Box
      flexDirection="column"
      width={cols}
      height={rows}
      justifyContent="center"
      alignItems="center"
    >
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={error ? theme.red : done ? theme.green : theme.textDim}
        paddingX={3}
        paddingY={1}
        width={panelW}
      >
        {/* Title */}
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color={error ? theme.red : done ? theme.green : theme.white}>
            {error ? "ERROR AL INICIAR" : done ? "LISTO" : "INICIANDO SISTEMA"}
          </Text>
        </Box>

        <Text color={theme.textDim}>{"─".repeat(innerW)}</Text>

        {/* Task list */}
        <Box flexDirection="column" marginTop={1} gap={0}>
          {tasks.map((task, i) => {
            const isActive   = i === current && !done && !error;
            const isComplete = done ? true : i < current;
            const isFailed   = error !== null && i === current;

            const icon =
              isFailed    ? <Text color={theme.red}>{"x"}</Text>
              : isComplete ? <Text color={theme.green}>{"v"}</Text>
              : isActive   ? <Text color={theme.amber}>{spinner}</Text>
              :               <Text color={theme.textDim}>{"o"}</Text>;

            const labelColor =
              isFailed    ? theme.red
              : isComplete ? theme.textSec
              : isActive   ? theme.white
              :               theme.textDim;

            return (
              <Box key={i} flexDirection="row" gap={2}>
                {icon}
                <Text color={labelColor}>{task.label}</Text>
              </Box>
            );
          })}
        </Box>

        {/* Error detail */}
        {error && (
          <Box marginTop={1}>
            <Text color={theme.red} wrap="wrap">{error}</Text>
          </Box>
        )}

        <Text color={theme.textDim}>{"─".repeat(innerW)}</Text>

        {/* Status line */}
        <Box justifyContent="center" marginTop={0}>
          {done ? (
            <Text color={theme.green} bold>Sistema listo</Text>
          ) : error ? (
            <Text color={theme.red}>Revisa la configuracion e intenta de nuevo</Text>
          ) : (
            <Text color={theme.textDim}>
              {current + 1}/{tasks.length}{"  "}{tasks[current]?.label ?? ""}
            </Text>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text color={theme.textDim}>
          {"Developed by "}
          <Text color={theme.textMuted}>AvalonTM</Text>
        </Text>
      </Box>

    </Box>
  );
}