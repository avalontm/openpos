import React from "react";
import { Box, Text, useInput } from "ink";
import { useCart, UNIT_LABELS, BgBox, theme, fmt } from "@openpos/shared";

type BillingStatus = "idle" | "processing" | "success" | "error";

type Props = {
  active: boolean;
  onPay:  () => void;
  height: number;
  width: number;
  billingStatus?: BillingStatus;
  billingMsg?: string;
};

function formatQty(qty: number, unitType: string | undefined): string {
  const unit  = (unitType as keyof typeof UNIT_LABELS) || "pza";
  const label = UNIT_LABELS[unit] || "pza";
  if (unit === "pza") return `×${Math.round(qty)} ${label}`;
  return `×${qty.toFixed(2)} ${label}`;
}

// ── Scrollbar vertical (misma lógica que ProductGrid) ─────────────────────────
function Scrollbar(props: {
  scrollTop: number;
  totalItems: number;
  visibleItems: number;
  trackH: number;
}) {
  const { scrollTop, totalItems, visibleItems, trackH } = props;

  if (totalItems <= visibleItems) {
    return (
      <Box flexDirection="column" width={1}>
        {Array.from({ length: trackH }).map((_, i) => (
          <Text key={i} color={theme.textDim}> </Text>
        ))}
      </Box>
    );
  }

  const thumbH   = Math.max(1, Math.round((visibleItems / totalItems) * trackH));
  const maxOff   = trackH - thumbH;
  const thumbPos = Math.round((scrollTop / Math.max(1, totalItems - visibleItems)) * maxOff);

  const lines: string[] = Array.from({ length: trackH }, (_, i) => {
    if (i >= thumbPos && i < thumbPos + thumbH) return "█";
    return "▒";
  });

  if (trackH >= 3) {
    lines[0]          = scrollTop > 0                              ? "▲" : "╷";
    lines[trackH - 1] = scrollTop + visibleItems < totalItems     ? "▼" : "╵";
  }

  return (
    <Box flexDirection="column" width={1} alignItems="center">
      {lines.map((ch, i) => (
        <Text key={i} color={ch === "█" ? theme.textSec : theme.textDim}>{ch}</Text>
      ))}
    </Box>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export function Ticket({ active, onPay, height, width, billingStatus, billingMsg }: Props) {
  const { items, inc, dec, remove, subtotal, tax, total, ticketNum } = useCart();
  const [cursor, setCursor] = React.useState(0);

  useInput((input, key) => {
    if (!active) return;
    if (key.upArrow   || input === "1") setCursor(c => Math.max(0, c - 1));
    if (key.downArrow || input === "2") setCursor(c => Math.min(items.length - 1, c + 1));
    if (input === "+") { if (items[cursor]) inc(items[cursor]!.sku); }
    if (input === "-") { if (items[cursor]) dec(items[cursor]!.sku); }
    if (input === "d") { if (items[cursor]) remove(items[cursor]!.sku); }
    if (key.return || input === "4") {
      if (items.length > 0) onPay();
    }
  });

  React.useEffect(() => {
    if (cursor >= items.length) setCursor(Math.max(0, items.length - 1));
  }, [items.length]);

  // ── Layout ──────────────────────────────────────────────────────────────────
  // Filas reservadas:
  //   header(1) + divider(1) + subtotal(1) + iva(1) + total(1) + hints(1) + btn(1) = 7
  const RESERVED   = 7;
  const ITEM_H     = 2;
  const maxVisible = Math.max(1, Math.floor((height - RESERVED) / ITEM_H));

  const scrollTop = Math.max(0, Math.min(
    cursor - Math.floor(maxVisible / 2),
    items.length - maxVisible,
  ));
  const visibleItems = items.slice(scrollTop, scrollTop + maxVisible);
  const trackH       = maxVisible * ITEM_H;
  const emptyRows    = Math.max(0, maxVisible - visibleItems.length);

  return (
    <Box flexDirection="column" width={width} height={height}>

      {/* ── Header — 1 línea ─────────────────────────────────────────────── */}
      <BgBox variant="section" width={width} paddingX={1}>
        <Box width={width - 2} justifyContent="space-between">
          <Box flexDirection="row" gap={1}>
            <Text color={active ? theme.green : theme.textDim} bold>
              {active ? "▸" : " "}
            </Text>
            <Text color={active ? theme.white : theme.textSec} bold>
              TICKET
            </Text>
          </Box>
          <Text color={theme.textMuted}>{fmt.ticket(ticketNum)}</Text>
        </Box>
      </BgBox>

      {/* ── Lista de ítems + scrollbar ───────────────────────────────────── */}
      <Box flexDirection="row" height={trackH}>

        {/* Ítems */}
        <Box flexDirection="column" width={width - 1} height={trackH} paddingX={1}>
          {items.length === 0 ? (
            <Box flexDirection="column" height={trackH} justifyContent="center">
              <Text color={theme.textMuted}>○  Carrito vacío</Text>
              <Text color={theme.textDim}>   Agrega productos</Text>
            </Box>
          ) : (
            <>
              {visibleItems.map((item, i) => {
                const absIdx = scrollTop + i;
                const sel    = absIdx === cursor && active;
                return (
                  <Box key={item.sku} flexDirection="column">
                    {/* Fila 1: nombre + precio */}
                    <Box flexDirection="row" justifyContent="space-between">
                      <Text
                        color={sel ? theme.white : theme.textPri}
                        bold={sel}
                        wrap="truncate"
                      >
                        {sel ? "▸" : "  "}{fmt.trunc(item.name, 10)}
                      </Text>
                      <Text color={sel ? theme.greenBr : theme.green}>
                        {fmt.money(item.price * item.qty)}
                      </Text>
                    </Box>
                    {/* Fila 2: cantidad + atajos si seleccionado */}
                    <Box flexDirection="row">
                      <Text color={sel ? theme.amber : theme.textMuted}>
                        {"  "}{formatQty(item.qty, item.unitType)}
                      </Text>
                      {sel && <Text color={theme.textDim}>{" [+/-/d]"}</Text>}
                    </Box>
                  </Box>
                );
              })}

              {/* Relleno para altura fija */}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <Box key={`empty-${i}`} flexDirection="column">
                  <Text> </Text>
                  <Text> </Text>
                </Box>
              ))}
            </>
          )}
        </Box>

        {/* Scrollbar — 1 col */}
        <Scrollbar
          scrollTop={scrollTop}
          totalItems={items.length}
          visibleItems={maxVisible}
          trackH={trackH}
        />
      </Box>

      {/* ── Divider — 1 línea ────────────────────────────────────────────── */}
      <Box paddingX={1}>
        <Text color={theme.textDim}>{"─".repeat(width - 2)}</Text>
      </Box>

      {/* ── Subtotal — 1 línea ───────────────────────────────────────────── */}
      <Box justifyContent="space-between" paddingX={1}>
        <Text color={theme.textMuted}>Subtotal</Text>
        <Text color={theme.textSec}>{fmt.money(subtotal())}</Text>
      </Box>

      {/* ── IVA — 1 línea ────────────────────────────────────────────────── */}
      <Box justifyContent="space-between" paddingX={1}>
        <Text color={theme.textMuted}>IVA 16%</Text>
        <Text color={theme.textSec}>{fmt.money(tax())}</Text>
      </Box>

      {/* ── Total — 1 línea ──────────────────────────────────────────────── */}
      <Box justifyContent="space-between" paddingX={1}>
        <Text color={theme.green} bold>TOTAL</Text>
        <Text color={theme.green} bold>{fmt.money(total())}</Text>
      </Box>

      {/* ── Billing status — 1 línea ──────────────────────────────────────── */}
      {billingStatus && billingStatus !== "idle" && (
        <Box justifyContent="center" paddingX={1}>
          {billingStatus === "processing" && (
            <Text color={theme.amber}>⏳ FACTURANDO...</Text>
          )}
          {billingStatus === "success" && (
            <Text color={theme.green}>✓ FACTURADO</Text>
          )}
          {billingStatus === "error" && (
            <Text color={theme.red}>{billingMsg || "✗ ERROR FACTURA"}</Text>
          )}
        </Box>
      )}

      {/* ── Hints — 1 línea ──────────────────────────────────────────────── */}
      <Box paddingX={1} gap={1}>
        {active && items.length > 0 ? (
          <>
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>+/-</Text>{" qty"}
            </Text>
            <Text color={theme.textDim}>{"·"}</Text>
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>d</Text>{" borrar"}
            </Text>
          </>
        ) : (
          <Text color={theme.textDim}>
            <Text color={theme.textMuted}>Tab</Text>{" → ticket"}
          </Text>
        )}
      </Box>

      {/* ── Botón cobrar — 1 línea ───────────────────────────────────────── */}
      <Box justifyContent="center" paddingX={1}>
        {items.length === 0 ? (
          <Text color={theme.textDim}>○  Sin ítems</Text>
        ) : active ? (
          <Text color={theme.green} bold>{"[ Enter ]  Cobrar  →"}</Text>
        ) : (
          <Text color={theme.textMuted}>{"[ Enter ]  Cobrar"}</Text>
        )}
      </Box>

    </Box>
  );
}