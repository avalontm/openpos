import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";
import { Badge } from "./Badge.js";

type StatusVariant = "info" | "success" | "warning" | "error" | "neutral";

type StatusMode = "normal" | "edit" | "search" | "confirm" | "loading";

type StatusItem = {
  label: string;
  value: string | React.ReactNode;
  variant?: StatusVariant;
};

type Props = {
  left?: React.ReactNode | StatusItem[];  // Nuevo: soporte items estructurados
  center?: React.ReactNode;
  right?: React.ReactNode;
  variant?: StatusVariant;
  mode?: StatusMode;                       // Nuevo: modo contextual
  notifications?: number;                  // Nuevo: badge de notificaciones
  username?: string;                       // Nuevo: usuario actual
  connectionStatus?: "online" | "offline" | "connecting"; // Nuevo
  currentTime?: string;                    // Nuevo: hora actual
  batteryLevel?: number;                   // Nuevo: nivel de batería (0-100)
  onModeChange?: (mode: StatusMode) => void; // Nuevo
};

const VARIANT_COLORS: Record<StatusVariant, string> = {
  info:    theme.blue,
  success: theme.green,
  warning: theme.amber,
  error:   theme.red,
  neutral: theme.textSec,
};

const MODE_STYLES: Record<StatusMode, { color: string; icon: string; label: string }> = {
  normal:  { color: theme.green,  icon: "●",  label: "Normal" },
  edit:    { color: theme.blue,   icon: "✎",  label: "Editando" },
  search:  { color: theme.cyan,   icon: "🔍", label: "Buscando" },
  confirm: { color: theme.amber,  icon: "⚠",  label: "Confirmar" },
  loading: { color: theme.textMuted, icon: "⟳", label: "Cargando" },
};

const CONNECTION_ICONS = {
  online:     { icon: "●", color: theme.green },
  offline:    { icon: "○", color: theme.red },
  connecting: { icon: "⟳", color: theme.amber },
};

export function StatusBar({ 
  left, 
  center, 
  right, 
  variant = "neutral",
  mode = "normal",
  notifications = 0,
  username = "admin",
  connectionStatus = "online",
  currentTime,
  batteryLevel,
  onModeChange,
}: Props) {
  const color = VARIANT_COLORS[variant];
  const modeStyle = MODE_STYLES[mode];
  
  // Formatear hora
  const [time, setTime] = React.useState(currentTime || new Date().toLocaleTimeString());
  
  React.useEffect(() => {
    if (currentTime) return;
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTime]);
  
  const displayTime = currentTime || time;
  
  // Renderizar left como items estructurados
  const renderLeftContent = () => {
    if (Array.isArray(left)) {
      return (
        <Box gap={2}>
          {left.map((item, idx) => (
            <Box key={idx} gap={1}>
              <Text color={VARIANT_COLORS[item.variant || "neutral"]}>
                {item.label}:
              </Text>
              <Text color={theme.white}>{item.value}</Text>
            </Box>
          ))}
        </Box>
      );
    }
    
    return left || (
      <Box gap={1}>
        {/* Modo actual */}
        <Text color={modeStyle.color}>{modeStyle.icon}</Text>
        <Text color={modeStyle.color}>{modeStyle.label}</Text>
        
        {/* Separador */}
        <Text color={theme.textDim}>│</Text>
        
        {/* Conexión */}
        <Text color={CONNECTION_ICONS[connectionStatus].color}>
          {CONNECTION_ICONS[connectionStatus].icon}
        </Text>
        <Text color={theme.textSec}>
          {connectionStatus === "online" ? "Online" : connectionStatus === "offline" ? "Offline" : "Conectando"}
        </Text>
        
        {/* Separador */}
        <Text color={theme.textDim}>│</Text>
        
        {/* Usuario */}
        <Text color={theme.textMuted}>{username}</Text>
      </Box>
    );
  };
  
  // Renderizar center (shortcuts contextuales)
  const renderCenterContent = () => {
    if (center) return center;
    
    // Shortcuts según modo
    const shortcutsByMode: Record<StatusMode, Array<{ key: string; action: string }>> = {
      normal: [
        { key: "F1", action: "Ayuda" },
        { key: "Ctrl+N", action: "Nuevo" },
        { key: "Ctrl+S", action: "Guardar" },
        { key: "Ctrl+Q", action: "Salir" },
      ],
      edit: [
        { key: "Esc", action: "Cancelar" },
        { key: "Ctrl+S", action: "Guardar" },
        { key: "Tab", action: "Siguiente" },
      ],
      search: [
        { key: "Esc", action: "Salir" },
        { key: "Enter", action: "Seleccionar" },
        { key: "↑↓", action: "Navegar" },
      ],
      confirm: [
        { key: "Y", action: "Sí" },
        { key: "N", action: "No" },
        { key: "Esc", action: "Cancelar" },
      ],
      loading: [
        { key: "Esc", action: "Cancelar" },
      ],
    };
    
    const shortcuts = shortcutsByMode[mode];
    
    return (
      <Box gap={2}>
        {shortcuts.map((sc, idx) => (
          <Shortcut key={idx} keys={sc.key} action={sc.action} size="sm" />
        ))}
      </Box>
    );
  };
  
  // Renderizar right (estado)
  const renderRightContent = () => {
    if (right) return right;
    
    return (
      <Box gap={2}>
        {/* Batería */}
        {batteryLevel !== undefined && (
          <Box gap={0}>
            <Text color={batteryLevel < 20 ? theme.red : theme.textSec}>
              {batteryLevel <= 10 ? "🪫" : "🔋"} {batteryLevel}%
            </Text>
          </Box>
        )}
        
        {/* Notificaciones */}
        {notifications > 0 && (
          <Badge text={`${notifications}`} variant="info" compact />
        )}
        
        {/* Hora */}
        <Text color={theme.textMuted}>{displayTime}</Text>
      </Box>
    );
  };
  
  return (
    <Box 
      flexDirection="row" 
      justifyContent="space-between" 
      paddingX={1}
      paddingY={0}
      backgroundColor={theme.bgPanel}
      borderTop
      borderColor={theme.textDim}
    >
      {/* Left section */}
      <Box flexDirection="row" gap={1}>
        {renderLeftContent()}
      </Box>
      
      {/* Center section */}
      <Box flexDirection="row" gap={2}>
        {renderCenterContent()}
      </Box>
      
      {/* Right section */}
      <Box>
        {renderRightContent()}
      </Box>
    </Box>
  );
}

