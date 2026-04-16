import React from "react";
import { Box, Text, useInput } from "ink";
import { db, sales, BgBox, theme, fmt, printTicket, type TicketData, type Sale, useWindowManager } from "@openpos/shared";

const WINDOW_ID = "reports-screen";

// ── Tipos ────────────────────────────────────────────────────────────────────
type ReportType = "day" | "method" | "products" | "hour";

type Props = {
  rows:   number;
  cols:   number;
  active: boolean;
  onClose: () => void;
};

// ── Constantes visuales ──────────────────────────────────────────────────────
const REPORT_TABS: { type: ReportType; label: string; key: string; icon: string; color: string }[] = [
  { type: "day",      label: "Resumen día",   key: "1", icon: "◈", color: theme.green  },
  { type: "method",   label: "Por método",    key: "2", icon: "▣", color: theme.blue   },
  { type: "products", label: "Productos",     key: "3", icon: "◆", color: theme.amber  },
  { type: "hour",     label: "Por hora",      key: "4", icon: "◉", color: theme.cyan   },
];

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

// Barra ASCII proporcional con ancho fijo
function Bar(props: { value: number; max: number; width: number; color: string }) {
  const { value, max, width, color } = props;
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  const empty  = width - filled;
  return (
    <Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text color={theme.textDim}>{"░".repeat(empty)}</Text>
    </Text>
  );
}

