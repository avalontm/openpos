import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { Spinner } from "./Spinner.js";

type ContainerVariant = "default" | "centered" | "scrollable" | "loading";

type ContainerProps = {
  children?: React.ReactNode;
  direction?: "row" | "column";
  justifyContent?: "flex-start" | "center" | "space-between" | "space-around" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  gap?: number;
  flexGrow?: number;
  width?: number | string;
  height?: number;
  minHeight?: number;           // Nuevo
  maxHeight?: number;           // Nuevo
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  border?: boolean;
  borderColor?: string;
  borderStyle?: "single" | "double" | "round" | "bold";  // Nuevo
  variant?: ContainerVariant;    // Nuevo
  loading?: boolean;             // Nuevo
  loadingText?: string;          // Nuevo
  scrollable?: boolean;          // Nuevo
  scrollPosition?: number;       // Nuevo
  onScroll?: (position: number) => void;  // Nuevo
  backgroundPattern?: "dots" | "lines" | "grid" | "none";  // Nuevo
};

function getWidthValue(w: number | string | undefined, def: number): number {
  return typeof w === "number" ? w : def;
}

// Patrones de fondo
const PATTERNS: Record<string, string[]> = {
  dots: ["·", "·", "·", "·", "·"],
  lines: ["─", "─", "─", "─", "─"],
  grid: ["┼", "┼", "┼", "┼", "┼"],
  none: [" ", " ", " ", " ", " "],
};

export function Container({
  children,
  direction = "column",
  justifyContent,
  alignItems,
  gap,
  flexGrow,
  width,
  height,
  minHeight,
  maxHeight,
  padding,
  paddingX,
  paddingY,
  border = false,
  borderColor = theme.textMuted,
  borderStyle = "single",
  variant = "default",
  loading = false,
  loadingText = "Cargando...",
  scrollable = false,
  scrollPosition = 0,
  onScroll,
  backgroundPattern = "none",
}: ContainerProps) {
  const w = getWidthValue(width, 80);
  const [internalScroll, setInternalScroll] = React.useState(scrollPosition);
  const [contentHeight, setContentHeight] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  
  // Manejar scroll
  const handleScroll = (delta: number) => {
    const newPosition = Math.max(0, Math.min(contentHeight - (height || 20), internalScroll + delta));
    setInternalScroll(newPosition);
    onScroll?.(newPosition);
  };
  
  // Patrón de fondo
  const pattern = PATTERNS[backgroundPattern];
  const backgroundLines = backgroundPattern !== "none" && height ? (
    <Box position="absolute" top={0} left={0} width={w} height={height} flexDirection="column">
      {Array(Math.min(height || 10, 10)).fill(0).map((_, i) => (
        <Text key={i} color={theme.textDim} dimColor>
          {pattern[i % pattern.length].repeat(w)}
        </Text>
      ))}
    </Box>
  ) : null;
  
  // Estado de carga
  if (loading) {
    return (
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width={width}
        height={height}
        padding={padding}
        paddingX={paddingX}
        paddingY={paddingY}
        backgroundColor={theme.bgPanel}
        borderStyle={border ? borderStyle : undefined}
        borderColor={border ? borderColor : undefined}
      >
        <Spinner label={loadingText} variant="primary" />
      </Box>
    );
  }
  
  // Variante centrada
  if (variant === "centered") {
    return (
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width={width}
        height={height}
        padding={padding}
        paddingX={paddingX}
        paddingY={paddingY}
      >
        {children}
      </Box>
    );
  }
  
  // Variante scrollable
  if (scrollable && height) {
    const visibleHeight = height - (border ? 4 : 2);
    const scrollPercent = contentHeight > visibleHeight 
      ? (internalScroll / (contentHeight - visibleHeight)) * 100 
      : 0;
    
    return (
      <Box flexDirection="column" width={width} height={height}>
        {/* Scrollbar */}
        {contentHeight > visibleHeight && (
          <Box justifyContent="flex-end" marginBottom={0}>
            <Text color={theme.textMuted}>
              {Math.round(scrollPercent)}% █{"█".repeat(Math.floor(scrollPercent / 10))}
            </Text>
          </Box>
        )}
        
        {/* Contenido scrolleable */}
        <Box
          ref={scrollRef}
          flexDirection="column"
          flexGrow={1}
          minHeight={minHeight}
          maxHeight={maxHeight}
          overflowY="auto"
        >
          {React.Children.map(children, (child, i) => (
            <Box key={i} marginTop={i > 0 ? gap : 0}>
              {child}
            </Box>
          ))}
        </Box>
        
        {/* Controles de scroll */}
        {contentHeight > visibleHeight && (
          <Box justifyContent="space-between" marginTop={0}>
            <Text color={theme.textMuted} onPress={() => handleScroll(-10)}>
              ↑
            </Text>
            <Text color={theme.textMuted}>
              {Math.floor(internalScroll)}/{Math.max(0, contentHeight - visibleHeight)}
            </Text>
            <Text color={theme.textMuted} onPress={() => handleScroll(10)}>
              ↓
            </Text>
          </Box>
        )}
      </Box>
    );
  }
  
  // Container con borde
  if (border) {
    const borderChars = {
      single: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
      double: { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" },
      round:  { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
      bold:   { tl: "┏", tr: "┓", bl: "┗", br: "┛", h: "━", v: "┃" },
    };
    const bc = borderChars[borderStyle];
    const innerWidth = w - 2;
    
    return (
      <Box flexDirection="column" width={width} height={height}>
        {/* Top border */}
        <Box>
          <Text color={borderColor}>{bc.tl}</Text>
          <Text color={borderColor}>{bc.h.repeat(innerWidth)}</Text>
          <Text color={borderColor}>{bc.tr}</Text>
        </Box>
        
        {/* Content with side borders */}
        <Box flexGrow={1} minHeight={minHeight} maxHeight={maxHeight}>
          <Text color={borderColor}>{bc.v}</Text>
          <Box
            flexDirection={direction}
            justifyContent={justifyContent}
            alignItems={alignItems}
            gap={gap}
            flexGrow={flexGrow}
            width={innerWidth}
            padding={padding}
            paddingX={paddingX}
            paddingY={paddingY}
          >
            {backgroundLines}
            {children}
          </Box>
          <Text color={borderColor}>{bc.v}</Text>
        </Box>
        
        {/* Bottom border */}
        <Box>
          <Text color={borderColor}>{bc.bl}</Text>
          <Text color={borderColor}>{bc.h.repeat(innerWidth)}</Text>
          <Text color={borderColor}>{bc.br}</Text>
        </Box>
      </Box>
    );
  }
  
  // Container normal
  return (
    <Box
      flexDirection={direction}
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
      flexGrow={flexGrow}
      width={width}
      height={height}
      minHeight={minHeight}
      maxHeight={maxHeight}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
    >
      {backgroundLines}
      {children}
    </Box>
  );
}