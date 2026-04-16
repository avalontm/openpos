import React from "react";
import { Box, Text } from "ink";
import { fileURLToPath } from "url";
import path from "path";
import { theme } from "@openpos/shared";
import { useLayout } from "../../shared/useLayout";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const BANNER_PATH = path.resolve(__dirname, "../../../../assets/logo.png");

export let cachedBannerLines: string[] | null = null;
export let cachedBannerCols: number = 0;

export async function reloadBanner(cols: number): Promise<string[] | null> {
  cachedBannerLines = null;
  cachedBannerCols = 0;
  return null;
}

export async function preloadBanner(cols: number): Promise<void> {
  if (cachedBannerLines !== null) return;
  await reloadBanner(cols);
}

export type LoadTask = {
  label: string;
  run: () => Promise<void>;
  critical?: boolean;
};

type Props = {
  tasks: LoadTask[];
  onReady: () => void;
};

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function LoadingScreen({ tasks, onReady }: Props) {
  const layout = useLayout();
  const { cols, rows, refresh } = layout;

  const [frame, setFrame] = React.useState(0);
  const [current, setCurrent] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (done || error) return;
    const t = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 80);
    return () => clearInterval(t);
  }, [done, error]);

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
  }, [tasks, onReady]);

  const panelWidth = Math.min(cols - 4, 60);
  const barWidth = Math.max(10, panelWidth - 6);
  const progress = ((current + (done ? 1 : 0)) / tasks.length) * 100;
  const filled = Math.floor((progress / 100) * barWidth);
  const empty = barWidth - filled;

  const bar = `${"█".repeat(filled)}${"░".repeat(empty)}`;

  const borderColor = error ? theme.red : done ? theme.green : theme.blue;
  const titleColor = error ? theme.red : done ? theme.green : theme.white;
  const titleText = error ? "✗ ERROR AL INICIAR" : done ? "✓ SISTEMA LISTO" : "⟳ INICIANDO SISTEMA";

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
        borderColor={borderColor}
        paddingX={2}
        paddingY={1}
        width={panelWidth}
      >
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color={titleColor}>
            {titleText}
          </Text>
        </Box>

        <Text color={theme.green}>{bar}</Text>

        <Text color={theme.textDim}>{"─".repeat(panelWidth - 4)}</Text>

        <Box flexDirection="column" marginY={0}>
          {tasks.map((task, i) => {
            const isActive = i === current && !done && !error;
            const isComplete = done ? true : i < current;
            const isFailed = error !== null && i === current;

            let iconChar = "○";
            let iconColor = theme.textDim;

            if (isFailed) {
              iconChar = "✗";
              iconColor = theme.red;
            } else if (isComplete) {
              iconChar = "✓";
              iconColor = theme.green;
            } else if (isActive) {
              iconChar = SPINNER[frame]!;
              iconColor = theme.amber;
            }

            const labelColor = isFailed
              ? theme.red
              : isComplete
                ? theme.textSec
                : isActive
                  ? theme.white
                  : theme.textDim;

            return (
              <Box key={i} flexDirection="row" gap={1}>
                <Text color={iconColor}>{iconChar}</Text>
                <Text color={labelColor} bold={isActive}>
                  {task.label}
                </Text>
              </Box>
            );
          })}
        </Box>

        <Text color={theme.textDim}>{"─".repeat(panelWidth - 4)}</Text>

        <Box justifyContent="center" marginTop={0}>
          {done ? (
            <Text color={theme.green} bold>
              ✓ Sistema listo para usar
            </Text>
          ) : error ? (
            <Text color={theme.red}>{error}</Text>
          ) : (
            <Text color={theme.textMuted}>
              {tasks[current]?.label || "Inicializando..."}
            </Text>
          )}
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color={theme.textDim}>
          {"Developed with "}
          <Text color={theme.red}>❤️</Text>
          <Text color={theme.textDim}> by </Text>
          <Text color={theme.green}>AvalonTM</Text>
          <Text color={theme.textDim}>    </Text>
        </Text>
      </Box>
    </Box>
  );
}

export function LoadingSpinner({ label = "Cargando..." }: { label?: string }) {
  const [frame, setFrame] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 80);
    return () => clearInterval(t);
  }, []);
  return (
    <Box flexDirection="row" gap={1}>
      <Text color={theme.amber}>{SPINNER[frame]}</Text>
      <Text color={theme.textSec}>{label}</Text>
    </Box>
  );
}