// Fila de stat con label + valor alineados en ancho fijo
function StatRow(props: { label: string; value: string; labelColor?: string; valueColor?: string; width?: number }) {
  const w      = props.width ?? 36;
  const label  = props.label;
  const value  = props.value;
  const gap    = Math.max(1, w - label.length - value.length);
  return (
    <Text>
      <Text color={props.labelColor ?? theme.textMuted}>{label}</Text>
      <Text color={theme.textDim}>{" ".repeat(gap)}</Text>
      <Text color={props.valueColor ?? theme.white} bold>{value}</Text>
    </Text>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export function ReportsScreen({ rows, cols, active, onClose }: Props) {
  const isWindowActive = useWindowManager(state => state.isWindowActive);
  const [reportType,  setReportType]  = React.useState<ReportType>("day");
  const [reportData,  setReportData]  = React.useState<any>(null);
  const [printStatus, setPrintStatus] = React.useState<"idle" | "printing" | "done" | "error">("idle");

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const loadReport = React.useCallback(() => {
    const today    = new Date().toISOString().split("T")[0]!;
    const allSales = db.select().from(sales).all();

    if (reportType === "day") {
      const daySales   = allSales.filter((s: Sale) => s.createdAt.startsWith(today) && s.status === "completed");
      const totalSales = daySales.reduce((sum: number, s: Sale) => sum + s.total,     0);
      const totalItems = daySales.reduce((sum: number, s: Sale) => sum + s.itemCount, 0);
      const totalTax   = daySales.reduce((sum: number, s: Sale) => sum + s.tax,       0);
      const byMethod: Record<string, { count: number; total: number }> = {};
      for (const s of daySales) {
        if (!byMethod[s.method]) byMethod[s.method] = { count: 0, total: 0 };
        byMethod[s.method]!.count++;
        byMethod[s.method]!.total += s.total;
      }
      setReportData({ daySales, totalSales, totalItems, totalTax, byMethod, ticketCount: daySales.length });
    }

    if (reportType === "method") {
      const byMethod: Record<string, { count: number; total: number }> = {};
      for (const s of allSales.filter((s: Sale) => s.status === "completed")) {
        if (!byMethod[s.method]) byMethod[s.method] = { count: 0, total: 0 };
        byMethod[s.method]!.count++;
        byMethod[s.method]!.total += s.total;
      }
      const totalSales = Object.values(byMethod).reduce((sum, m) => sum + m.total, 0);
      setReportData({ byMethod, totalSales });
    }

    if (reportType === "products") {
      const productMap: Record<string, { name: string; category: string; qty: number; total: number }> = {};
      for (const s of allSales.filter((s: Sale) => s.status === "completed")) {
        const items = JSON.parse(s.items);
        for (const item of items) {
          if (!productMap[item.sku])
            productMap[item.sku] = { name: item.name, category: item.category || "GEN", qty: 0, total: 0 };
          productMap[item.sku]!.qty   += item.qty;
          productMap[item.sku]!.total += item.price * item.qty;
        }
      }
      const sorted = Object.entries(productMap)
        .map(([sku, data]) => ({ sku, ...data }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);
      setReportData({ products: sorted, totalRevenue: sorted.reduce((sum, p) => sum + p.total, 0) });
    }

    if (reportType === "hour") {
      const today    = new Date().toISOString().split("T")[0]!;
      const hourMap: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourMap[i] = 0;
      for (const s of allSales.filter((s: Sale) => s.status === "completed" && s.createdAt.startsWith(today))) {
        const hour = new Date(s.createdAt).getHours();
        hourMap[hour] = (hourMap[hour] ?? 0) + s.total;
      }
      const byHour  = Object.entries(hourMap).map(([h, v]) => ({ hour: parseInt(h), total: v }));
      const maxHour = byHour.reduce((mx, h) => h.total > mx.total ? h : mx, { hour: 0, total: 0 });
      setReportData({ byHour, maxHour });
    }
  }, [reportType]);

  // Window registration and data loading
  React.useEffect(() => {
    if (active) {
      useWindowManager.getState().registerWindow(WINDOW_ID);
      loadReport();
      setPrintStatus("idle");
    }
    return () => {
      useWindowManager.getState().unregisterWindow(WINDOW_ID);
    };
  }, [active, reportType, loadReport]);

  // ── Imprimir reporte ───────────────────────────────────────────────────────
  function handlePrint() {
    if (!reportData || printStatus === "printing") return;
    setPrintStatus("printing");

    const today = new Date().toLocaleDateString("es-MX", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const now = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

    // Construimos el reporte como un ticket especial de solo texto
    // Reutilizamos printTicket enviando los datos como "items" de texto
    const titleMap: Record<ReportType, string> = {
      day:      "REPORTE DEL DÍA",
      method:   "VENTAS POR MÉTODO",
      products: "PRODUCTOS MÁS VENDIDOS",
      hour:     "VENTAS POR HORA",
    };

    // Líneas del reporte según tipo
    const lines: Array<{ sku: string; name: string; price: number; qty: number; unitType: string }> = [];

    if (reportType === "day") {
      lines.push(
        { sku: "─", name: `Fecha: ${today}`, price: 0, qty: 0, unitType: "" },
        { sku: " ", name: `Tickets emitidos: ${reportData.ticketCount}`,    price: 0, qty: 0, unitType: "" },
        { sku: " ", name: `Items vendidos:   ${reportData.totalItems}`,     price: 0, qty: 0, unitType: "" },
        { sku: "─", name: "TOTALES",                                        price: 0, qty: 0, unitType: "" },
        { sku: " ", name: `Subtotal: ${fmt.money(reportData.totalSales - reportData.totalTax)}`, price: 0, qty: 0, unitType: "" },
        { sku: " ", name: `IVA 16%:  ${fmt.money(reportData.totalTax)}`,   price: 0, qty: 0, unitType: "" },
        { sku: "─", name: "POR MÉTODO DE PAGO",                             price: 0, qty: 0, unitType: "" },
        ...Object.entries(reportData.byMethod || {}).map(([m, d]: [string, any]) => ({
          sku: " ", name: `${m}: ${d.count} tickets - ${fmt.money(d.total)}`, price: 0, qty: 0, unitType: "",
        })),
      );
    }

    if (reportType === "method") {
      lines.push(
        { sku: "─", name: "TODOS LOS MÉTODOS", price: 0, qty: 0, unitType: "" },
        ...Object.entries(reportData.byMethod || {}).map(([m, d]: [string, any]) => ({
          sku: " ", name: `${m}: ${d.count} tickets`, price: d.total, qty: 1, unitType: "",
        })),
      );
    }

    if (reportType === "products") {
      lines.push(
        { sku: "─", name: "TOP 10 PRODUCTOS", price: 0, qty: 0, unitType: "" },
        ...(reportData.products || []).map((p: any, i: number) => ({
          sku: `${i + 1}.`, name: p.name, price: p.total, qty: p.qty, unitType: "pza",
        })),
      );
    }

    if (reportType === "hour") {
      lines.push(
        { sku: "─", name: `Hora pico: ${reportData.maxHour?.hour || 0}:00`, price: 0, qty: 0, unitType: "" },
        ...(reportData.byHour || [])
          .filter((h: any) => h.total > 0)
          .map((h: any) => ({
            sku: `${String(h.hour).padStart(2, "0")}h`, name: "ventas", price: h.total, qty: 1, unitType: "",
          })),
      );
    }

    const ticketData: TicketData = {
      ticket:   `RPT-${Date.now()}`,
      date:     `${today} ${now}`,
      employee: "Sistema",
      items:    lines,
      subtotal: reportType === "day" ? (reportData.totalSales - reportData.totalTax) : 0,
      tax:      reportType === "day" ? reportData.totalTax : 0,
      discount: 0,
      total:    reportType === "day" ? reportData.totalSales
              : reportType === "method" ? reportData.totalSales
              : reportType === "products" ? reportData.totalRevenue
              : 0,
      received: 0,
      change:   0,
      method:   "reporte" as any,
      width:    48,
    };

    printTicket(ticketData)
      .then(() => { setPrintStatus("done"); setTimeout(() => setPrintStatus("idle"), 3000); })
      .catch(() => { setPrintStatus("error"); setTimeout(() => setPrintStatus("idle"), 3000); });
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  useInput((input, key) => {
    if (!isWindowActive(WINDOW_ID)) return;
    if (key.escape || (input === "q" && key.ctrl)) { onClose(); return; }
    if (input === "1") setReportType("day");
    if (input === "2") setReportType("method");
    if (input === "3") setReportType("products");
    if (input === "4") setReportType("hour");
    if (input === "p") handlePrint();
    if (input === "r") loadReport();
  });

  if (!isWindowActive(WINDOW_ID) || !reportData) return null;

  // ── Dimensiones del modal ──────────────────────────────────────────────────
  const W = Math.floor(cols * 0.65);        // 65% del ancho
  const H = Math.floor(rows * 0.78);         // 78% del alto
  const INNER = W - 4;                         // ancho interior (paddingX=2)
  const BAR_W = Math.max(16, Math.floor(INNER * 0.45));
  const MARGIN_TOP = Math.floor((rows - H) / 2);
  const MARGIN_LEFT = Math.floor((cols - W) / 2);

  const activeTab = REPORT_TABS.find(t => t.type === reportType)!;

  return (
    <Box
      position="absolute"
      marginLeft={MARGIN_LEFT}
      marginTop={MARGIN_TOP}
      flexDirection="column"
      borderStyle="round"
      borderColor={activeTab.color}
      backgroundColor={theme.bgPanel}
      width={W}
      height={H}
      paddingX={2}
      paddingY={1}
    >

      {/* ── Título ────────────────────────────────────────────────────── */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={1}>
          <Text color={activeTab.color} bold>{activeTab.icon}</Text>
          <Text color={theme.white} bold>
            {REPORT_TABS.find(t => t.type === reportType)?.label.toUpperCase()}
          </Text>
        </Box>
        <Text color={theme.textMuted}>
          {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
        </Text>
      </Box>

      {/* ── Tabs de navegación ────────────────────────────────────────── */}
      <Box flexDirection="row" gap={1} marginBottom={1}>
        {REPORT_TABS.map(tab => {
          const sel = tab.type === reportType;
          return (
            <Box
              key={tab.type}
              borderStyle={sel ? "single" : undefined}
              borderColor={sel ? tab.color : undefined}
              paddingX={sel ? 1 : 0}
            >
              <Text color={sel ? tab.color : theme.textDim} bold={sel}>
                {tab.key}{sel ? " " : "·"}{tab.icon}
              </Text>
            </Box>
          );
        })}
        <Box flexGrow={1} />
        <Text color={theme.textDim}>
          <Text color={theme.textMuted}>R</Text> recargar
        </Text>
      </Box>

      <Text color={theme.textDim}>{"─".repeat(INNER)}</Text>

      {/* ══════════════════════════════════════════════════════════════
          REPORTE: DÍA
      ══════════════════════════════════════════════════════════════ */}
      {reportType === "day" && (
        <Box flexDirection="column" gap={0}>

          {/* KPIs principales */}
          <Box flexDirection="row" gap={2} marginTop={1}>
            <Box flexDirection="column" borderStyle="single" borderColor={theme.green} paddingX={2} paddingY={0} width={15}>
              <Text color={theme.textMuted}>Tickets</Text>
              <Text color={theme.green} bold>{reportData.ticketCount}</Text>
            </Box>
            <Box flexDirection="column" borderStyle="single" borderColor={theme.blue} paddingX={2} paddingY={0} width={15}>
              <Text color={theme.textMuted}>Items</Text>
              <Text color={theme.blue} bold>{reportData.totalItems}</Text>
            </Box>
            <Box flexDirection="column" borderStyle="single" borderColor={theme.amber} paddingX={2} paddingY={0} width={16}>
              <Text color={theme.textMuted}>Promedio</Text>
              <Text color={theme.amber} bold>
                {fmt.money(reportData.ticketCount > 0 ? reportData.totalSales / reportData.ticketCount : 0)}
              </Text>
            </Box>
          </Box>

          {/* Totales */}
          <Box flexDirection="column" marginTop={1}>
            <StatRow label="Subtotal"  value={fmt.money(reportData.totalSales - reportData.totalTax)} width={INNER} />
            <StatRow label="IVA 16%"   value={fmt.money(reportData.totalTax)}  labelColor={theme.textDim} valueColor={theme.textSec} width={INNER} />
            <Text color={theme.textDim}>{"─".repeat(INNER)}</Text>
            <StatRow label="TOTAL DÍA" value={fmt.money(reportData.totalSales)} labelColor={theme.green} valueColor={theme.green} width={INNER} />
          </Box>

          {/* Por método con barra visual */}
          <Box marginTop={1}>
            <Text color={theme.amber} bold>Desglose por método</Text>
          </Box>
          {Object.entries(reportData.byMethod || {}).map(([m, data]: [string, any]) => {
            const col  = METHOD_COLOR[m] ?? theme.textSec;
            const ico  = METHOD_ICON[m]  ?? "○";
            const pct  = reportData.totalSales > 0 ? Math.round((data.total / reportData.totalSales) * 100) : 0;
            return (
              <Box key={m} flexDirection="column">
                <Box justifyContent="space-between">
                  <Box gap={1}>
                    <Text color={col}>{ico}</Text>
                    <Text color={col} bold>{m}</Text>
                    <Text color={theme.textDim}>({data.count} tkts)</Text>
                  </Box>
                  <Box gap={1}>
                    <Text color={theme.textMuted}>{pct}%</Text>
                    <Text color={theme.white} bold>{fmt.money(data.total)}</Text>
                  </Box>
                </Box>
                <Box paddingLeft={2}>
                  <Bar value={data.total} max={reportData.totalSales} width={BAR_W} color={col} />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════
          REPORTE: MÉTODO
      ══════════════════════════════════════════════════════════════ */}
      {reportType === "method" && (
        <Box flexDirection="column" gap={0}>
          <Box marginTop={1} marginBottom={1}>
            <StatRow label="Total general" value={fmt.money(reportData.totalSales)} labelColor={theme.blue} valueColor={theme.white} width={INNER} />
          </Box>

          {Object.entries(reportData.byMethod || {}).map(([m, data]: [string, any]) => {
            const col = METHOD_COLOR[m] ?? theme.textSec;
            const ico = METHOD_ICON[m]  ?? "○";
            const pct = reportData.totalSales > 0 ? Math.round((data.total / reportData.totalSales) * 100) : 0;
            const barFull = Math.round((pct / 100) * (INNER - 8));
            return (
              <Box key={m} flexDirection="column" marginBottom={1}>
                {/* Label row */}
                <Box justifyContent="space-between">
                  <Box gap={1}>
                    <Text color={col} bold>{ico} {m.toUpperCase()}</Text>
                    <Text color={theme.textDim}>{data.count} ventas</Text>
                  </Box>
                  <Box gap={1}>
                    <Text color={theme.textMuted}>{pct}%</Text>
                    <Text color={col} bold>{fmt.money(data.total)}</Text>
                  </Box>
                </Box>
                {/* Barra ancha */}
                <Box>
                  <Text color={col}>{"█".repeat(barFull)}</Text>
                  <Text color={theme.bgDim}>{"█".repeat(Math.max(0, INNER - 8 - barFull))}</Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════
          REPORTE: PRODUCTOS
      ══════════════════════════════════════════════════════════════ */}
      {reportType === "products" && (
        <Box flexDirection="column" gap={0}>
          <Box marginTop={1} marginBottom={1} justifyContent="space-between">
            <Text color={theme.amber} bold>Top {(reportData.products || []).length} productos</Text>
            <Text color={theme.textMuted}>Ingresos: <Text color={theme.white} bold>{fmt.money(reportData.totalRevenue)}</Text></Text>
          </Box>

          {/* Header tabla */}
          <Box>
            <Text color={theme.textDim}>
              {"#  "}{" Producto           "}{" Cant  "}{" Total  "}
            </Text>
          </Box>
          <Text color={theme.textDim}>{"─".repeat(INNER)}</Text>

          {(reportData.products || []).map((p: any, i: number) => {
            const maxQty = reportData.products[0]?.qty || 1;
            const barLen = Math.round((p.qty / maxQty) * 10);
            const rankColor = i === 0 ? theme.amber : i === 1 ? theme.textSec : i === 2 ? theme.orange : theme.textMuted;
            return (
              <Box key={p.sku} flexDirection="column">
                <Box>
                  <Text color={rankColor} bold>{String(i + 1).padStart(2)} </Text>
                  <Text color={i < 3 ? theme.white : theme.textPri}>
                    {(p.name || "").substring(0, 18).padEnd(19)}
                  </Text>
                  <Text color={theme.textSec}>{"×" + (p.qty || 0).toFixed(1).padStart(5) + "  "}</Text>
                  <Text color={i < 3 ? theme.amber : theme.textSec} bold>{fmt.money(p.total)}</Text>
                </Box>
                <Box paddingLeft={3}>
                  <Text color={rankColor}>{"▬".repeat(barLen)}</Text>
                  <Text color={theme.textDim}>{"▬".repeat(10 - barLen)}</Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════
          REPORTE: HORA
      ══════════════════════════════════════════════════════════════ */}
      {reportType === "hour" && (
        <Box flexDirection="column" gap={0}>
          {(() => {
            const activeHours = (reportData.byHour || []).filter((h: any) => h.total > 0);
            const maxVal      = reportData.maxHour?.total || 1;
            const totalDay    = activeHours.reduce((s: number, h: any) => s + h.total, 0);

            return (
              <>
                <Box marginTop={1} marginBottom={1} justifyContent="space-between">
                  <Box gap={1}>
                    <Text color={theme.cyan} bold>◉</Text>
                    <Text color={theme.textMuted}>Hora pico:</Text>
                    <Text color={theme.cyan} bold>{String(reportData.maxHour?.hour || 0).padStart(2, "0")}:00</Text>
                    <Text color={theme.textSec}>{fmt.money(maxVal)}</Text>
                  </Box>
                  <Text color={theme.textMuted}>Total: <Text color={theme.white} bold>{fmt.money(totalDay)}</Text></Text>
                </Box>

                <Text color={theme.textDim}>{"─".repeat(INNER)}</Text>

                {activeHours.map((h: any) => {
                  const isPeak = h.hour === reportData.maxHour?.hour;
                  const col    = isPeak ? theme.cyan : h.total > maxVal * 0.5 ? theme.green : theme.textSec;
                  const barLen = Math.round((h.total / maxVal) * BAR_W);
                  const pct    = totalDay > 0 ? Math.round((h.total / totalDay) * 100) : 0;
                  return (
                    <Box key={h.hour} gap={1}>
                      <Text color={isPeak ? theme.cyan : theme.textMuted}>
                        {String(h.hour).padStart(2, "0")}:00
                      </Text>
                      <Bar value={h.total} max={maxVal} width={BAR_W} color={col} />
                      <Text color={theme.textDim}>{String(pct).padStart(3)}%</Text>
                      <Text color={col} bold>{fmt.money(h.total)}</Text>
                      {isPeak && <Text color={theme.cyan}>◀ pico</Text>}
                    </Box>
                  );
                })}

                {activeHours.length === 0 && (
                  <Text color={theme.textMuted}>Sin ventas registradas hoy.</Text>
                )}
              </>
            );
          })()}
        </Box>
      )}

      {/* ── Separador y acciones ──────────────────────────────────────── */}
      <Text color={theme.textDim}>{"─".repeat(INNER)}</Text>

      <Box justifyContent="space-between" marginTop={1}>
        {/* Botón imprimir */}
        <Box
          borderStyle="single"
          borderColor={
            printStatus === "done"     ? theme.green :
            printStatus === "error"    ? theme.red   :
            printStatus === "printing" ? theme.amber :
            theme.textMuted
          }
          paddingX={1}
        >
          <Text
            color={
              printStatus === "done"     ? theme.green :
              printStatus === "error"    ? theme.red   :
              printStatus === "printing" ? theme.amber :
              theme.textMuted
            }
            bold={printStatus !== "idle"}
          >
            {printStatus === "idle"     && "[ P ] Imprimir reporte"}
            {printStatus === "printing" && "⟳  Imprimiendo..."}
            {printStatus === "done"     && "✓  Impreso correctamente"}
            {printStatus === "error"    && "✗  Error al imprimir"}
          </Text>
        </Box>

        {/* Cerrar */}
        <Text color={theme.textMuted}>
          <Text color={theme.red}>Esc</Text>
          {" cerrar"}
        </Text>
      </Box>

    </Box>
  );
}