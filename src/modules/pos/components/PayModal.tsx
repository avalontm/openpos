import React from "react";
import { Box, Text, useInput, usePaste } from "ink";
import { useCart, theme, fmt, useWindowManager, listClients } from "@openpos/shared";

const WINDOW_ID = "pay-modal";

// ── Tipos ──────────────────────────────────────────────────────────────────────
export type Method  = "efectivo" | "tarjeta" | "transf." | "qr/codi";
type PayStep        = "method" | "search" | "invoice" | "cash" | "change";

export interface InvoiceData {
  rfc: string;
  razonSocial: string;
  email: string;
  usoCfdi: string;
}

const USO_CFDI_OPTIONS = [
  { code: "G01", label: "Gastos en general" },
  { code: "I03", label: "Equipo de transporte" },
  { code: "I04", label: "Equipo de computo" },
  { code: "D01", label: "Donativos" },
  { code: "P01", label: "Por definir" },
];

const PAY_METHODS: Method[] = ["efectivo", "tarjeta", "transf.", "qr/codi"];

const METHOD_COLOR: Record<string, string> = {
  efectivo:  theme.green,
  tarjeta:   theme.blue,
  "transf.": theme.cyan,
  "qr/codi": theme.amber,
};
const METHOD_ICON: Record<string, string> = {
  efectivo:  "◆",
  tarjeta:   "▣",
  "transf.": "⇄",
  "qr/codi": "⊞",
};
const METHOD_DESC: Record<string, string> = {
  efectivo:  "Pago en efectivo",
  tarjeta:   "Débito / Crédito",
  "transf.": "Transferencia SPEI",
  "qr/codi": "CoDi / QR",
};

type Props = {
  active:    boolean;
  marginLeft: number;
  marginTop:  number;
  onConfirm: (method: Method, received: number, change: number, invoiceData?: InvoiceData | null) => void;
  onCancel:  () => void;
};

// ── Sub-componente: separador con título ───────────────────────────────────────
function SectionTitle({ label, color = theme.textDim }: { label: string; color?: string }) {
  return (
    <Box justifyContent="center" marginBottom={1}>
      <Text bold color={color}>{label}</Text>
    </Box>
  );
}

