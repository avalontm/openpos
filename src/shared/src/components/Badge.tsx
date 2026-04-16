import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type BadgeVariant = "success" | "warning" | "error" | "info" | "default" | "pending" | "processing";

type Props = {
  text:     string;
  variant?: BadgeVariant;
  compact?: boolean;      // Nuevo: modo compacto
  icon?:    string;       // Nuevo: icono personalizado
  animated?: boolean;     // Nuevo: animación para processing
};

const VARIANT_STYLES: Record<BadgeVariant, { color: string; prefix: string }> = {
  success:    { color: theme.green,     prefix: "✓" },  // Cambiado a ✓
  warning:    { color: theme.amber,     prefix: "⚠" },  // Cambiado a ⚠
  error:      { color: theme.red,       prefix: "✗" },  // Cambiado a ✗
  info:       { color: theme.blue,      prefix: "ℹ" },  // Cambiado a ℹ
  default:    { color: theme.textSec,   prefix: "○" },
  pending:    { color: theme.orange,    prefix: "⏳" },  // Nuevo
  processing: { color: theme.cyan,      prefix: "⟳" },   // Nuevo
};

export function Badge({ text, variant = "default", compact = false, icon, animated = false }: Props) {
  const style = VARIANT_STYLES[variant];
  const finalIcon = icon || style.prefix;
  const [spinFrame, setSpinFrame] = React.useState(0);
  
  // Animación para processing
  React.useEffect(() => {
    if (animated && variant === "processing") {
      const frames = ["⟳", "⟲", "⟳", "⟲"];
      const id = setInterval(() => {
        setSpinFrame(f => (f + 1) % frames.length);
      }, 200);
      return () => clearInterval(id);
    }
  }, [animated, variant]);
  
  const displayIcon = animated && variant === "processing" 
    ? ["⟳", "⟲", "⟳", "⟲"][spinFrame] 
    : finalIcon;
  
  return (
    <Box gap={compact ? 0 : 1}>
      <Text color={style.color}>
        {displayIcon}
        {!compact && <Text> </Text>}
        {!compact && <Text color={style.color}>{text}</Text>}
      </Text>
    </Box>
  );
}