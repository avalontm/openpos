import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost" | "warning" | "info";

type ButtonSize = "sm" | "md" | "lg";

type Props = {
  children:  React.ReactNode;
  variant?:  ButtonVariant;
  size?:     ButtonSize;      // Nuevo
  disabled?: boolean;
  loading?:  boolean;
  onPress?:  () => void;
  width?:    number | string;
  fullWidth?: boolean;
  shortcut?: string;          // Nuevo: tecla rápida (ej: "Ctrl+S")
  icon?:     string;          // Nuevo: icono antes del texto
  iconRight?: string;         // Nuevo: icono después del texto
  autoFocus?: boolean;        // Nuevo: focus automático
};

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string; border: string; activeBg: string }> = {
  primary:   { bg: theme.green,    text: theme.bg,      border: theme.green,    activeBg: theme.greenBr },
  secondary: { bg: theme.bgActive, text: theme.textPri, border: theme.textMuted, activeBg: theme.bgSection },
  danger:    { bg: theme.red,      text: theme.white,   border: theme.red,      activeBg: "#ff6b6b" },
  success:   { bg: theme.green,    text: theme.bg,      border: theme.green,    activeBg: theme.greenBr },
  ghost:     { bg: "transparent",  text: theme.textSec, border: "transparent",  activeBg: theme.bgActive },
  warning:   { bg: theme.amber,    text: theme.bg,      border: theme.amber,    activeBg: theme.amberBr },
  info:      { bg: theme.blue,     text: theme.white,   border: theme.blue,     activeBg: "#79b8ff" },
};

const SIZE_STYLES: Record<ButtonSize, { paddingX: number; paddingY: number }> = {
  sm: { paddingX: 1, paddingY: 0 },
  md: { paddingX: 2, paddingY: 0 },
  lg: { paddingX: 3, paddingY: 1 },
};

export function Button({ 
  children, 
  variant = "primary", 
  size = "md",
  disabled = false, 
  loading = false,
  onPress,
  width,
  fullWidth = false,
  shortcut,
  icon,
  iconRight,
  autoFocus = false,
}: Props) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [hasFocus, setHasFocus] = React.useState(autoFocus);
  const colors = VARIANT_COLORS[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;
  
  // Manejar tecla rápida
  useInput((input, key) => {
    if (isDisabled) return;
    if (!shortcut) return;
    
    // Parsear shortcut (ej: "Ctrl+S" o "Enter" o "Esc")
    const [modifier, keyName] = shortcut.split("+");
    
    if (modifier === "Ctrl" && key.ctrl && key[keyName?.toLowerCase() as keyof typeof key]) {
      onPress?.();
    } else if (shortcut === "Enter" && key.return) {
      onPress?.();
    } else if (shortcut === "Esc" && key.escape) {
      onPress?.();
    } else if (!modifier && input === shortcut.toLowerCase()) {
      onPress?.();
    }
  });
  
  // Manejar focus
  useInput((_, key) => {
    if (autoFocus && !isDisabled) {
      if (key.return) {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 100);
        onPress?.();
      }
    }
  });
  
  // Efecto visual al presionar
  const currentBg = isPressed && !isDisabled ? colors.activeBg : colors.bg;
  const currentBorder = isPressed && !isDisabled ? colors.activeBg : colors.border;
  
  const content = loading ? (
    <Box gap={1}>
      <Text color={colors.text}>⠋</Text>
      <Text color={colors.text}>Cargando...</Text>
    </Box>
  ) : (
    <Box gap={1}>
      {icon && <Text color={colors.text}>{icon}</Text>}
      <Text color={colors.text} bold={variant !== "ghost"}>{children}</Text>
      {iconRight && <Text color={colors.text}>{iconRight}</Text>}
      {shortcut && !disabled && (
        <Text color={theme.textMuted} dimColor>
          ({shortcut})
        </Text>
      )}
    </Box>
  );
  
  // Indicador visual de focus
  const focusIndicator = hasFocus && autoFocus && !isDisabled ? (
    <Box position="absolute" top={-1} left={0} right={0}>
      <Text color={theme.blue}>▼</Text>
    </Box>
  ) : null;
  
  return (
    <Box
      alignItems="center"
      justifyContent="center"
      paddingX={sizeStyle.paddingX}
      paddingY={sizeStyle.paddingY}
      borderStyle="single"
      borderColor={isDisabled ? theme.textDim : currentBorder}
      backgroundColor={isDisabled ? theme.bgSection : currentBg}
      width={fullWidth ? "100%" : width}
      onMouseEnter={() => !isDisabled && setHasFocus(true)}
      onMouseLeave={() => !isDisabled && setHasFocus(false)}
    >
      {focusIndicator}
      {content}
    </Box>
  );
}