// ── Sub-componente: fila de monto ──────────────────────────────────────────────
function AmountRow({
  label,
  value,
  valueColor = theme.textSec,
  bold = false,
  cursor = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  cursor?: boolean;
}) {
  return (
    <Box justifyContent="space-between" width={40}>
      <Text color={theme.textMuted}>{label}</Text>
      <Text color={valueColor} bold={bold}>
        {value}{cursor ? "▌" : ""}
      </Text>
    </Box>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export function PayModal({ active, marginLeft, marginTop, onConfirm, onCancel }: Props) {
  const { total } = useCart();
  const isWindowActive = useWindowManager(state => state.isWindowActive);

  const [step,       setStep]       = React.useState<PayStep>("method");
  const [cursor,     setCursor]     = React.useState(0);
  const [received,   setReceived]   = React.useState("");
  const [wantInvoice, setWantInvoice] = React.useState(false);
  const [invoiceData, setInvoiceData] = React.useState<InvoiceData | null>(null);
  const [invoiceField, setInvoiceField] = React.useState(0);

  const [invRfc, setInvRfc] = React.useState("");
  const [invRazon, setInvRazon] = React.useState("");
  const [invEmail, setInvEmail] = React.useState("");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Array<{rfc: string; razonSocial: string; email: string | null}>>([]);
  const [searchCursor, setSearchCursor] = React.useState(0);

  const doSearch = React.useCallback((query: string) => {
    const results = listClients(query || undefined);
    setSearchResults(results.slice(0, 8));
    setSearchCursor(0);
  }, []);

  React.useEffect(() => {
    doSearch(searchQuery);
  }, [searchQuery, doSearch]);

  // Window registration and form reset
  React.useEffect(() => {
    if (active) {
      useWindowManager.getState().registerWindow(WINDOW_ID);
      setStep("method");
      setCursor(0);
      setReceived("");
      setWantInvoice(false);
      setInvoiceData(null);
      setInvRfc("");
      setInvRazon("");
      setInvEmail("");
      setInvoiceField(0);
      setSearchQuery("");
      setSearchResults([]);
      setSearchCursor(0);
    }
    return () => {
      useWindowManager.getState().unregisterWindow(WINDOW_ID);
    };
  }, [active]);

  // ── Paste handler (Ctrl+V, Shift+Insert, etc.) ─────────────────────────────
  usePaste((text) => {
    if (!isWindowActive(WINDOW_ID)) return;
    if (step !== "invoice") return;

    const lines = text.trim().split(/\n|,|;/).map((s: string) => s.trim()).filter(Boolean);

    if (lines.length >= 3) {
      setInvRfc(lines[0]!.toUpperCase().slice(0, 14));
      setInvRazon(lines[1]!.toUpperCase().slice(0, 100));
      setInvEmail(lines[2]!.toLowerCase().slice(0, 100));
    } else {
      for (const char of text) {
        if (invoiceField === 0 && /^[A-Za-z0-9]$/.test(char)) {
          setInvRfc(r => (r + char).slice(0, 14));
        } else if (invoiceField === 1 && /^[A-Za-z0-9 ]$/.test(char)) {
          setInvRazon(r => (r + char).slice(0, 100));
        } else if (invoiceField === 2 && /^[A-Za-z0-9@._-]$/.test(char)) {
          setInvEmail(e => (e + char).slice(0, 100));
        }
      }
    }
  });

  useInput(async (input, key) => {
    if (!isWindowActive(WINDOW_ID)) return;

    if (key.tab) {
      if (step === "invoice") {
        setInvoiceField(f => (f + 1) % 3);
      }
      return;
    }

    // ── Paso 1: Selección de método ──────────────────────────────────────────
    if (step === "method") {
      if (input === "i" || input === "I" || input === "f" || input === "F") {
        setWantInvoice(!wantInvoice);
        if (!wantInvoice) {
          setInvRfc("");
          setInvRazon("");
          setInvEmail("");
        } else {
          setSearchQuery("");
          setStep("search");
          return;
        }
        return;
      }
      if (key.upArrow   || input === "1") setCursor(c => Math.max(0, c - 1));
      if (key.downArrow || input === "2") setCursor(c => Math.min(PAY_METHODS.length - 1, c + 1));
      if (key.return || input === "4") {
        const m = PAY_METHODS[cursor]!;
        if (wantInvoice && !invoiceData) {
          setStep("search");
          setSearchQuery("");
          return;
        }
        if (m === "efectivo") { setStep("cash"); setReceived(""); }
        else { onConfirm(m, 0, 0, wantInvoice ? invoiceData : null); }
      }
      if (key.escape) onCancel();
      return;
    }

    // ── Paso 1.3: Buscar cliente ─────────────────────────────────────────────
    if (step === "search") {
      if (key.escape) {
        setWantInvoice(false);
        setStep("method");
        return;
      }
      if (key.upArrow) setSearchCursor(c => Math.max(0, c - 1));
      if (key.downArrow) setSearchCursor(c => Math.min(searchResults.length - 1, c + 1));
      if (key.return || input === "4") {
        const client = searchResults[searchCursor];
        if (client) {
          setInvRfc(client.rfc);
          setInvRazon(client.razonSocial);
          setInvEmail(client.email || "");
          setStep("invoice");
          setInvoiceField(0);
        }
        return;
      }
      if (input === "c" || input === "C") {
        setStep("invoice");
        setInvoiceField(0);
        return;
      }
      if (/^[A-Za-z0-9 ]$/.test(input)) {
        setSearchQuery(q => q + input);
        return;
      }
      if (input === "3" || key.backspace) {
        setSearchQuery(q => q.slice(0, -1));
        return;
      }
      return;
    }

    // ── Paso 1.5: Datos de factura ───────────────────────────────────────────
    if (step === "invoice") {
      if (key.escape) {
        setWantInvoice(false);
        setInvoiceData(null);
        setStep("method");
        return;
      }
      if (key.return || input === "4") {
        const finalRfc = invRfc.trim() || "XAXX010101000";
        const finalRazon = invRazon.trim() || "PÚBLICO EN GENERAL";
        const finalEmail = invEmail.trim() || "";
        const data: InvoiceData = {
          rfc: finalRfc.toUpperCase(),
          razonSocial: finalRazon.toUpperCase(),
          email: finalEmail.toLowerCase(),
          usoCfdi: "G01",
        };
        setInvoiceData(data);
        const m = PAY_METHODS[cursor]!;
        if (m === "efectivo") { setStep("cash"); setReceived(""); }
        else { onConfirm(m, 0, 0, data); }
        return;
      }
      if (key.upArrow) setInvoiceField(f => Math.max(0, f - 1));
      if (key.downArrow) setInvoiceField(f => Math.min(2, f + 1));
      if (invoiceField === 0 && /^[A-Za-z0-9]$/.test(input)) {
        setInvRfc(r => (r + input).slice(0, 14));
      } else if (invoiceField === 1 && /^[A-Za-z0-9 ]$/.test(input)) {
        setInvRazon(r => (r + input).slice(0, 100));
      } else if (invoiceField === 2 && /^[A-Za-z0-9@._-]$/.test(input)) {
        setInvEmail(e => (e + input).slice(0, 100));
      }
      if (input === "3" || key.backspace) {
        if (invoiceField === 0) setInvRfc(r => r.slice(0, -1));
        if (invoiceField === 1) setInvRazon(r => r.slice(0, -1));
        if (invoiceField === 2) setInvEmail(e => e.slice(0, -1));
      }
      return;
    }

    // ── Paso 2: Ingreso de efectivo ──────────────────────────────────────────
    if (step === "cash") {
      if (/^[0-9]$/.test(input))           { setReceived(r => r + input); return; }
      if (input === "3" || key.backspace)   { setReceived(r => r.slice(0, -1)); return; }
      if (key.return || input === "4") {
        const rec = parseFloat(received) || 0;
        const tot = total();
        if (rec >= tot) setStep("change");
        // si falta dinero no avanza — el error visual lo indica
        return;
      }
      if (key.escape) { setStep("method"); setReceived(""); }
      return;
    }

    // ── Paso 3: Confirmar cambio ─────────────────────────────────────────────
    if (step === "change") {
      if (key.return || input === "4" || input === "s") {
        const rec = parseFloat(received) || 0;
        const tot = total();
        onConfirm("efectivo", rec, Math.max(0, rec - tot), wantInvoice ? invoiceData : null);
        setStep("method");
        setReceived("");
        return;
      }
      if (key.escape) setStep("cash");
      return;
    }
  });

  if (!active) return null;

  const tot      = total();
  const rec      = parseFloat(received) || 0;
  const falta    = Math.max(0, tot - rec);
  const cambio   = Math.max(0, rec - tot);
  const ready    = rec >= tot;
  const method   = PAY_METHODS[cursor]!;
  const methCol  = METHOD_COLOR[method]!;

  // ── Título dinámico ──────────────────────────────────────────────────────────
  const TITLES: Record<PayStep, string> = {
    method:  "━━  MÉTODO DE PAGO  ━━",
    search:  "━━  BUSCAR CLIENTE  ━━",
    invoice: "━━  DATOS FACTURA  ━━",
    cash:   "━━  INGRESO EFECTIVO  ━━",
    change: "━━  CONFIRMAR VENTA  ━━",
  };

  // Color del borde según paso/estado
  const borderColor =
    step === "change" ? theme.green
    : step === "cash" && ready ? theme.green
    : step === "cash" ? theme.amber
    : methCol;

  const MODAL_WIDTH = 52;
  const MODAL_HEIGHT = 30;

  return (
    <Box
      position="absolute"
      marginLeft={marginLeft}
      marginTop={marginTop}
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      backgroundColor={theme.bgPanel}
      width={MODAL_WIDTH}
      height={MODAL_HEIGHT}
      paddingX={2}
      paddingY={1}
    >
      {/* ── Título ────────────────────────────────────────────────────────── */}
      <SectionTitle label={TITLES[step]} color={borderColor} />

      {/* ── Contenido principal (crece para llenar espacio) ───────────────── */}
      <Box flexDirection="column" flexGrow={1} gap={0}>

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 1 — Selección de método
         ══════════════════════════════════════════════════════════════════════ */}
      {step === "method" && (
        <Box flexDirection="column" gap={0}>

          {/* Total a cobrar */}
          <Box justifyContent="center" marginBottom={1}>
            <Text color={theme.textMuted}>Total a cobrar  </Text>
            <Text bold color={theme.white}>{fmt.money(tot)}</Text>
          </Box>

          {/* Toggle Facturar */}
          <Box
            width={40}
            paddingX={1}
            marginBottom={1}
            borderStyle={wantInvoice ? "single" : undefined}
            borderColor={wantInvoice ? theme.blue : undefined}
          >
            <Text color={wantInvoice ? theme.blue : theme.textMuted} bold={wantInvoice}>
              {wantInvoice ? "▸" : "  "}☑ FACTURAR CFDI 4.0
            </Text>
          </Box>

          {/* Opciones de método */}
          {PAY_METHODS.map((m, i) => {
            const sel  = i === cursor;
            const col  = METHOD_COLOR[m]!;
            const ico  = METHOD_ICON[m]!;
            const desc = METHOD_DESC[m]!;
            return (
              <Box
                key={m}
                width={40}
                paddingX={1}
                marginBottom={0}
                borderStyle={sel ? "single" : undefined}
                borderColor={sel ? col : undefined}
              >
                <Box flexDirection="row" gap={2} width={36}>
                  <Text color={sel ? col : theme.textDim} bold={sel}>
                    {sel ? "▸" : " "}{ico}
                  </Text>
                  <Box flexDirection="column">
                    <Text color={sel ? col : theme.textMuted} bold={sel}>
                      {m.toUpperCase()}
                    </Text>
                    <Text color={sel ? theme.textMuted : theme.textDim}>
                      {desc}
                    </Text>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 1.3 — Buscar cliente
         ══════════════════════════════════════════════════════════════════════ */}
      {step === "search" && (
        <Box flexDirection="column" gap={0}>
          <Text color={theme.textMuted} bold>Buscar por RFC o razón social:</Text>
          
          <Box marginTop={1} paddingX={1} borderStyle="single" borderColor={theme.blue}>
            <Text color={theme.blue}>▸ {searchQuery}</Text>
            <Text color={theme.blue}>▌</Text>
          </Box>

          <Box flexDirection="column" marginTop={1} gap={0}>
            {searchResults.length === 0 ? (
              <Text color={theme.textDim}>Sin resultados (C: crear nuevo)</Text>
            ) : (
              searchResults.map((client, i) => (
                <Box
                  key={client.rfc}
                  width={48}
                  paddingX={1}
                  borderStyle={searchCursor === i ? "single" : undefined}
                  borderColor={searchCursor === i ? theme.green : undefined}
                >
                  <Box width={20}>
                    <Text color={searchCursor === i ? theme.green : theme.textMuted}>
                      {searchCursor === i ? "▸ " : "  "}{client.rfc}
                    </Text>
                  </Box>
                  <Text color={searchCursor === i ? theme.white : theme.textSec}>
                    {client.razonSocial.slice(0, 28)}
                  </Text>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 1.5 — Datos de factura
         ══════════════════════════════════════════════════════════════════════ */}
      {step === "invoice" && (
        <Box flexDirection="column" gap={0}>

          <Text color={theme.textMuted}>Presiona ENTER cuando completes</Text>

          <Box marginTop={1}>
            <Text color={invoiceField === 0 ? theme.blue : theme.textMuted}>
              {invoiceField === 0 ? "▸" : " "}RFC:
            </Text>
            <Text> {invRfc}</Text>
            {invoiceField === 0 && <Text color={theme.blue}>▌</Text>}
          </Box>

          <Box>
            <Text color={invoiceField === 1 ? theme.blue : theme.textMuted}>
              {invoiceField === 1 ? "▸" : " "}Nombre/Razón Social:
            </Text>
            <Text> {invRazon}</Text>
            {invoiceField === 1 && <Text color={theme.blue}>▌</Text>}
          </Box>

          <Box>
            <Text color={invoiceField === 2 ? theme.blue : theme.textMuted}>
              {invoiceField === 2 ? "▸" : " "}Email:
            </Text>
            <Text> {invEmail}</Text>
            {invoiceField === 2 && <Text color={theme.blue}>▌</Text>}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 2 — Ingreso de efectivo
         ══════════════════════════════════════════════════════════════════════ */}
      {step === "cash" && (
        <Box flexDirection="column" gap={0}>

          {/* Montos */}
          <AmountRow label="Total:"    value={fmt.money(tot)} valueColor={theme.white} bold />
          <AmountRow
            label="Recibido:"
            value={fmt.money(rec)}
            valueColor={ready ? theme.green : theme.amber}
            bold
            cursor={!!received || !ready}
          />
          <Box paddingY={0}>
            <Text color={theme.textDim}>{"─".repeat(30)}</Text>
          </Box>
          <AmountRow
            label={ready ? "Cambio:" : "Falta:"}
            value={ready ? fmt.money(cambio) : fmt.money(falta)}
            valueColor={ready ? theme.green : theme.red}
            bold
          />

          {/* Numberpad visual */}
          <Box flexDirection="column" marginTop={1} alignItems="center" gap={0}>
            {[["1","2","3"],["4","5","6"],["7","8","9"],["←","0","✓"]].map((row, ri) => (
              <Box key={ri} flexDirection="row" gap={1}>
                {row.map(k => {
                  const isBack  = k === "←";
                  const isOk    = k === "✓";
                  const litBack = isBack && received.length > 0;
                  const litOk   = isOk && ready;
                  const lit     = litBack || litOk || (!isBack && !isOk);
                  const col     = isOk && ready   ? theme.green
                                : isBack && litBack ? theme.amber
                                : isOk            ? theme.textDim
                                : theme.textMuted;
                  return (
                    <Box
                      key={k}
                      width={7}
                      justifyContent="center"
                      borderStyle="single"
                      borderColor={litOk ? theme.green : litBack ? theme.amber : theme.textDim}
                    >
                      <Text color={col} bold={litOk || litBack}>{k}</Text>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 3 — Confirmar cambio
         ══════════════════════════════════════════════════════════════════════ */}
      {step === "change" && (
        <Box flexDirection="column" gap={0}>

          {/* Resumen */}
          <AmountRow label="Total:"     value={fmt.money(tot)} valueColor={theme.white} bold />
          <AmountRow label="Recibido:"  value={fmt.money(rec)} valueColor={theme.textSec} />
          <Box>
            <Text color={theme.textDim}>{"─".repeat(40)}</Text>
          </Box>

          {/* Cambio destacado */}
          <Box
            justifyContent="space-between"
            width={40}
            borderStyle="single"
            borderColor={theme.green}
            paddingX={1}
            marginTop={0}
          >
            <Text bold color={theme.green}>Cambio:</Text>
            <Text bold color={theme.greenBr}>{fmt.money(cambio)}</Text>
          </Box>

          {/* Botón confirmar */}
          <Box justifyContent="center" marginTop={1}>
            <Text bold color={theme.green}>{"[ Enter ]  Confirmar venta  ✓"}</Text>
          </Box>
        </Box>
      )}

      </Box>

      {/* ── Hints al bottom ───────────────────────────────────────────────────── */}
      <Box justifyContent="center">
        <Text color={theme.textDim}>
          {step === "method" && "I facturar · ↑↓ elegir · Enter confirmar · Esc"}
          {step === "search" && "↑↓ sel · Ent elegir · C nuevo · Esc"}
          {step === "invoice" && "↑↓ campo · TAB sig · Esc"}
          {step === "cash" && "0-9 monto · ← borrar · Enter"}
          {step === "change" && "Enter/S confirmar · Esc"}
        </Text>
      </Box>

    </Box>
  );
}