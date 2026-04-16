import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type DividerStyle = "solid" | "dashed" | "dotted" | "double" | "thick" | "custom";
type DividerOrientation = "horizontal" | "vertical";

type Props = {
  width?:        number;
  height?:       number;        // Nuevo: para vertical
  style?:        DividerStyle;
  orientation?:  DividerOrientation;  // Nuevo
  color?:        string;
  label?:        string;        // Nuevo: texto en el medio
  labelPosition?: "left" | "center" | "right";  // Nuevo
  thickness?:    1 | 2 | 3;     // Nuevo: grosor
  customChar?:   string;        // Nuevo: caracter personalizado
};

const STYLE_CHARS: Record<DividerStyle, string> = {
  solid:   "─",
  dashed:  "┄",
  dotted:  "┅",
  double:  "═",
  thick:   "━",
  custom:  "─",  // será reemplazado por customChar
};

const VERTICAL_STYLE_CHARS: Record<DividerStyle, string> = {
  solid:   "│",
  dashed:  "┆",
  dotted:  "┇",
  double:  "║",
  thick:   "┃",
  custom:  "│",
};

export function Divider({ 
  width = 30, 
  height = 10,
  style = "solid", 
  orientation = "horizontal",
  color, 
  label,
  labelPosition = "center",
  thickness = 1,
  customChar,
}: Props) {
  const lineColor = color || theme.textDim;
  const isHorizontal = orientation === "horizontal";
  
  // Seleccionar caracter base
  let baseChar: string;
  if (style === "custom" && customChar) {
    baseChar = customChar;
  } else if (isHorizontal) {
    baseChar = STYLE_CHARS[style];
  } else {
    baseChar = VERTICAL_STYLE_CHARS[style];
  }
  
  // Crear línea con grosor
  const createLine = (char: string, repeat: number): string => {
    if (thickness === 1) return char.repeat(repeat);
    if (thickness === 2) return (char + char).repeat(repeat);
    return (char + char + char).repeat(repeat);
  };
  
  // Divider vertical
  if (!isHorizontal) {
    const lines = Array(height).fill(0).map((_, i) => {
      if (label && i === Math.floor(height / 2)) {
        const padding = Math.max(0, (width - label.length - 2) / 2);
        const leftPad = " ".repeat(Math.floor(padding));
        const rightPad = " ".repeat(Math.ceil(padding));
        return (
          <Text key={i} color={lineColor}>
            {leftPad}{label}{rightPad}
          </Text>
        );
      }
      return (
        <Text key={i} color={lineColor}>
          {createLine(baseChar, 1)}
        </Text>
      );
    });
    
    return <Box flexDirection="column">{lines}</Box>;
  }
  
  // Divider horizontal con label
  if (label) {
    const availableWidth = width - label.length - 2;
    let leftWidth: number, rightWidth: number;
    
    switch (labelPosition) {
      case "left":
        leftWidth = 2;
        rightWidth = availableWidth - 2;
        break;
      case "right":
        leftWidth = availableWidth - 2;
        rightWidth = 2;
        break;
      default: // center
        leftWidth = Math.floor(availableWidth / 2);
        rightWidth = Math.ceil(availableWidth / 2);
    }
    
    const leftLine = createLine(baseChar, Math.max(0, leftWidth));
    const rightLine = createLine(baseChar, Math.max(0, rightWidth));
    
    return (
      <Box flexDirection="row" gap={1} alignItems="center">
        <Text color={lineColor}>{leftLine}</Text>
        <Text color={color || theme.textSec}>{label}</Text>
        <Text color={lineColor}>{rightLine}</Text>
      </Box>
    );
  }
  
  // Divider horizontal simple
  const line = createLine(baseChar, width);
  
  // Múltiples líneas para grosor
  if (thickness > 1) {
    return (
      <Box flexDirection="column" alignItems="center">
        {Array(thickness).fill(0).map((_, i) => (
          <Text key={i} color={lineColor}>{line}</Text>
        ))}
      </Box>
    );
  }
  
  return <Text color={lineColor}>{line}</Text>;
}