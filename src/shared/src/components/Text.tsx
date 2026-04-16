import React from "react";
import { Text } from "ink";
import { theme } from "../theme.js";

type TextVariant = 
  | "primary" | "secondary" | "muted" | "dim" | "white"
  | "success" | "warning" | "error" | "info"
  | "green" | "amber" | "blue" | "cyan" | "red" | "purple" | "orange";

type TextAlign = "left" | "center" | "right";

type TextWrap = "wrap" | "truncate" | "truncate-start" | "truncate-middle" | "truncate-end";

type TextAnimation = "none" | "pulse" | "blink" | "typewriter" | "glow";

type Props = {
  children: React.ReactNode;
  variant?: TextVariant;      // Nuevo: variante predefinida
  color?: string;              // Color personalizado (sobreescribe variant)
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;            // Nuevo
  underline?: boolean;         // Nuevo
  strikethrough?: boolean;     // Nuevo
  size?: "xs" | "sm" | "md" | "lg" | "xl";  // Nuevo
  align?: TextAlign;           // Nuevo: alineación
  wrap?: TextWrap;             // Nuevo: comportamiento de wrap
  maxWidth?: number;           // Nuevo: ancho máximo
  animation?: TextAnimation;   // Nuevo: animación
  animationSpeed?: number;     // Nuevo: velocidad de animación (ms)
  onAnimationEnd?: () => void; // Nuevo
};

const VARIANT_COLOR_MAP: Record<TextVariant, string> = {
  primary:   theme.textPri,
  secondary: theme.textSec,
  muted:     theme.textMuted,
  dim:       theme.textDim,
  white:     theme.white,
  success:   theme.green,
  warning:   theme.amber,
  error:     theme.red,
  info:      theme.blue,
  green:     theme.green,
  amber:     theme.amber,
  blue:      theme.blue,
  cyan:      theme.cyan,
  red:       theme.red,
  purple:    theme.purple,
  orange:    theme.orange,
};

const SIZE_FACTORS: Record<string, number> = {
  xs: 0.8,
  sm: 0.9,
  md: 1,
  lg: 1.2,
  xl: 1.5,
};

// Función para truncar texto según estrategia
const truncateText = (text: string, maxWidth: number, wrap: TextWrap): string => {
  if (text.length <= maxWidth) return text;
  
  switch (wrap) {
    case "truncate":
      return text.slice(0, maxWidth - 1) + "…";
    case "truncate-start":
      return "…" + text.slice(-(maxWidth - 1));
    case "truncate-middle":
      const half = Math.floor((maxWidth - 2) / 2);
      return text.slice(0, half) + "…" + text.slice(-half);
    case "truncate-end":
      return text.slice(0, maxWidth - 1) + "…";
    default:
      return text;
  }
};

export function Text_({ 
  children, 
  variant = "primary",
  color: customColor,
  bold = false,
  dim = false,
  italic = false,
  underline = false,
  strikethrough = false,
  size = "md",
  align = "left",
  wrap = "wrap",
  maxWidth,
  animation = "none",
  animationSpeed = 500,
  onAnimationEnd,
}: Props) {
  const [animationFrame, setAnimationFrame] = React.useState(0);
  const [typewriterIndex, setTypewriterIndex] = React.useState(0);
  const text = typeof children === "string" ? children : String(children);
  
  // Determinar color final
  const baseColor = customColor || VARIANT_COLOR_MAP[variant];
  
  // Animación pulse/blink
  React.useEffect(() => {
    if (animation === "none") return;
    
    if (animation === "pulse" || animation === "blink") {
      const interval = setInterval(() => {
        setAnimationFrame(f => (f + 1) % 2);
      }, animationSpeed);
      return () => clearInterval(interval);
    }
    
    if (animation === "typewriter") {
      if (typewriterIndex < text.length) {
        const timer = setTimeout(() => {
          setTypewriterIndex(i => i + 1);
        }, animationSpeed / text.length);
        return () => clearTimeout(timer);
      } else {
        onAnimationEnd?.();
      }
    }
    
    if (animation === "glow") {
      const interval = setInterval(() => {
        setAnimationFrame(f => (f + 1) % 4);
      }, animationSpeed / 4);
      return () => clearInterval(interval);
    }
  }, [animation, animationSpeed, typewriterIndex, text.length]);
  
  // Aplicar animación al color
  let animatedColor = baseColor;
  if (animation === "pulse") {
    const intensity = animationFrame === 0 ? 0.5 : 1;
    animatedColor = baseColor; // Ink no soporta opacidad fácilmente
  } else if (animation === "blink") {
    if (animationFrame === 0) return null; // Oculto en frames pares
  } else if (animation === "glow") {
    // Simular glow con color más brillante
    const glowColors = [baseColor, theme.greenBr, baseColor, theme.textMuted];
    animatedColor = glowColors[animationFrame] || baseColor;
  }
  
  // Texto para typewriter
  let displayText = text;
  if (animation === "typewriter") {
    displayText = text.slice(0, typewriterIndex);
    if (typewriterIndex < text.length) {
      displayText += "█"; // Cursor
    }
  }
  
  // Aplicar truncamiento
  if (maxWidth && wrap !== "wrap") {
    displayText = truncateText(displayText, maxWidth, wrap);
  }
  
  // Aplicar alineación (con espacios)
  if (maxWidth && align !== "left" && wrap === "wrap") {
    const padding = maxWidth - displayText.length;
    if (padding > 0) {
      if (align === "center") {
        const leftPad = Math.floor(padding / 2);
        displayText = " ".repeat(leftPad) + displayText + " ".repeat(padding - leftPad);
      } else if (align === "right") {
        displayText = " ".repeat(padding) + displayText;
      }
    }
  }
  
  // Construir props de estilo
  const textProps: React.ComponentProps<typeof Text> = {
    color: animatedColor,
    bold,
    dimColor: dim,
    italic,
    underline,
    strikethrough,
  };
  
  // Aplicar tamaño (simulado con bold o dim)
  if (size === "xs") {
    textProps.dimColor = true;
  } else if (size === "lg" || size === "xl") {
    textProps.bold = true;
  }
  
  return <Text {...textProps}>{displayText}</Text>;
}