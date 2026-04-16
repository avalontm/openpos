import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type BorderStyle = "single" | "double" | "round" | "bold" | "singleDouble";

type Props = {
  title?:      string;
  subtitle?:   string;
  children:    React.ReactNode;
  width?:      number | string;
  height?:     number;
  active?:     boolean;
  dimBorder?:  boolean;
  borderStyle?: BorderStyle;
  collapsible?: boolean;
  collapsed?:   boolean;
  onToggle?:    () => void;
};

const BORDER_STYLES: Record<BorderStyle, { tl: string; tr: string; bl: string; br: string; h: string; v: string }> = {
  single:      { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
  double:      { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" },
  round:       { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
  bold:        { tl: "┏", tr: "┓", bl: "┗", br: "┛", h: "━", v: "┃" },
  singleDouble: { tl: "╓", tr: "╖", bl: "╙", br: "╜", h: "─", v: "║" },
};

export function Border({ 
  title, 
  subtitle, 
  children, 
  width, 
  height, 
  active, 
  dimBorder,
  borderStyle = "single",
  collapsible = false,
  collapsed = false,
  onToggle
}: Props) {
  const baseColor = dimBorder ? theme.textDim : (active ? theme.green : theme.textMuted);
  const border = BORDER_STYLES[borderStyle];
  
  // Si está colapsado, solo mostrar título
  if (collapsible && collapsed) {
    return (
      <Box flexDirection="column">
        <Box gap={1}>
          <Text color={baseColor} onClick={onToggle}>
            {border.tl}{border.h.repeat(2)} {title && `${border.h} `}
          </Text>
          {title && (
            <Text color={active ? theme.green : theme.textSec} bold={active}>
              {title}
            </Text>
          )}
          <Text color={baseColor} onClick={onToggle}>
            {subtitle && ` ${border.h} ${subtitle}`}
            {border.h.repeat(2)}{border.tr}
          </Text>
        </Box>
        <Text color={theme.textDim}>  (colapsado - presiona para expandir)</Text>
      </Box>
    );
  }
  
  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Top border con título */}
      <Box>
        <Text color={baseColor}>{border.tl}</Text>
        <Text color={baseColor}>{border.h.repeat(2)}</Text>
        {title && (
          <>
            <Text color={baseColor}>{border.h}</Text>
            <Text color={active ? theme.green : theme.textSec} bold={active}>
              {collapsible && (collapsed ? " [+] " : " [-] ")}{title}
            </Text>
            <Text color={baseColor}>{border.h}</Text>
          </>
        )}
        {subtitle && (
          <>
            <Text color={baseColor}>{border.h}</Text>
            <Text color={theme.textMuted}>{subtitle}</Text>
            <Text color={baseColor}>{border.h}</Text>
          </>
        )}
        <Box flexGrow={1}>
          <Text color={baseColor}>{border.h.repeat(Math.max(0, (typeof width === 'number' ? width : 80) - (title?.length || 0) - (subtitle?.length || 0) - 6))}</Text>
        </Box>
        <Text color={baseColor}>{border.tr}</Text>
      </Box>
      
      {/* Contenido */}
      <Box flexDirection="column" flexGrow={1}>
        {React.Children.map(children, (child, i) => (
          <Box key={i}>
            <Text color={baseColor}>{border.v}</Text>
            <Box flexGrow={1}>{child}</Box>
            <Text color={baseColor}>{border.v}</Text>
          </Box>
        ))}
      </Box>
      
      {/* Bottom border */}
      <Box>
        <Text color={baseColor}>{border.bl}</Text>
        <Text color={baseColor}>{border.h.repeat((typeof width === 'number' ? width : 80) - 2)}</Text>
        <Text color={baseColor}>{border.br}</Text>
      </Box>
    </Box>
  );
}