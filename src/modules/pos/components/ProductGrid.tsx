import React from "react";
import { Box, Text, useInput } from "ink";
import { type Product, theme, fmt } from "@openpos/shared";

type Props = {
  products:   Product[];
  query:      string;
  total:      number;
  onSelect:   (p: Product) => void;
  onLoadMore: () => void;
  active:     boolean;
  width:      number;
  height:     number;
  cols:       number;   // grid columns — injected from useLayout
  itemH:      number;   // rows per card — injected from useLayout
};

const SCROLLBAR = 2;

// ── Scrollbar ─────────────────────────────────────────────────────────────────
function Scrollbar(props: {
  scrollRow:   number;
  totalRows:   number;
  visibleRows: number;
  trackH:      number;
}) {
  const { scrollRow, totalRows, visibleRows, trackH } = props;

  if (totalRows <= visibleRows) {
    return (
      <Box flexDirection="column" width={SCROLLBAR}>
        {Array.from({ length: trackH }).map((_, i) => (
          <Text key={i} color={theme.textDim}> </Text>
        ))}
      </Box>
    );
  }

  const thumbH   = Math.max(1, Math.round((visibleRows / totalRows) * trackH));
  const maxOffset = trackH - thumbH;
  const thumbPos  = Math.round((scrollRow / Math.max(1, totalRows - visibleRows)) * maxOffset);

  const lines: string[] = Array.from({ length: trackH }, (_, i) => {
    if (i >= thumbPos && i < thumbPos + thumbH) return "█";
    return "▒";
  });

  if (trackH >= 3) {
    lines[0]          = scrollRow > 0                           ? "▲" : "╷";
    lines[trackH - 1] = scrollRow + visibleRows < totalRows    ? "▼" : "╵";
  }

  return (
    <Box flexDirection="column" width={SCROLLBAR} alignItems="center">
      {lines.map((ch, i) => (
        <Text key={i} color={ch === "█" ? theme.textSec : theme.textDim}>{ch}</Text>
      ))}
    </Box>
  );
}

// ── StockBar ──────────────────────────────────────────────────────────────────
function StockBar(props: { stock: number; max: number; width: number; low: boolean }) {
  const { stock, max, width, low } = props;
  const filled = max > 0 ? Math.max(1, Math.round((Math.min(stock, max) / max) * width)) : 0;
  const empty  = Math.max(0, width - filled);
  const col    = low ? theme.red : stock > max * 0.5 ? theme.green : theme.amber;
  return (
    <Text>
      <Text color={col}>{"▰".repeat(filled)}</Text>
      <Text color={theme.textDim}>{"▱".repeat(empty)}</Text>
    </Text>
  );
}

