import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type SpinnerVariant = "primary" | "success" | "warning" | "error" | "info";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

type SpinnerStyle = "dots" | "line" | "bounce" | "pulse" | "progress";

type Props = {
  label?:      string;
  variant?:    SpinnerVariant;
  size?:       SpinnerSize;        // Nuevo
  style?:      SpinnerStyle;       // Nuevo
  progress?:   number;             // Nuevo: 0-100 para modo determinante
  showPercent?: boolean;           // Nuevo
};

// Diferentes frames por estilo
const FRAMES_BY_STYLE: Record<SpinnerStyle, string[]> = {
  dots:    ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  line:    ["─", "\\", "│", "/", "─", "\\", "│", "/"],
  bounce:  ["●", "○", "●", "○", "●", "○"],
  pulse:   ["▓", "▒", "░", "▒", "▓"],
  progress: ["░", "▒", "▓", "█", "▓", "▒", "░"],
};

const SIZE_SCALE: Record<SpinnerSize, number> = {
  xs: 0.5,
  sm: 0.75,
  md: 1,
  lg: 1.5,
};

const VARIANT_COLORS: Record<SpinnerVariant, string> = {
  primary:  theme.green,
  success:  theme.green,
  warning:  theme.amber,
  error:    theme.red,
  info:     theme.blue,
};

// Progress bar
const ProgressBar = ({ progress, width = 20, color }: { progress: number; width?: number; color: string }) => {
  const filled = Math.floor((progress / 100) * width);
  const empty = width - filled;
  
  return (
    <Box gap={0}>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text color={theme.textDim}>{"░".repeat(empty)}</Text>
    </Box>
  );
};

export function Spinner({ 
  label, 
  variant = "primary", 
  size = "md",
  style = "dots",
  progress,
  showPercent = true,
}: Props) {
  const [frame, setFrame] = React.useState(0);
  const color = VARIANT_COLORS[variant];
  const frames = FRAMES_BY_STYLE[style];
  const scale = SIZE_SCALE[size];
  
  // Modo determinante (progress)
  const isDeterminate = progress !== undefined && progress >= 0 && progress <= 100;
  
  React.useEffect(() => {
    if (isDeterminate) return; // No animar en modo determinante
    
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, style === "pulse" ? 150 : 80);
    
    return () => clearInterval(interval);
  }, [style, isDeterminate]);
  
  const spinnerChar = isDeterminate ? "" : frames[frame];
  
  // Tamaño visual
  const getSpinnerDisplay = () => {
    if (scale === 0.5) return spinnerChar;
    if (scale === 0.75) return spinnerChar;
    if (scale === 1.5) return spinnerChar + spinnerChar;
    return spinnerChar;
  };
  
  return (
    <Box flexDirection="row" gap={1} alignItems="center">
      {/* Spinner o Progress */}
      {isDeterminate ? (
        <Box flexDirection="column" gap={0}>
          <ProgressBar progress={progress} color={color} />
          {showPercent && (
            <Text color={color} size="small">
              {Math.round(progress)}%
            </Text>
          )}
        </Box>
      ) : (
        <Text color={color} bold={size === "lg"}>
          {getSpinnerDisplay()}
        </Text>
      )}
      
      {/* Label */}
      {label && (
        <Text color={variant === "primary" ? theme.textSec : color}>
          {label}
          {isDeterminate && showPercent && ` (${Math.round(progress)}%)`}
        </Text>
      )}
      
      {/* Indicador de estilo */}
      {style === "bounce" && !isDeterminate && (
        <Text color={theme.textMuted} size="small" dimColor>
          ●
        </Text>
      )}
    </Box>
  );
}