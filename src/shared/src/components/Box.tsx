import React from "react";
import { Box as InkBox, Text } from "ink";
import { theme } from "../theme.js";

// ─── Tipos compartidos ────────────────────────────────────────────────────────

export type BoxVariant = "default" | "panel" | "section" | "active" | "header" | "accent" | "info" | "success" | "error" | "warning";

const VARIANT_BG: Record<BoxVariant, string> = {
  default: theme.bg,         // #0d1117
  panel:   theme.bgPanel,    // #161b22
  section: theme.bgSection,  // #1c2128
  active:  theme.bgActive,   // #21262d
  header:  theme.green,      // #3fb950
  accent:  theme.bgActive,   // #21262d
  info:    theme.bgPanel,    // #161b22
  success: "#1b4721",        // Nuevo: verde oscuro
  error:   "#5c1e1c",        // Nuevo: rojo oscuro
  warning: "#5c401a",        // Nuevo: amarillo oscuro
};

const VARIANT_BORDER: Record<BoxVariant, string> = {
  default: theme.textDim,
  panel:   theme.textMuted,
  section: theme.textMuted,
  active:  theme.green,
  header:  theme.green,
  accent:  theme.blue,
  info:    theme.blue,
  success: theme.green,
  error:   theme.red,
  warning: theme.amber,
};

type SpacingProps = {
  padding?:  number;
  paddingX?: number;
  paddingY?: number;
  paddingTop?: number;     // Nuevo
  paddingBottom?: number;  // Nuevo
  paddingLeft?: number;    // Nuevo
  paddingRight?: number;   // Nuevo
  margin?:   number;       // Nuevo
  marginX?:  number;       // Nuevo
  marginY?:  number;       // Nuevo
  marginTop?: number;
  marginBottom?: number;   // Nuevo
  marginLeft?: number;     // Nuevo
  marginRight?: number;    // Nuevo
  gap?:      number;
};

type FlexProps = {
  justifyContent?: "flex-start" | "center" | "space-between" | "space-around" | "flex-end";
  alignItems?:     "flex-start" | "center" | "flex-end" | "stretch";
  flexGrow?:       number;
  flexShrink?:     number;
  flexBasis?:      number | string;  // Nuevo
  flexWrap?:       "nowrap" | "wrap" | "wrap-reverse";  // Nuevo
};

type SizeProps = {
  width?:  number | string;
  height?: number;
  minWidth?: number | string;   // Nuevo
  maxWidth?: number | string;   // Nuevo
  minHeight?: number;            // Nuevo
  maxHeight?: number;            // Nuevo
};

type BorderProps = {
  borderStyle?: "single" | "round" | "double" | "bold";
  borderColor?: string;
  borderTop?: boolean;      // Nuevo: bordes individuales
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
};

type PositionProps = {
  position?: "absolute" | "relative";  // Nuevo
  top?: number;          // Nuevo
  left?: number;         // Nuevo
  right?: number;        // Nuevo
  bottom?: number;       // Nuevo
};

type ElevationProps = {
  elevation?: 0 | 1 | 2 | 3 | 4;  // Nuevo: sombras visuales
};

// ─── Box mejorado ─────────────────────────────────────────────────────────────

type BoxProps = SpacingProps & FlexProps & SizeProps & BorderProps & PositionProps & ElevationProps & {
  children?:      React.ReactNode;
  variant?:       BoxVariant;
  flexDirection?: "row" | "column";
  withBorder?:    boolean;  // Nuevo: border automático según variante
};

const ELEVATION_STYLES: Record<number, string> = {
  0: "",
  1: "░",  // Sombra muy leve
  2: "▒",  // Sombra media
  3: "▓",  // Sombra fuerte
  4: "█",  // Sombra muy fuerte
};

export function Box({
  children,
  variant = "default",
  flexDirection = "column",
  justifyContent,
  alignItems,
  flexGrow,
  flexShrink,
  flexBasis,
  flexWrap,
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  margin,
  marginX,
  marginY,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  gap,
  borderStyle,
  borderColor,
  borderTop,
  borderBottom,
  borderLeft,
  borderRight,
  position,
  top,
  left,
  right,
  bottom,
  elevation = 0,
  withBorder = false,
}: BoxProps) {
  // Calcular backgroundColor
  let bgColor = VARIANT_BG[variant];
  
  // Calcular borderColor automático si withBorder es true
  const finalBorderColor = withBorder ? VARIANT_BORDER[variant] : borderColor;
  const finalBorderStyle = borderStyle || (withBorder ? "single" : undefined);
  
  // Crear efecto de elevación (simulado con caracteres)
  const elevationEffect = elevation > 0 && position === "absolute" ? (
    <Box position="absolute" top={1} left={1} right={1} bottom={1}>
      <Text color={theme.textDim}>{ELEVATION_STYLES[elevation].repeat(100)}</Text>
    </Box>
  ) : null;
  
  // Padding combinado
  const finalPaddingX = paddingX ?? padding;
  const finalPaddingY = paddingY ?? padding;
  const finalPaddingTop = paddingTop ?? finalPaddingY;
  const finalPaddingBottom = paddingBottom ?? finalPaddingY;
  const finalPaddingLeft = paddingLeft ?? finalPaddingX;
  const finalPaddingRight = paddingRight ?? finalPaddingX;
  
  // Margin combinado
  const finalMarginTop = marginTop ?? marginY ?? margin;
  const finalMarginBottom = marginBottom ?? marginY ?? margin;
  const finalMarginLeft = marginLeft ?? marginX ?? margin;
  const finalMarginRight = marginRight ?? marginX ?? margin;
  
  return (
    <>
      {elevationEffect}
      <InkBox
        flexDirection={flexDirection}
        justifyContent={justifyContent}
        alignItems={alignItems}
        flexGrow={flexGrow}
        flexShrink={flexShrink}
        flexBasis={flexBasis}
        flexWrap={flexWrap}
        width={width}
        height={height}
        minWidth={minWidth}
        maxWidth={maxWidth}
        minHeight={minHeight}
        maxHeight={maxHeight}
        paddingTop={finalPaddingTop}
        paddingBottom={finalPaddingBottom}
        paddingLeft={finalPaddingLeft}
        paddingRight={finalPaddingRight}
        marginTop={finalMarginTop}
        marginBottom={finalMarginBottom}
        marginLeft={finalMarginLeft}
        marginRight={finalMarginRight}
        gap={gap}
        borderStyle={finalBorderStyle}
        borderColor={finalBorderColor}
        borderTop={borderTop}
        borderBottom={borderBottom}
        borderLeft={borderLeft}
        borderRight={borderRight}
        position={position}
        top={top}
        left={left}
        right={right}
        bottom={bottom}
        backgroundColor={bgColor}
      >
        {children}
      </InkBox>
    </>
  );
}

// ─── Row (alias con flexDirection="row") ──────────────────────────────────────

type RowProps = Omit<BoxProps, "flexDirection">;

export function Row(props: RowProps) {
  return <Box {...props} flexDirection="row" />;
}

// ─── Col (alias con flexDirection="column") ───────────────────────────────────

type ColProps = Omit<BoxProps, "flexDirection">;

export function Col(props: ColProps) {
  return <Box {...props} flexDirection="column" />;
}

// ─── Alias para compatibilidad ────────────────────────────────────────────────

export const BgBox = Box;
export const BgRow = Row;
export const BgCol = Col;
export const SimpleBgBox = Box;