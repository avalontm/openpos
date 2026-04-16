import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";
import { Spinner } from "./Spinner.js";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

type ModalVariant = "default" | "danger" | "warning" | "success" | "info";

type Props = {
  isOpen:      boolean;
  title:       string;
  onClose:     () => void;
  children:    React.ReactNode;
  size?:       ModalSize;           // Nuevo
  variant?:    ModalVariant;        // Nuevo
  closable?:   boolean;             // Nuevo: puede cerrarse
  closeOnEsc?: boolean;             // Nuevo
  closeOnOutsideClick?: boolean;    // Nuevo
  showOverlay?: boolean;            // Nuevo
  loading?:    boolean;             // Nuevo
  loadingText?: string;             // Nuevo
  footer?:     React.ReactNode;     // Nuevo
  onAnimationEnd?: () => void;      // Nuevo
  zIndex?:     number;              // Nuevo
};

const SIZE_WIDTHS: Record<ModalSize, number> = {
  sm:   30,
  md:   50,
  lg:   70,
  xl:   90,
  full: 120,
};

const VARIANT_COLORS: Record<ModalVariant, string> = {
  default: theme.green,
  danger:  theme.red,
  warning: theme.amber,
  success: theme.green,
  info:    theme.blue,
};

export function Modal({ 
  isOpen, 
  title, 
  onClose, 
  children, 
  size = "md",
  variant = "default",
  closable = true,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  showOverlay = true,
  loading = false,
  loadingText = "Cargando...",
  footer,
  onAnimationEnd,
  zIndex = 10,
}: Props) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [visible, setVisible] = React.useState(isOpen);
  const borderColor = VARIANT_COLORS[variant];
  const width = SIZE_WIDTHS[size];
  const innerWidth = width - 4;
  
  // Animación de entrada/salida
  React.useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onAnimationEnd?.();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setIsAnimating(false);
        onAnimationEnd?.();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Manejar teclado
  useInput((_, key) => {
    if (!visible || !isOpen) return;
    if (closeOnEsc && key.escape && closable) {
      onClose();
    }
  });
  
  if (!visible) return null;
  
  // Efecto de animación
  const animationChar = isAnimating ? (isOpen ? "→" : "←") : " ";
  const opacity = isAnimating ? (isOpen ? 0.5 : 0.3) : 1;
  
  // Overlay
  const overlay = showOverlay ? (
    <Box 
      position="absolute" 
      top={0} 
      left={0} 
      width="100%" 
      height="100%"
      backgroundColor="#000000aa"
      zIndex={zIndex}
    >
      {/* Click outside para cerrar */}
      {closeOnOutsideClick && closable && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          onMouseDown={onClose}
        />
      )}
      
      {/* Modal centrado */}
      <Box 
        flexGrow={1} 
        justifyContent="center" 
        alignItems="center"
        zIndex={zIndex + 1}
      >
        <Box 
          flexDirection="column" 
          width={width}
          opacity={opacity}
        >
          {/* Modal container */}
          <Box 
            flexDirection="column" 
            borderStyle="round" 
            borderColor={borderColor} 
            backgroundColor={theme.bgPanel}
          >
            {/* Header */}
            <Box justifyContent="space-between" paddingX={1} paddingY={0}>
              <Box gap={1}>
                <Text color={borderColor}>{animationChar}</Text>
                <Text bold color={borderColor}>
                  {variant !== "default" && variant === "danger" ? "⚠ " : ""}
                  {variant !== "default" && variant === "success" ? "✓ " : ""}
                  {variant !== "default" && variant === "info" ? "ℹ " : ""}
                  {title}
                </Text>
              </Box>
              {closable && (
                <Box gap={1}>
                  <Text color={theme.textMuted}>ESC</Text>
                  <Text color={borderColor}>✗</Text>
                </Box>
              )}
            </Box>
            
            {/* Divider */}
            <Box paddingX={1}>
              <Text color={theme.textDim}>{"─".repeat(innerWidth)}</Text>
            </Box>
            
            {/* Content */}
            <Box padding={1} minHeight={size === "sm" ? 5 : 10}>
              {loading ? (
                <Box justifyContent="center" alignItems="center" flexGrow={1}>
                  <Spinner label={loadingText} variant="primary" />
                </Box>
              ) : (
                children
              )}
            </Box>
            
            {/* Footer */}
            {footer && (
              <>
                <Box paddingX={1}>
                  <Text color={theme.textDim}>{"─".repeat(innerWidth)}</Text>
                </Box>
                <Box padding={1}>
                  {footer}
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