// ── CatBadge ──────────────────────────────────────────────────────────────────
function CatBadge(props: { category: string; selected: boolean }) {
  const { category, selected } = props;
  return (
    <Text color={selected ? theme.textSec : theme.textMuted}>
      {category}
    </Text>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProductGrid({
  products, query, total, onSelect, onLoadMore, active, width, height, cols: COLS, itemH: ITEM_H,
}: Props) {
  const [cursor,    setCursor]    = React.useState(0);
  const [scrollRow, setScrollRow] = React.useState(0);

  const filtered = React.useMemo(() =>
    query
      ? products.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
        )
      : products,
    [products, query]
  );

  React.useEffect(() => { setCursor(0); setScrollRow(0); }, [query]);

  const visibleRows = Math.max(1, Math.floor((height - 1) / ITEM_H));

  // Load more when scrolling near the end
  const hasMore = products.length < total;
  React.useEffect(() => {
    if (hasMore && scrollRow >= filtered.length - visibleRows * 2) {
      onLoadMore();
    }
  }, [scrollRow, hasMore, filtered.length, visibleRows]);

  // Clamp cursor when cols changes (e.g. terminal resize changes grid columns)
  React.useEffect(() => {
    setCursor(c => Math.min(c, Math.max(0, filtered.length - 1)));
  }, [COLS, filtered.length]);

  const maxStock = React.useMemo(() =>
    filtered.reduce((mx, p) => Math.max(mx, p.stock ?? 0), 1),
    [filtered]
  );

  const allRows: Product[][] = React.useMemo(() => {
    const rows: Product[][] = [];
    for (let i = 0; i < filtered.length; i += COLS)
      rows.push(filtered.slice(i, i + COLS));
    return rows;
  }, [filtered, COLS]);

  const totalRows = allRows.length;

  const clampScroll = React.useCallback((nextCursor: number, currentScroll: number) => {
    const row = Math.floor(nextCursor / COLS);
    if (row < currentScroll)               return row;
    if (row >= currentScroll + visibleRows) return row - visibleRows + 1;
    return currentScroll;
  }, [visibleRows, COLS]);

  useInput((input, key) => {
    if (!active) return;
    const len = filtered.length;
    if (!len) return;

    const currentRow = Math.floor(cursor / COLS);
    const currentCol = cursor % COLS;
    let next       = cursor;
    let nextScroll = scrollRow;

    if (key.upArrow || input === "1") {
      if (currentRow > 0) {
        next = cursor - COLS;
      } else {
        const lastRow = Math.floor((len - 1) / COLS);
        const lastCol = Math.min(currentCol, (len - 1) % COLS);
        next = lastRow * COLS + lastCol;
      }
    }

    if (key.downArrow || input === "2") {
      const nRow = currentRow + 1;
      if (nRow * COLS < len) {
        next = cursor + COLS;
        if (next >= len) next = len - 1;
      } else {
        next = currentCol;
        if (next >= len) next = 0;
      }
    }

    if (key.leftArrow || input === "3") {
      if (currentCol > 0) {
        next = cursor - 1;
      } else {
        next = Math.min(cursor + COLS - 1, len - 1);
      }
    }

    if (key.rightArrow) {
      if (currentCol < COLS - 1 && cursor + 1 < len) {
        next = cursor + 1;
      } else {
        next = cursor - currentCol;
      }
    }

    if (key.pageUp) {
      const targetRow = Math.max(0, currentRow - visibleRows);
      next       = targetRow * COLS + currentCol;
      if (next >= len) next = Math.max(0, len - 1);
      nextScroll = Math.max(0, scrollRow - visibleRows);
    }

    if (key.pageDown) {
      const targetRow = Math.min(totalRows - 1, currentRow + visibleRows);
      next       = targetRow * COLS + currentCol;
      if (next >= len) next = len - 1;
      nextScroll = Math.min(Math.max(0, totalRows - visibleRows), scrollRow + visibleRows);
    }

    if (key.return || input === "4") {
      onSelect(filtered[cursor]!);
      return;
    }

    if (next !== cursor || nextScroll !== scrollRow) {
      const finalScroll = (key.pageUp || key.pageDown)
        ? nextScroll
        : clampScroll(next, scrollRow);
      setCursor(next);
      setScrollRow(finalScroll);
    }
  });

  // ── Dimensions ────────────────────────────────────────────────────────────
  const gridW = width - SCROLLBAR;
  const colW  = Math.floor(gridW / COLS);

  const visibleSlice = allRows.slice(scrollRow, scrollRow + visibleRows);
  const trackH       = visibleRows * ITEM_H;

  const currentPage = Math.floor(scrollRow / visibleRows) + 1;
  const totalPages  = Math.max(1, Math.ceil(totalRows / visibleRows));

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!filtered.length) {
    const emptyW  = Math.min(60, colW * COLS);
    const divider = "╌".repeat(emptyW);
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" width={width} height={height}>
        <Box width={emptyW} justifyContent="center"><Text color={theme.textDim}>{divider}</Text></Box>
        <Box width={emptyW} justifyContent="center">
          <Text color={theme.textMuted}>
            {query ? `○  Sin resultados para "${query}"` : "○  No hay productos disponibles"}
          </Text>
        </Box>
        {query && (
          <Box width={emptyW} justifyContent="center">
            <Text color={theme.textDim}>Intenta con otro nombre, SKU o codigo de barras</Text>
          </Box>
        )}
        <Box width={emptyW} justifyContent="center"><Text color={theme.textDim}>{divider}</Text></Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={height}>

      {/* Grid + Scrollbar */}
      <Box flexDirection="row" height={trackH} flexGrow={0}>
        <Box flexDirection="column" width={gridW}>
          {visibleSlice.map((row, ri) => {
            const absRi = scrollRow + ri;
            return (
              <Box key={absRi} flexDirection="row">
                {row.map((p, ci) => {
                  const idx      = absRi * COLS + ci;
                  const sel      = idx === cursor && active;
                  const catColor = theme.textSec;
                  const stock    = p.stock ?? 0;
                  const isLow    = stock > 0 && stock <= 5;
                  const isOut    = stock === 0;
                  const inactive = p.active === 0;
                  const innerW   = colW - 4;
                  const barW     = Math.max(4, Math.floor(innerW * 0.55));

                  // Extra row content when card is tall enough
                  const showExtraRow = ITEM_H >= 6;

                  return (
                    <Box
                      key={p.sku}
                      width={colW}
                      flexDirection="column"
                      paddingX={1}
                      borderStyle="single"
                      borderColor={
                        sel     ? catColor
                        : isOut ? theme.textDim
                        : theme.bgActive
                      }
                    >
                      {/* Row 1: category + SKU */}
                      <Box justifyContent="space-between">
                        <CatBadge category={p.category} selected={sel} />
                        <Text color={sel ? theme.textMuted : theme.textDim}>{p.sku}</Text>
                      </Box>

                      {/* Row 2: name */}
                      <Text
                        color={inactive ? theme.textDim : sel ? theme.white : theme.textPri}
                        bold={sel}
                        wrap="truncate"
                      >
                        {sel ? "▸ " : "  "}{fmt.trunc(p.name, innerW - 2)}
                      </Text>

                      {/* Row 3: price + stock status */}
                      <Box justifyContent="space-between">
                        <Text color={inactive ? theme.textDim : sel ? theme.greenBr : theme.green} bold={sel}>
                          {fmt.money(p.price)}
                        </Text>
                        {inactive           && <Text color={theme.textDim}>inactivo</Text>}
                        {!inactive && isOut && <Text color={theme.red}  bold>AGOTADO</Text>}
                        {!inactive && isLow && !isOut && <Text color={theme.amber}>▲ bajo</Text>}
                        {!inactive && !isLow && !isOut && <Text color={theme.textDim}>x{stock}</Text>}
                      </Box>

                      {/* Row 4: stock bar + unit */}
                      <Box justifyContent="space-between">
                        {inactive || isOut
                          ? <Text color={theme.textDim}>{"▱".repeat(barW)}</Text>
                          : <StockBar stock={stock} max={maxStock} width={barW} low={isLow} />
                        }
                        <Text color={theme.textDim}>
                          {p.unitType === "pza" ? "pza" : p.unitType ?? "pza"}
                        </Text>
                      </Box>

                      {/* Row 5 (tall only): cost margin */}
                      {showExtraRow && (
                        <Box justifyContent="space-between">
                          <Text color={theme.textDim}>
                            {"costo "}<Text color={theme.textMuted}>{fmt.money(p.cost ?? 0)}</Text>
                          </Text>
                          {p.cost && p.price > 0 && (
                            <Text color={theme.textDim}>
                              {"margen "}
                              <Text color={theme.textMuted}>
                                {Math.round(((p.price - p.cost) / p.price) * 100)}%
                              </Text>
                            </Text>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}

                {/* Empty column fillers */}
                {row.length < COLS &&
                  Array.from({ length: COLS - row.length }).map((_, ei) => (
                    <Box key={`empty-${ei}`} width={colW} />
                  ))
                }
              </Box>
            );
          })}
        </Box>

        <Scrollbar
          scrollRow={scrollRow}
          totalRows={totalRows}
          visibleRows={visibleRows}
          trackH={trackH}
        />
      </Box>

      {/* Pagination bar */}
      <Box justifyContent="space-between" width={width} paddingX={1}>
        <Text color={theme.textDim}>
          {"#"}<Text color={theme.textMuted}>{cursor + 1}</Text>
          {"/"}<Text color={theme.textDim}>{filtered.length}</Text>
        </Text>

        <Box gap={0}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Text key={i} color={i === currentPage - 1 ? theme.green : theme.textDim}>
              {i === currentPage - 1 ? "●" : "○"}
            </Text>
          ))}
          <Text color={theme.textDim}>
            {"  "}<Text color={theme.textMuted}>{currentPage}</Text>/{totalPages}
          </Text>
        </Box>

        <Text color={theme.textDim}>
          <Text color={theme.textMuted}>PgUp</Text>
          {"/"}
          <Text color={theme.textMuted}>PgDn</Text>
          {" pagina"}
        </Text>
      </Box>

    </Box>
  );
}