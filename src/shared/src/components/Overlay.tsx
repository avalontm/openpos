import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";

type OverlayPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom";

type OverlayType = "modal" | "tooltip" | "dropdown" | "notification";

type Props = {
  children:      React.ReactNode;
  visible:       boolean;
  width?:        number;
  height?:       number;
  title?:        string;
  position?:     OverlayPosition;     // Nuevo
  type?:         OverlayType;         // Nuevo
  offsetX?:      number;              // Nuevo: offset X
  offsetY?:      number;              // Nuevo: offset Y
  autoHide?:     number;              // Nuevo: auto-ocultar (ms)
  onHide?:       () => void;          // Nuevo
  zIndex?:       number;              // Nuevo
  closeOnEsc?:   boolean;             // Nuevo
  showArrow?:    boolean;             // Nuevo: flecha apuntando
  targetRef?:    React.RefObject<unknown>;  // Nuevo: elemento objetivo
};

// Contador global para zIndex stacking
let highestZIndex = 1000;

const POSITION_STYLES: Record<OverlayPosition, { top?: number; left?: number; right?: number; bottom?: number }> = {
  center:      { top: "50%", left: "50%" },
  "top-left":  { top: 0, left: 0 },
  "top-right": { top: 0, right: 0 },
  "bottom-left": { bottom: 0, left: 0 },
  "bottom-right": { bottom: 0, right: 0 },
  custom:      {},
};

export function Overlay({
  children,
  visible,
  width = 40,
  height,
  title,
  position = "center",
  type = "modal",
  offsetX = 0,
  offsetY = 0,
  autoHide,
  onHide,
  zIndex,
  closeOnEsc = true,
  showArrow = false,
  targetRef,
}: Props) {
  const [internalZIndex, setInternalZIndex] = React.useState(zIndex || highestZIndex);
  const [isVisible, setIsVisible] = React.useState(visible);
  
  // Auto-hide
  React.useEffect(() => {
    if (autoHide && visible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onHide?.();
      }, autoHide);
      return () => clearTimeout(timer);
    }
  }, [autoHide, visible]);
  
  // Stacking: aumentar zIndex cuando se abre
  React.useEffect(() => {
    if (visible && !zIndex) {
      highestZIndex++;
      setInternalZIndex(highestZIndex);
    }
  }, [visible]);
  
  // Manejar teclado
  useInput((_, key) => {
    if (!visible) return;
    if (closeOnEsc && key.escape) {
      setIsVisible(false);
      onHide?.();
    }
  });
  
  if (!visible || !isVisible) return null;
  
  // Calcular posición
  let positionStyle: React.CSSProperties = {};
  const basePos = POSITION_STYLES[position];
  
  if (position === "center") {
    positionStyle = {
      top: `calc(50% + ${offsetY}px)`,
      left: `calc(50% + ${offsetX}px)`,
      transform: "translate(-50%, -50%)",
    };
  } else {
    positionStyle = {
      top: basePos.top !== undefined ? (typeof basePos.top === 'number' ? basePos.top + offsetY : basePos.top) : undefined,
      left: basePos.left !== undefined ? (typeof basePos.left === 'number' ? basePos.left + offsetX : basePos.left) : undefined,
      right: basePos.right !== undefined ? (typeof basePos.right === 'number' ? basePos.right + offsetX : basePos.right) : undefined,
      bottom: basePos.bottom !== undefined ? (typeof basePos.bottom === 'number' ? basePos.bottom + offsetY : basePos.bottom) : undefined,
    };
  }
  
  // Tooltip mode (sin bordes, más pequeño)
  if (type === "tooltip") {
    return (
      <Box
        position="absolute"
        style={positionStyle}
        zIndex={internalZIndex}
      >
        {showArrow && (
          <Box position="absolute" top={-3} left={width / 2 - 2}>
            <Text color={theme.bgPanel}>▲</Text>
          </Box>
        )}
        <Box
          paddingX={1}
          paddingY={0}
          backgroundColor={theme.bgPanel}
          borderStyle="round"
          borderColor={theme.textMuted}
        >
          {children}
        </Box>
      </Box>
    );
  }
  
  // Dropdown mode
  if (type === "dropdown") {
    return (
      <Box
        position="absolute"
        style={positionStyle}
        zIndex={internalZIndex}
      >
        <Box
          flexDirection="column"
          width={width}
          backgroundColor={theme.bgPanel}
          borderStyle="single"
          borderColor={theme.textMuted}
        >
          {title && (
            <>
              <Box paddingX={1}>
                <Text bold color={theme.textPri}>{title}</Text>
              </Box>
              <Box paddingX={1}>
                <Text color={theme.textDim}>{"─".repeat(width - 4)}</Text>
              </Box>
            </>
          )}
          <Box padding={1}>
            {children}
          </Box>
        </Box>
      </Box>
    );
  }
  
  // Notification mode (toast-like)
  if (type === "notification") {
    return (
      <Box
        position="absolute"
        style={positionStyle}
        zIndex={internalZIndex}
        animation="fadeIn"
      >
        <Box
          paddingX={2}
          paddingY={1}
          backgroundColor={theme.bgActive}
          borderStyle="round"
          borderColor={theme.green}
        >
          <Text color={theme.textPri}>{children}</Text>
        </Box>
      </Box>
    );
  }
  
  // Modal mode (default)
  const innerWidth = width - 2;
  
  return (
    <Box
      position="absolute"
      style={positionStyle}
      zIndex={internalZIndex}
    >
      <Box flexDirection="column" width={width} height={height}>
        {/* Top border */}
        <Box>
          <Text color={theme.green}>┌</Text>
          <Text color={theme.green}>{"─".repeat(innerWidth)}</Text>
          <Text color={theme.green}>┐</Text>
        </Box>
        
        {/* Title bar */}
        {title && (
          <>
            <Box>
              <Text color={theme.green}>│</Text>
              <Text color={theme.white} bold> {title} </Text>
              <Text color={theme.green}>{" ".repeat(innerWidth - title.length - 3)}</Text>
              {closeOnEsc && (
                <Text color={theme.textMuted}>esc</Text>
              )}
              <Text color={theme.green}>│</Text>
            </Box>
            <Box>
              <Text color={theme.green}>├</Text>
              <Text color={theme.green}>{"─".repeat(innerWidth)}</Text>
              <Text color={theme.green}>┤</Text>
            </Box>
          </>
        )}
        
        {!title && (
          <Box>
            <Text color={theme.green}>│</Text>
            <Text color={theme.green}>{" ".repeat(innerWidth)}</Text>
            <Text color={theme.green}>│</Text>
          </Box>
        )}
        
        {/* Content */}
        <Box paddingX={1} paddingY={0} flexGrow={1}>
          {children}
        </Box>
        
        {/* Bottom border */}
        <Box>
          <Text color={theme.green}>└</Text>
          <Text color={theme.green}>{"─".repeat(innerWidth)}</Text>
          <Text color={theme.green}>┘</Text>
        </Box>
      </Box>
    </Box>
  );
}