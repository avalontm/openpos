import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";
import { Spinner } from "./Spinner.js";

type PanelVariant = "default" | "primary" | "success" | "warning" | "error" | "info";

type PanelSize = "sm" | "md" | "lg";

type Props = {
  children?: React.ReactNode;
  title?: string;
  variant?: PanelVariant;
  width?: number;
  height?: number;
  scrollable?: boolean;
  collapsible?: boolean;      // Nuevo
  collapsed?: boolean;         // Nuevo
  onToggle?: () => void;       // Nuevo
  loading?: boolean;           // Nuevo
  loadingText?: string;        // Nuevo
  size?: PanelSize;            // Nuevo
  actions?: React.ReactNode;   // Nuevo: acciones en header
  badge?: string;              // Nuevo: badge en header
};

const BORDER_COLOR: Record<PanelVariant, string> = {
  default: theme.textMuted,
  primary: theme.green,
  success: theme.green,
  warning: theme.amber,
  error:   theme.red,
  info:    theme.blue,
};

const SIZE_HEIGHTS: Record<PanelSize, number> = {
  sm: 10,
  md: 20,
  lg: 30,
};

export function Panel({ 
  children, 
  title, 
  variant = "default",
  width,
  height,
  scrollable = false,
  collapsible = false,
  collapsed = false,
  onToggle,
  loading = false,
  loadingText = "Cargando...",
  size = "md",
  actions,
  badge,
}: Props) {
  const borderColor = BORDER_COLOR[variant];
  const finalHeight = height || SIZE_HEIGHTS[size];
  const innerW = width ? width - 2 : undefined;
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);
  
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onToggle?.();
  };
  
  // Colapsado: solo mostrar header
  if (collapsible && isCollapsed) {
    return (
      <Box flexDirection="column" width={width}>
        <Box>
          <Text color={borderColor}>┌</Text>
          {title && (
            <>
              <Text color={borderColor}>─</Text>
              <Text color={borderColor} onClick={handleToggle}>[+]</Text>
              <Text color={borderColor}>─</Text>
              <Text color={theme.white} bold> {title} </Text>
            </>
          )}
          <Box flexGrow={1}>
            <Text color={borderColor}>{"─".repeat(Math.max(0, (innerW || 40) - (title?.length || 0) - 5))}</Text>
          </Box>
          <Text color={borderColor}>┐</Text>
        </Box>
        <Box>
          <Text color={borderColor}>└</Text>
          <Text color={borderColor}>{"─".repeat(innerW || 40)}</Text>
          <Text color={borderColor}>┘</Text>
        </Box>
        <Text color={theme.textDim} dimColor>  (colapsado - haz clic para expandir)</Text>
      </Box>
    );
  }
  
  // Estado de carga
  if (loading) {
    return (
      <Box flexDirection="column" width={width} height={finalHeight}>
        <Box>
          <Text color={borderColor}>┌</Text>
          <Text color={borderColor}>{"─".repeat(innerW || 40)}</Text>
          <Text color={borderColor}>┐</Text>
        </Box>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Spinner label={loadingText} variant="primary" />
        </Box>
        <Box>
          <Text color={borderColor}>└</Text>
          <Text color={borderColor}>{"─".repeat(innerW || 40)}</Text>
          <Text color={borderColor}>┘</Text>
        </Box>
      </Box>
    );
  }
  
  const titleH = title ? 1 : 0;
  const actionsH = actions ? 1 : 0;
  const contentH = finalHeight ? finalHeight - 2 - titleH - actionsH : undefined;
  
  return (
    <Box flexDirection="column" width={width} height={finalHeight}>
      {/* Top border */}
      <Box>
        <Text color={borderColor}>┌</Text>
        {title && (
          <>
            <Text color={borderColor}>─</Text>
            {collapsible && (
              <Text color={borderColor} onClick={handleToggle}>[-]</Text>
            )}
            <Text color={borderColor}>─</Text>
            <Text color={variant === "primary" ? theme.green : theme.white} bold> {title} </Text>
            <Text color={borderColor}>─</Text>
          </>
        )}
        {badge && (
          <>
            <Text color={borderColor}>[</Text>
            <Text color={theme.green}>{badge}</Text>
            <Text color={borderColor}>]</Text>
            <Text color={borderColor}>─</Text>
          </>
        )}
        <Box flexGrow={1}>
          <Text color={borderColor}>{"─".repeat(Math.max(0, (innerW || 40) - (title?.length || 0) - (badge?.length || 0) - 5))}</Text>
        </Box>
        <Text color={borderColor}>┐</Text>
      </Box>
      
      {/* Actions bar */}
      {actions && (
        <Box>
          <Text color={borderColor}>├</Text>
          <Text color={borderColor}>{"─".repeat(innerW || 40)}</Text>
          <Text color={borderColor}>┤</Text>
        </Box>
      )}
      {actions && (
        <Box>
          <Text color={borderColor}>│</Text>
          <Box flexGrow={1} paddingX={1}>
            {actions}
          </Box>
          <Text color={borderColor}>│</Text>
        </Box>
      )}
      
      {/* Middle separator if has title or actions */}
      {(title || actions) && (
        <Box>
          <Text color={borderColor}>├</Text>
          <Text color={borderColor}>{"─".repeat(innerW || 40)}</Text>
          <Text color={borderColor}>┤</Text>
        </Box>
      )}
      
      {/* Content */}
      <Box 
        flexDirection="column" 
        flexGrow={contentH ? 0 : 1} 
        height={contentH}
        overflowY={scrollable ? "auto" : "visible"}
      >
        {children}
      </Box>
      
      {/* Bottom border */}
      <Box>
        <Text color={borderColor}>└</Text>
        <Text color={borderColor}>{"─".repeat(innerW || 40)}</Text>
        <Text color={borderColor}>┘</Text>
      </Box>
    </Box>
  );
}

