import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";

type SplitDirection = "horizontal" | "vertical";

type Props = {
  left: React.ReactNode;
  right: React.ReactNode;
  direction?: SplitDirection;
  ratio?: number;                    // 0-1, proporción inicial
  minSize?: number;                  // Nuevo: tamaño mínimo en %
  maxSize?: number;                  // Nuevo: tamaño máximo en %
  resizable?: boolean;               // Nuevo: permitir redimensionar
  onResize?: (ratio: number) => void; // Nuevo: callback al redimensionar
  collapsible?: boolean;             // Nuevo: permitir colapsar
  collapsed?: "left" | "right" | null; // Nuevo: panel colapsado
  onCollapse?: (panel: "left" | "right" | null) => void; // Nuevo
  divider?: boolean;
  dividerColor?: string;
  dividerWidth?: number;             // Nuevo: ancho del divisor
  saveKey?: string;                  // Nuevo: clave para persistir layout
};

// Persistencia de layout (localStorage simulado)
const layoutCache: Record<string, number> = {};

export function Split({
  left,
  right,
  direction = "horizontal",
  ratio: initialRatio = 0.5,
  minSize = 15,
  maxSize = 85,
  resizable = false,
  onResize,
  collapsible = false,
  collapsed = null,
  onCollapse,
  divider = true,
  dividerColor = theme.textMuted,
  dividerWidth = 1,
  saveKey,
}: Props) {
  // Cargar ratio guardado
  const [ratio, setRatio] = React.useState(() => {
    if (saveKey && layoutCache[saveKey]) {
      return layoutCache[saveKey];
    }
    return Math.min(maxSize / 100, Math.max(minSize / 100, initialRatio));
  });
  
  const [isResizing, setIsResizing] = React.useState(false);
  const [hoverResize, setHoverResize] = React.useState(false);
  
  // Guardar layout cuando cambia
  React.useEffect(() => {
    if (saveKey) {
      layoutCache[saveKey] = ratio;
    }
  }, [ratio, saveKey]);
  
  // Manejar redimensionamiento con teclado
  useInput((input, key) => {
    if (!resizable && !isResizing) return;
    
    if (key.leftArrow && direction === "horizontal") {
      const newRatio = Math.max(minSize / 100, ratio - 0.05);
      setRatio(newRatio);
      onResize?.(newRatio);
    } else if (key.rightArrow && direction === "horizontal") {
      const newRatio = Math.min(maxSize / 100, ratio + 0.05);
      setRatio(newRatio);
      onResize?.(newRatio);
    } else if (key.upArrow && direction === "vertical") {
      const newRatio = Math.max(minSize / 100, ratio - 0.05);
      setRatio(newRatio);
      onResize?.(newRatio);
    } else if (key.downArrow && direction === "vertical") {
      const newRatio = Math.min(maxSize / 100, ratio + 0.05);
      setRatio(newRatio);
      onResize?.(newRatio);
    }
    
    // Atajo para colapsar
    if (collapsible && key.ctrl && input === "h") {
      const newCollapsed = collapsed === "left" ? null : "left";
      onCollapse?.(newCollapsed);
    } else if (collapsible && key.ctrl && input === "j") {
      const newCollapsed = collapsed === "right" ? null : "right";
      onCollapse?.(newCollapsed);
    }
  });
  
  const isHorizontal = direction === "horizontal";
  const leftRatio = collapsed === "left" ? 0 : (collapsed === "right" ? 100 : ratio * 100);
  const rightRatio = collapsed === "right" ? 0 : (collapsed === "left" ? 100 : (1 - ratio) * 100);
  
  // Estilo del divisor
  const dividerChar = isHorizontal ? "│" : "─";
  const dividerStyle = isResizing ? "bold" : hoverResize ? "dim" : "normal";
  const dividerColorStyle = isResizing ? theme.green : hoverResize ? theme.blue : dividerColor;
  
  // Renderizar panel izquierdo
  const renderLeft = () => {
    if (collapsed === "left") {
      return (
        <Box 
          justifyContent="center" 
          alignItems="center"
          width={isHorizontal ? 3 : undefined}
          height={!isHorizontal ? 3 : undefined}
          backgroundColor={theme.bgActive}
        >
          <Text color={theme.textMuted} onClick={() => onCollapse?.(null)}>
            {isHorizontal ? "▶" : "▼"}
          </Text>
        </Box>
      );
    }
    
    return (
      <Box
        flexGrow={leftRatio}
        width={isHorizontal ? `${leftRatio}%` : undefined}
        height={!isHorizontal ? `${leftRatio}%` : undefined}
        minWidth={isHorizontal ? `${minSize}%` : undefined}
        maxWidth={isHorizontal ? `${maxSize}%` : undefined}
      >
        {left}
      </Box>
    );
  };
  
  // Renderizar panel derecho
  const renderRight = () => {
    if (collapsed === "right") {
      return (
        <Box 
          justifyContent="center" 
          alignItems="center"
          width={isHorizontal ? 3 : undefined}
          height={!isHorizontal ? 3 : undefined}
          backgroundColor={theme.bgActive}
        >
          <Text color={theme.textMuted} onClick={() => onCollapse?.(null)}>
            {isHorizontal ? "◀" : "▲"}
          </Text>
        </Box>
      );
    }
    
    return (
      <Box
        flexGrow={rightRatio}
        width={isHorizontal ? `${rightRatio}%` : undefined}
        height={!isHorizontal ? `${rightRatio}%` : undefined}
        minWidth={isHorizontal ? `${minSize}%` : undefined}
        maxWidth={isHorizontal ? `${maxSize}%` : undefined}
      >
        {right}
      </Box>
    );
  };
  
  // Divider interactivo
  const renderDivider = () => {
    if (!divider) return null;
    
    const dividerContent = dividerChar.repeat(dividerWidth);
    
    if (resizable) {
      return (
        <Box
          justifyContent="center"
          alignItems="center"
          width={isHorizontal ? 1 : undefined}
          height={!isHorizontal ? 1 : undefined}
          onMouseEnter={() => setHoverResize(true)}
          onMouseLeave={() => setHoverResize(false)}
        >
          <Text 
            color={dividerColorStyle} 
            bold={dividerStyle === "bold"}
            onMouseDown={() => setIsResizing(true)}
            onMouseUp={() => setIsResizing(false)}
          >
            {dividerContent}
          </Text>
        </Box>
      );
    }
    
    return (
      <Box justifyContent="center" alignItems="center">
        <Text color={dividerColor}>{dividerContent}</Text>
      </Box>
    );
  };
  
  if (isHorizontal) {
    return (
      <Box flexDirection="row" flexGrow={1} height="100%">
        {renderLeft()}
        {divider && renderDivider()}
        {renderRight()}
      </Box>
    );
  }
  
  return (
    <Box flexDirection="column" flexGrow={1} width="100%">
      {renderLeft()}
      {divider && renderDivider()}
      {renderRight()}
    </Box>
  );
}