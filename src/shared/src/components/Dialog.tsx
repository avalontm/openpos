import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";
import { Button } from "./Button.js";

type DialogVariant = "default" | "danger" | "warning" | "success" | "info";

type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  shortcut?: string;  // Ej: "y" para Yes, "n" para No
};

type Props = {
  isOpen:      boolean;
  title:       string;
  message?:    string;           // Nuevo: mensaje opcional
  children?:   React.ReactNode;
  onClose:     () => void;
  onConfirm?:  () => void;       // Nuevo: acción rápida
  onCancel?:   () => void;       // Nuevo: acción rápida
  actions?:    DialogAction[];   // Nuevo: acciones personalizadas
  variant?:    DialogVariant;    // Nuevo: variante visual
  width?:      number;
  closeOnEsc?: boolean;          // Nuevo: configurable
  closeOnOutsideClick?: boolean; // Nuevo
  confirmText?: string;          // Nuevo: texto del botón confirmar
  cancelText?: string;           // Nuevo: texto del botón cancelar
  showOverlay?: boolean;         // Nuevo: fondo oscuro
};

const VARIANT_COLORS: Record<DialogVariant, { border: string; title: string; icon: string }> = {
  default: { border: theme.textMuted, title: theme.textPri, icon: "ℹ" },
  danger:  { border: theme.red,       title: theme.red,     icon: "⚠" },
  warning: { border: theme.amber,     title: theme.amber,   icon: "⚠" },
  success: { border: theme.green,     title: theme.green,   icon: "✓" },
  info:    { border: theme.blue,      title: theme.blue,    icon: "ℹ" },
};

export function Dialog({ 
  isOpen, 
  title, 
  message,
  children, 
  onClose, 
  onConfirm,
  onCancel,
  actions = [],
  variant = "default",
  width = 50,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  showOverlay = true,
}: Props) {
  const [selectedAction, setSelectedAction] = React.useState(0);
  const colors = VARIANT_COLORS[variant];
  
  // Construir acciones automáticas si se proporcionan onConfirm/onCancel
  const finalActions: DialogAction[] = React.useMemo(() => {
    if (actions.length > 0) return actions;
    
    const result: DialogAction[] = [];
    if (onConfirm) {
      result.push({
        label: confirmText,
        onPress: onConfirm,
        variant: variant === "danger" ? "danger" : "primary",
        shortcut: "y",
      });
    }
    if (onCancel) {
      result.push({
        label: cancelText,
        onPress: onCancel,
        variant: "ghost",
        shortcut: "n",
      });
    }
    return result;
  }, [actions, onConfirm, onCancel, confirmText, cancelText, variant]);
  
  // Manejar teclado
  useInput((input, key) => {
    if (!isOpen) return;
    
    // Cerrar con ESC
    if (closeOnEsc && key.escape) {
      onClose();
      onCancel?.();
      return;
    }
    
    // Navegar entre acciones con flechas
    if (key.leftArrow) {
      setSelectedAction(prev => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setSelectedAction(prev => Math.min(finalActions.length - 1, prev + 1));
    }
    
    // Atajos de teclado para acciones
    for (let i = 0; i < finalActions.length; i++) {
      const action = finalActions[i];
      if (action.shortcut && input === action.shortcut.toLowerCase()) {
        action.onPress();
        return;
      }
    }
    
    // Enter ejecuta acción seleccionada
    if (key.return && finalActions[selectedAction]) {
      finalActions[selectedAction]!.onPress();
    }
  });
  
  if (!isOpen) return null;
  
  const innerWidth = width - 4;
  const borderColor = colors.border;
  
  // Overlay oscuro
  const overlay = showOverlay ? (
    <Box position="absolute" top={0} left={0} width="100%" height="100%">
      <Box 
        flexGrow={1} 
        backgroundColor="#000000aa"
        justifyContent="center"
        alignItems="center"
      >
        {/* Diálogo centrado */}
        <Box flexDirection="column" width={width}>
          {/* Diálogo content */}
          <Box flexDirection="column" borderStyle="round" borderColor={borderColor} backgroundColor={theme.bgPanel}>
            {/* Header */}
            <Box justifyContent="space-between" paddingX={1} paddingY={0}>
              <Text bold color={colors.title}>
                {colors.icon} {title}
              </Text>
              {closeOnEsc && (
                <Text color={theme.textMuted}>ESC</Text>
              )}
            </Box>
            
            {/* Divider */}
            <Box paddingX={1}>
              <Text color={borderColor}>{"─".repeat(innerWidth)}</Text>
            </Box>
            
            {/* Content */}
            <Box padding={1} flexDirection="column" gap={1}>
              {message && (
                <Text color={theme.textPri}>{message}</Text>
              )}
              {children}
            </Box>
            
            {/* Actions */}
            {finalActions.length > 0 && (
              <>
                <Box paddingX={1}>
                  <Text color={borderColor}>{"─".repeat(innerWidth)}</Text>
                </Box>
                <Box padding={1} gap={2} justifyContent="flex-end">
                  {finalActions.map((action, idx) => (
                    <Box key={idx}>
                      <Button
                        variant={action.variant || "secondary"}
                        size="sm"
                        onPress={action.onPress}
                        shortcut={action.shortcut}
                      >
                        {action.label}
                      </Button>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  ) : null;
  
  return overlay;
}