import React from "react";
import { Box, Text } from "ink";

function getInitialSize(): { columns: number; rows: number } {
  const global = globalThis as unknown as { __TERM_COLS__?: number; __TERM_ROWS__?: number };
  
  if (global.__TERM_COLS__ && global.__TERM_ROWS__) {
    return { columns: global.__TERM_COLS__, rows: global.__TERM_ROWS__ };
  }
  
  return { columns: 80, rows: 24 };
}

function getCurrentSize(): { columns: number; rows: number } {
  return {
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  };
}

export type WidthTier  = "compact" | "normal" | "wide";
export type HeightTier = "short"   | "normal" | "tall";

export interface LayoutDims {
  cols: number;
  rows: number;
  widthTier:  WidthTier;
  heightTier: HeightTier;
  ticketW:  number;
  gridCols: number;
  gridW:    number;
  itemH:    number;
  divW:     number;
  headerH:  number;
  searchH:  number;
  footerH:  number;
  subHdrH:  number;
  hintsH:   number;
  mainH:    number;
  gridH:    number;
  ticketH:  number;
  loginPanelW: number;
  logoMaxW:    number;
  loadPanelW: number;
  tooSmall: boolean;
  minCols:  number;
  minRows:  number;
}

export function computeLayout(cols: number, rows: number): LayoutDims {
  const MIN_COLS = 80;
  const MIN_ROWS = 20;
  const tooSmall = cols < MIN_COLS || rows < MIN_ROWS;

  const widthTier: WidthTier =
    cols < 100  ? "compact" :
    cols < 140  ? "normal"  : "wide";

  const heightTier: HeightTier =
    rows < 24 ? "short"  :
    rows < 36 ? "normal" : "tall";

  const ticketW =
    widthTier === "compact" ? 22 :
    widthTier === "normal"  ? 26 : 30;

  const gridCols =
    widthTier === "compact" ? 1 :
    widthTier === "normal"  ? 2 : 3;

  const divW = 1;

  const gridW = Math.max(20, cols - ticketW - divW);

  const itemH =
    heightTier === "short"  ? 4 :
    heightTier === "normal" ? 5 : 6;

  const headerH = 1;
  const searchH = 1;
  const footerH = 1;
  const subHdrH = 1;
  const hintsH  = 1;

  const mainH  = Math.max(4, rows - headerH - searchH - footerH);
  const gridH  = Math.max(4, mainH - subHdrH - hintsH);
  const ticketH = mainH;

  const loginPanelW =
    widthTier === "compact" ? Math.min(cols - 4, 40) : 44;

  const logoMaxW = Math.min(cols - 4, 80);

  const loadPanelW = Math.min(cols - 4, 46);

  return {
    cols, rows,
    widthTier, heightTier,
    ticketW, gridCols, gridW, itemH, divW,
    headerH, searchH, footerH, subHdrH, hintsH,
    mainH, gridH, ticketH,
    loginPanelW, logoMaxW,
    loadPanelW,
    tooSmall,
    minCols: MIN_COLS,
    minRows: MIN_ROWS,
  };
}

export type UseLayoutReturn = LayoutDims & { refresh: () => void };

export function useLayout(): UseLayoutReturn {
  const [dims, setDims] = React.useState<LayoutDims>(() => {
    const { columns, rows } = getInitialSize();
    return computeLayout(columns, rows);
  });

  React.useEffect(() => {
    const update = () => {
      const { columns, rows } = getCurrentSize();
      setDims(computeLayout(columns, rows));
    };
    process.stdout.on("resize", update);
    return () => { process.stdout.off("resize", update); };
  }, []);

  const refresh = React.useCallback(() => {
    const { columns, rows } = getCurrentSize();
    setDims(computeLayout(columns, rows));
  }, []);

  return { ...dims, refresh };
}

export function TooSmallOverlay({ layout }: { layout: LayoutDims & { refresh?: () => void } }) {
  return (
    <Box
      width={layout.cols}
      height={layout.rows}
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
    >
      <Text color="#ff5f5f" bold>Terminal demasiado pequena</Text>
      <Text color="#888888">
        {"Minimo: "}{layout.minCols}{"x"}{layout.minRows}
        {"  Actual: "}{layout.cols}{"x"}{layout.rows}
      </Text>
      <Text color="#555555">Redimensiona la ventana para continuar</Text>
    </Box>
  );
}

export const theme = {
  bg: {
    primary: "#1a1a2e",
    secondary: "#16213e",
    accent: "#0f3460",
    success: "#1b4332",
    danger: "#5c1a1a",
  },
  text: {
    primary: "#e0e0e0",
    secondary: "#a0a0a0",
    accent: "#4da8da",
    success: "#52b788",
    danger: "#f25c5c",
    muted: "#666666",
  },
  border: {
    default: "#333333",
    focus: "#4da8da",
  },
};