import React from "react";

// ── Terminal size getter ───────────────────────────────────────────────────────
// Initial size: use pre-captured values from app.tsx (captured before alternate screen)
// Resize: use process.stdout directly (detects changes reliably on Windows)
function getInitialSize(): { columns: number; rows: number } {
  const global = globalThis as unknown as { __TERM_COLS__?: number; __TERM_ROWS__?: number };
  
  if (global.__TERM_COLS__ && global.__TERM_ROWS__) {
    return { columns: global.__TERM_COLS__, rows: global.__TERM_ROWS__ };
  }
  
  // Fallback to process.stdout
  return { columns: 80, rows: 24 };
}

function getCurrentSize(): { columns: number; rows: number } {
  return {
    columns: process.stdout.columns || 120,
    rows: process.stdout.rows || 30,
  };
}

// ── Terminal size breakpoints ──────────────────────────────────────────────────
// Designed for a POS app with a fixed-width ticket panel and a product grid.
//
// Width tiers:
//   compact  < 100 cols   — single col grid, narrow ticket
//   normal  100–139 cols  — 2 col grid, standard ticket
//   wide   >= 140 cols    — 3 col grid, wide ticket
//
// Height tiers:
//   short  < 24 rows      — minimal chrome, reduced card height
//   normal  24–35 rows    — standard layout
//   tall   >= 36 rows     — extra breathing room

export type WidthTier  = "compact" | "normal" | "wide";
export type HeightTier = "short"   | "normal" | "tall";

export interface LayoutDims {
  // Raw terminal size
  cols: number;
  rows: number;

  // Tiers
  widthTier:  WidthTier;
  heightTier: HeightTier;

  // PosScreen panels
  ticketW:  number;   // ticket panel width
  gridCols: number;   // product grid columns
  gridW:    number;   // product panel width (cols - ticketW - divider)
  itemH:    number;   // rows per product card
  divW:     number;   // divider column width

  // Fixed chrome rows
  headerH:  number;
  searchH:  number;
  footerH:  number;
  subHdrH:  number;
  hintsH:   number;

  // Derived heights
  mainH:    number;   // rows between header+search and footer
  gridH:    number;   // product grid content area
  ticketH:  number;   // ticket panel height (= mainH)

  // LoginScreen
  loginPanelW: number;
  logoMaxW:    number;

  // LoadingScreen
  loadPanelW: number;

  // Minimum viable size flag
  tooSmall: boolean;
  minCols:  number;
  minRows:  number;
}

// ── Pure computation — no React, easy to test ─────────────────────────────────
export function computeLayout(cols: number, rows: number): LayoutDims {
  const MIN_COLS = 80;
  const MIN_ROWS = 20;
  const tooSmall = cols < MIN_COLS || rows < MIN_ROWS;

  // Width tier
  const widthTier: WidthTier =
    cols < 100  ? "compact" :
    cols < 140  ? "normal"  : "wide";

  // Height tier
  const heightTier: HeightTier =
    rows < 24 ? "short"  :
    rows < 36 ? "normal" : "tall";

  // Ticket panel width — scales with terminal
  const ticketW =
    widthTier === "compact" ? 22 :
    widthTier === "normal"  ? 26 : 30;

  // Product grid columns
  const gridCols =
    widthTier === "compact" ? 1 :
    widthTier === "normal"  ? 2 : 3;

  // Divider
  const divW = 1;

  // Grid panel width
  const gridW = Math.max(20, cols - ticketW - divW);

  // Product card height — taller terminals get taller cards
  const itemH =
    heightTier === "short"  ? 4 :
    heightTier === "normal" ? 5 : 6;

  // Fixed chrome
  const headerH = 1;
  const searchH = 1;
  const footerH = 1;
  const subHdrH = 1;
  const hintsH  = 1;

  // Derived heights
  const mainH  = Math.max(4, rows - headerH - searchH - footerH);
  const gridH  = Math.max(4, mainH - subHdrH - hintsH);
  const ticketH = mainH;

  // Login panel — narrow on compact terminals
  const loginPanelW =
    widthTier === "compact" ? Math.min(cols - 4, 40) : 44;

  // Banner max width
  const logoMaxW = Math.min(cols - 4, 80);

  // Loading panel
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

// ── React hook ────────────────────────────────────────────────────────────────
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

// ── TooSmall warning overlay ──────────────────────────────────────────────────
// Import and render this at the top of any screen that needs it.
// Usage:  if (layout.tooSmall) return <TooSmallOverlay layout={layout} />;
import { Box, Text } from "ink";

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