// ─── Shortcut mejorado ───────────────────────────────────────────────────────

type ShortcutSize = "xs" | "sm" | "md";
type ShortcutVariant = "default" | "primary" | "danger";

type ShortcutProps = {
  keys: string;
  action: string;
  size?: ShortcutSize;      // Nuevo
  variant?: ShortcutVariant; // Nuevo
  disabled?: boolean;        // Nuevo
  onPress?: () => void;      // Nuevo: acción al presionar
};

const SHORTCUT_SIZES: Record<ShortcutSize, { keyPadding: number; gap: number }> = {
  xs: { keyPadding: 0, gap: 0 },
  sm: { keyPadding: 0, gap: 1 },
  md: { keyPadding: 1, gap: 2 },
};

const SHORTCUT_VARIANTS: Record<ShortcutVariant, { bg: string; text: string }> = {
  default: { bg: "transparent", text: theme.textSec },
  primary: { bg: theme.bgActive, text: theme.green },
  danger:  { bg: theme.bgActive, text: theme.red },
};

export function Shortcut({ 
  keys, 
  action, 
  size = "sm", 
  variant = "default",
  disabled = false,
  onPress,
}: ShortcutProps) {
  const styles = SHORTCUT_SIZES[size];
  const colors = SHORTCUT_VARIANTS[variant];
  
  // Detectar tecla
  useInput((input, key) => {
    if (disabled || !onPress) return;
    
    // Parsear keys (ej: "Ctrl+S" o "F1" o "Y")
    const [modifier, keyName] = keys.split("+");
    
    if (modifier === "Ctrl" && key.ctrl && key[keyName?.toLowerCase() as keyof typeof key]) {
      onPress();
    } else if (keys === "Enter" && key.return) {
      onPress();
    } else if (keys === "Esc" && key.escape) {
      onPress();
    } else if (keys === "F1" && key.escape) {
      // F1 no está directamente en key, se maneja con input
      if (input === "\u001bOP") onPress();
    } else if (!modifier && input === keys.toLowerCase()) {
      onPress();
    }
  });
  
  return (
    <Box 
      gap={styles.gap}
      backgroundColor={colors.bg}
      paddingX={styles.keyPadding}
      borderRadius={1}
    >
      <Text color={colors.text} bold={variant === "primary"}>
        {keys}
      </Text>
      <Text color={disabled ? theme.textDim : theme.textMuted}>
        {action}
      </Text>
    </Box>
  );
}