// ─── ScrollBox mejorado ───────────────────────────────────────────────────────

type ScrollBoxProps = {
  children: React.ReactNode;
  height: number;
  width?: number;
  showScrollbar?: boolean;
  cursor?: number;
  itemCount?: number;
  onScroll?: (position: number) => void;     // Nuevo
  onScrollEnd?: () => void;                  // Nuevo
  infinite?: boolean;                         // Nuevo: scroll infinito
  loadMore?: () => void;                      // Nuevo: cargar más
  loading?: boolean;                          // Nuevo
  scrollPosition?: number;                    // Nuevo: posición controlada
};

export function ScrollBox({ 
  children, 
  height, 
  width,
  showScrollbar = true,
  cursor = 0,
  itemCount = 0,
  onScroll,
  onScrollEnd,
  infinite = false,
  loadMore,
  loading = false,
  scrollPosition: externalScrollPosition,
}: ScrollBoxProps) {
  const [internalScrollPosition, setInternalScrollPosition] = React.useState(0);
  const scrollPosition = externalScrollPosition ?? internalScrollPosition;
  const visibleItems = height - 4; // Restar bordes
  const totalItems = itemCount || React.Children.count(children);
  const maxScroll = Math.max(0, totalItems - visibleItems);
  const scrollPercent = maxScroll > 0 ? (scrollPosition / maxScroll) * 100 : 0;
  
  // Detectar fin del scroll
  React.useEffect(() => {
    if (scrollPosition >= maxScroll - 1 && maxScroll > 0 && infinite && loadMore && !loading) {
      loadMore();
      onScrollEnd?.();
    }
  }, [scrollPosition, maxScroll, infinite, loadMore, loading]);
  
  // Manejar scroll con teclado
  useInput((_, key) => {
    if (key.downArrow) {
      const newPosition = Math.min(maxScroll, scrollPosition + 1);
      setInternalScrollPosition(newPosition);
      onScroll?.(newPosition);
    }
    if (key.upArrow) {
      const newPosition = Math.max(0, scrollPosition - 1);
      setInternalScrollPosition(newPosition);
      onScroll?.(newPosition);
    }
    if (key.pageDown) {
      const newPosition = Math.min(maxScroll, scrollPosition + visibleItems);
      setInternalScrollPosition(newPosition);
      onScroll?.(newPosition);
    }
    if (key.pageUp) {
      const newPosition = Math.max(0, scrollPosition - visibleItems);
      setInternalScrollPosition(newPosition);
      onScroll?.(newPosition);
    }
    if (key.home) {
      setInternalScrollPosition(0);
      onScroll?.(0);
    }
    if (key.end) {
      setInternalScrollPosition(maxScroll);
      onScroll?.(maxScroll);
    }
  });
  
  const scrollbarWidth = showScrollbar ? 2 : 0;
  const contentWidth = width ? width - scrollbarWidth - 1 : undefined;
  
  // Renderizar hijos con offset de scroll
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(scrollPosition, scrollPosition + visibleItems);
  
  return (
    <Box flexDirection="row" flexGrow={1} height={height}>
      {/* Contenido */}
      <Box flexDirection="column" flexGrow={1} width={contentWidth}>
        {visibleChildren}
        
        {/* Indicador de loading para scroll infinito */}
        {loading && infinite && (
          <Box marginTop={1}>
            <Spinner label="Cargando más..." variant="primary" size="sm" />
          </Box>
        )}
      </Box>
      
      {/* Scrollbar mejorada */}
      {showScrollbar && totalItems > visibleItems && (
        <Box flexDirection="column" width={scrollbarWidth}>
          <Box flexDirection="column" flexGrow={1}>
            {/* Barra de scroll visual */}
            {Array(visibleItems).fill(0).map((_, i) => {
              const itemIndex = Math.floor((i / visibleItems) * totalItems);
              const isCursorItem = itemIndex === cursor;
              const isVisible = i >= scrollPosition && i < scrollPosition + visibleItems;
              
              // Posición del thumb
              const thumbPosition = Math.floor((scrollPosition / maxScroll) * visibleItems);
              const isThumb = i === thumbPosition;
              
              let char = "│";
              let color = theme.textDim;
              
              if (isThumb) {
                char = "█";
                color = theme.green;
              } else if (isCursorItem) {
                char = "●";
                color = theme.blue;
              } else if (isVisible) {
                char = "·";
                color = theme.textMuted;
              }
              
              return (
                <Text key={i} color={color}>
                  {char}
                </Text>
              );
            })}
          </Box>
          
          {/* Porcentaje */}
          <Text color={theme.textMuted} size="small">
            {Math.round(scrollPercent)}%
          </Text>
        </Box>
      )}
    </Box>
  );
}