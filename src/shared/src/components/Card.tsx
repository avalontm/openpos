import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type CardVariant = "default" | "elevated" | "outlined" | "filled";

type CardSize = "sm" | "md" | "lg";

type Props = {
  children:     React.ReactNode;
  title?:       string;
  subtitle?:    string;
  footer?:      React.ReactNode;   // Nuevo
  variant?:     CardVariant;        // Nuevo
  size?:        CardSize;           // Nuevo
  padding?:     number;
  borderStyle?: "single" | "double" | "round" | "bold";
  borderColor?: string;
  onClick?:     () => void;         // Nuevo: interactividad
  hoverable?:   boolean;            // Nuevo: efecto hover
  active?:      boolean;            // Nuevo: estado activo
};

const VARIANT_STYLES: Record<CardVariant, { bg: string; border: string; shadow: string }> = {
  default:  { bg: theme.bgPanel, border: theme.textDim, shadow: "" },
  elevated: { bg: theme.bgSection, border: theme.textMuted, shadow: "░" },
  outlined: { bg: "transparent", border: theme.textMuted, shadow: "" },
  filled:   { bg: theme.bgActive, border: theme.textDim, shadow: "" },
};

const SIZE_PADDING: Record<CardSize, number> = {
  sm: 1,
  md: 2,
  lg: 3,
};

export function Card({ 
  children, 
  title, 
  subtitle,
  footer,
  variant = "default",
  size = "md",
  padding,
  borderStyle = "single",
  borderColor,
  onClick,
  hoverable = false,
  active = false,
}: Props) {
  const [isHovered, setIsHovered] = React.useState(false);
  const style = VARIANT_STYLES[variant];
  const finalPadding = padding ?? SIZE_PADDING[size];
  
  // Determinar colores basados en estado
  let finalBg = style.bg;
  let finalBorder = borderColor || style.border;
  
  if (active) {
    finalBorder = theme.green;
    finalBg = theme.bgActive;
  }
  
  if (isHovered && hoverable && onClick) {
    finalBorder = theme.blue;
  }
  
  // Efecto de sombra para elevated
  const shadowEffect = variant === "elevated" ? (
    <Box position="absolute" top={1} left={1} right={0} bottom={0}>
      <Text color={theme.textDim}>░</Text>
    </Box>
  ) : null;
  
  const cardContent = (
    <Box flexDirection="column" borderStyle={borderStyle} borderColor={finalBorder} backgroundColor={finalBg}>
      {/* Header */}
      {(title || subtitle) && (
        <Box flexDirection="column" paddingX={finalPadding} paddingTop={finalPadding} paddingBottom={0}>
          {title && (
            <Text bold color={active ? theme.green : theme.textPri}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text color={theme.textMuted} size="small">
              {subtitle}
            </Text>
          )}
        </Box>
      )}
      
      {/* Divider opcional entre header y contenido */}
      {(title || subtitle) && (
        <Box paddingX={finalPadding} paddingTop={1}>
          <Text color={theme.textDim}>─</Text>
        </Box>
      )}
      
      {/* Content */}
      <Box padding={finalPadding}>
        {children}
      </Box>
      
      {/* Footer */}
      {footer && (
        <>
          <Box paddingX={finalPadding} paddingBottom={1}>
            <Text color={theme.textDim}>─</Text>
          </Box>
          <Box paddingX={finalPadding} paddingBottom={finalPadding}>
            {footer}
          </Box>
        </>
      )}
    </Box>
  );
  
  // Si tiene onClick, envolver en un Box interactivo
  if (onClick) {
    return (
      <Box
        onMouseEnter={() => hoverable && setIsHovered(true)}
        onMouseLeave={() => hoverable && setIsHovered(false)}
      >
        {shadowEffect}
        {cardContent}
      </Box>
    );
  }
  
  return (
    <>
      {shadowEffect}
      {cardContent}
    </>
  );
}