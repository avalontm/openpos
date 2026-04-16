import React from "react";
import { Box, Text } from "ink";
import { theme } from "../../theme.js";

type ContainerProps = {
  children?: React.ReactNode;
  direction?: "row" | "column";
  justifyContent?: "flex-start" | "center" | "space-between" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end";
  gap?: number;
  flexGrow?: number;
  width?: number | string;
  height?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  border?: boolean;
  borderColor?: string;
};

function getWidthValue(w: number | string | undefined, def: number): number {
  return typeof w === "number" ? w : def;
}

export function Container({
  children,
  direction = "column",
  justifyContent,
  alignItems,
  gap,
  flexGrow,
  width,
  height,
  padding,
  paddingX,
  paddingY,
  border = false,
  borderColor = theme.textMuted,
}: ContainerProps) {
  const w = getWidthValue(width, 80);

  if (border) {
    return (
      <Box flexDirection="column" width={width} height={height}>
        <Box>
          <Text color={borderColor}>┌</Text>
          <Text color={borderColor}>{"─".repeat(w - 2)}</Text>
          <Text color={borderColor}>┐</Text>
        </Box>
        <Box flexGrow={1} padding={padding} paddingX={paddingX} paddingY={paddingY}>
          {children}
        </Box>
        <Box>
          <Text color={borderColor}>└</Text>
          <Text color={borderColor}>{"─".repeat(w - 2)}</Text>
          <Text color={borderColor}>┘</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={direction}
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
      flexGrow={flexGrow}
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

type SplitProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  direction?: "horizontal" | "vertical";
  ratio?: number;
  divider?: boolean;
  dividerColor?: string;
};

export function Split({
  left,
  right,
  direction = "horizontal",
  ratio = 0.5,
  divider = true,
  dividerColor = theme.textMuted,
}: SplitProps) {
  if (direction === "horizontal") {
    return (
      <Box flexDirection="row" flexGrow={1}>
        <Box flexGrow={Math.floor(ratio * 100)}>
          {left}
        </Box>
        {divider && (
          <Box width={1}>
            <Text color={dividerColor}>│</Text>
          </Box>
        )}
        <Box flexGrow={Math.floor((1 - ratio) * 100)}>
          {right}
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexGrow={Math.floor(ratio * 100)}>
        {left}
      </Box>
      {divider && (
        <Box>
          <Text color={dividerColor}>{"─".repeat(40)}</Text>
        </Box>
      )}
      <Box flexGrow={Math.floor((1 - ratio) * 100)}>
        {right}
      </Box>
    </Box>
  );
}

type OverlayProps = {
  children: React.ReactNode;
  visible: boolean;
  width?: number;
  height?: number;
  title?: string;
};

export function Overlay({
  children,
  visible,
  width = 40,
  height,
  title,
}: OverlayProps) {
  if (!visible) return null;

  const innerW = width - 2;
  const borderColor = theme.green;

  return (
    <Box position="absolute" flexDirection="column" marginTop={3}>
      <Box>
        <Text color={borderColor}>┌</Text>
        <Text color={borderColor}>{"─".repeat(innerW)}</Text>
        <Text color={borderColor}>┐</Text>
      </Box>

      {title && (
        <>
          <Box>
            <Text color={borderColor}>│</Text>
            <Text color={theme.white} bold> {title} </Text>
            <Text color={theme.textDim}>{" ".repeat(innerW - title.length - 3)}</Text>
            <Text color={theme.textMuted}>esc</Text>
            <Text color={borderColor}>│</Text>
          </Box>
          <Box>
            <Text color={borderColor}>├</Text>
            <Text color={borderColor}>{"─".repeat(innerW)}</Text>
            <Text color={borderColor}>┤</Text>
          </Box>
        </>
      )}

      {!title && (
        <Box>
          <Text color={borderColor}>│</Text>
          <Text color={borderColor}>{" ".repeat(innerW)}</Text>
          <Text color={borderColor}>│</Text>
        </Box>
      )}

      <Box paddingX={1} paddingY={0}>
        {children}
      </Box>

      <Box>
        <Text color={borderColor}>└</Text>
        <Text color={borderColor}>{"─".repeat(innerW)}</Text>
        <Text color={borderColor}>┘</Text>
      </Box>
    </Box>
  );
}

type DialogProps = {
  title: string;
  children: React.ReactNode;
  width?: number;
  visible?: boolean;
};

export function Dialog({
  title,
  children,
  width = 40,
  visible = true,
}: DialogProps) {
  return (
    <Overlay visible={visible} width={width} title={title}>
      <Box flexDirection="column" gap={1}>
        {children}
        <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
          <Text color={theme.textMuted}>Enter confirmar</Text>
          <Text color={theme.textMuted}>Esc cancelar</Text>
        </Box>
      </Box>
    </Overlay>
  );
}