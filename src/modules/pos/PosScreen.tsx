import React from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { db, initDb } from "../../db/client.js";
import { products as productsTable, sales } from "../../db/schema.js";
import { sql } from "drizzle-orm";
import type { Product } from "../../db/schema.js";
import { useCart } from "../../store/cart.js";
import { useAuth } from "../../store/auth.js";
import { ProductGrid } from "./components/ProductGrid.js";
import { Ticket } from "./components/Ticket.js";
import { ReportsScreen } from "./ReportsScreen.js";
import { BgBox } from "../../shared/components/BgBox.js";
import { theme, fmt } from "../../shared/theme.js";
import { printTicket, type TicketData } from "../../utils/printer/index.js";
import { PayModal, type Method } from "./components/PayModal.js";
import { useLayout, TooSmallOverlay } from "../../shared/useLayout.js";

type PanelType = "search" | "grid" | "ticket" | "pay" | "reports";

export function PosScreen({ onLogout }: { onLogout?: () => void }) {
  const { exit }  = useApp();
  const layout    = useLayout();
  const { add, nextTicket, total, ticketNum, items } = useCart();
  const { user }  = useAuth();

  const {
    cols, rows,
    ticketW, gridW, gridCols, itemH, divW,
    headerH, searchH, footerH, subHdrH, hintsH,
    mainH, gridH,
  } = layout;

  const [products,    setProducts]    = React.useState<Product[]>([]);
  const [query,       setQuery]       = React.useState("");
  const [activePanel, setActivePanel] = React.useState<PanelType>("search");
  const [lastMsg,     setLastMsg]     = React.useState("");
  const [time,        setTime]        = React.useState("");
  const [barcode,     setBarcode]     = React.useState("");

  // ── Clock ─────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const tick = () => setTime(
      new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Load products ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    initDb();
    setProducts(db.select().from(productsTable).all());
  }, []);

  // ── Input handling ────────────────────────────────────────────────────────
  useInput((input, key) => {
    // Barcode scanner (numpad while grid is active)
    if (activePanel === "grid" && key.return && barcode.length >= 4) {
      const qtyMatch = barcode.match(/^(\d+)[*\s](.+)$/);
      const qty  = qtyMatch ? parseInt(qtyMatch[1]!) : 1;
      const code = qtyMatch ? qtyMatch[2]!.trim() : barcode.trim();
      const product = products.find(p => p.barcode === code || p.sku === code);
      if (product) {
        if (product.active === 0) {
          setLastMsg(`x "${product.name}" esta inactivo`);
        } else if (product.stock < qty) {
          setLastMsg(`x Stock insuficiente (disponible: ${product.stock})`);
        } else {
          for (let i = 0; i < qty; i++) add(product);
          const unitLabel = product.unitType === "pza" ? "pza" : product.unitType;
          const qtyStr    = qty > 1 ? `${qty}x ` : "";
          setLastMsg(`v ${qtyStr}${product.name.substring(0, 12)} ${unitLabel} $${product.price}`);
        }
      } else {
        setLastMsg(`x Codigo "${code}" no encontrado`);
      }
      setBarcode("");
      return;
    }

    if (activePanel === "grid" && /^[0-9* ]$/.test(input)) {
      setBarcode(b => b + input);
      return;
    }

    // Global navigation
    if (key.tab) {
      setActivePanel(p => (p === "search" || p === "grid") ? "ticket" : "grid");
      return;
    }
    if (key.escape && activePanel === "ticket")                           { setActivePanel("grid");    return; }
    if (input === "/" && activePanel !== "search")                        { setActivePanel("search");  return; }
    if (input === "r" && activePanel !== "pay" && activePanel !== "reports") { setActivePanel("reports"); return; }
    if (input === "l")                                                    { if (onLogout) onLogout();  return; }
    if (input === "q" && key.ctrl) exit();
  });

  // ── Confirm payment ───────────────────────────────────────────────────────
  function confirmPay(method: Method, receivedVal = 0, changeVal = 0) {
    const cartState = useCart.getState();
    const cartItems = cartState.items;
    if (cartItems.length === 0) { setLastMsg("x Carrito vacio"); return; }

    const t        = cartState.total();
    const sub      = cartState.subtotal();
    const taxVal   = t - sub;
    const tno      = fmt.ticket(ticketNum);
    const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

    db.insert(sales).values({
      ticket:    tno,
      subtotal:  sub,
      tax:       taxVal,
      discount:  0,
      total:     t,
      received:  receivedVal,
      change:    changeVal,
      method,
      status:    "completed",
      items:     JSON.stringify(cartItems),
      itemCount,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || "Cajero",
    }).run();

    for (const item of cartItems) {
      const current = products.find(p => p.sku === item.sku);
      if (current && current.stock !== null) {
        const newStock = Math.max(0, current.stock - item.qty);
        db.run(sql`UPDATE products SET stock = ${newStock}, updated_at = datetime('now') WHERE sku = ${item.sku}`);
        setProducts(prev => prev.map(p => p.sku === item.sku ? { ...p, stock: newStock } : p));
      }
    }

    const ticketData: TicketData = {
      ticket:   tno,
      date:     new Date().toLocaleString("es-MX"),
      employee: user?.name || "Cajero",
      items:    cartItems.map(i => ({
        sku: i.sku, name: i.name, price: i.price, qty: i.qty, unitType: i.unitType,
      })),
      subtotal: sub,
      tax:      taxVal,
      discount: 0,
      total:    t,
      received: receivedVal,
      change:   changeVal,
      method,
      width:    48,
    };
    printTicket(ticketData).catch(err => console.error("Print error:", err));

    nextTicket();
    setQuery("");
    setLastMsg(`v Venta ${tno} · ${fmt.money(t)} · ${method}`);
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const itemCount       = items.reduce((a, i) => a + i.qty, 0);
  const totalAmount     = total();
  const isSearchActive  = activePanel === "search";
  const isGridActive    = activePanel === "grid";
  const isTicketActive  = activePanel === "ticket";

  const msgColor = lastMsg.startsWith("v") ? theme.green
                 : lastMsg.startsWith("x") ? theme.red
                 : theme.textMuted;

  // ── PayModal positioning — centered in the grid panel ────────────────────
  const payModalLeft = Math.max(0, Math.floor((gridW - 36) / 2));
  const payModalTop  = headerH + searchH + Math.floor((mainH - 22) / 2);

  // ── Too small guard ───────────────────────────────────────────────────────
  if (layout.tooSmall) return <TooSmallOverlay layout={layout} />;

  return (
    <Box flexDirection="column" width={cols} height={rows}>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <BgBox variant="header" flexDirection="row" width={cols} paddingX={1}>
        <Box justifyContent="space-between" width={cols - 2}>

          {/* Left: system name + user */}
          <Box flexDirection="row" gap={1}>
            <Text color={theme.bg} bold>▸ OpenPos</Text>
            <Text color={theme.bg} dimColor>│</Text>
            <Text color={theme.bg}>{user?.name || "Cajero"}</Text>
          </Box>

          {/* Center: ticket + items — hide detail on compact terminals */}
          <Box flexDirection="row" gap={2}>
            <Text color={theme.bg} bold>{fmt.ticket(ticketNum)}</Text>
            {itemCount > 0 && (
              <>
                <Text color={theme.bg} dimColor>·</Text>
                <Text color={theme.bg}>{itemCount} {itemCount === 1 ? "item" : "items"}</Text>
                {layout.widthTier !== "compact" && (
                  <>
                    <Text color={theme.bg} dimColor>·</Text>
                    <Text color={theme.bg} bold>{fmt.money(totalAmount)}</Text>
                  </>
                )}
              </>
            )}
          </Box>

          {/* Right: time */}
          <Text color={theme.bg}>{time}</Text>
        </Box>
      </BgBox>

      {/* ── SEARCH BAR ───────────────────────────────────────────────────── */}
      <BgBox variant="section" flexDirection="row" width={cols} paddingX={1}>
        <Box flexDirection="row" width={cols - 2} gap={1}>
          <Text color={isSearchActive ? theme.green : theme.textDim} bold>
            {isSearchActive ? "❯" : "›"}
          </Text>
          <Box flexGrow={1}>
            <TextInput
              value={query}
              onChange={setQuery}
              onSubmit={() => {
                const value = query.trim();
                if (value.length >= 4) {
                  const qtyMatch = value.match(/^(\d+)[*\s](.+)$/);
                  const qty  = qtyMatch ? parseInt(qtyMatch[1]!) : 1;
                  const code = qtyMatch ? qtyMatch[2]!.trim() : value;
                  const product = products.find(p => p.barcode === code || p.sku === code);
                  if (product) {
                    if (product.active === 0) {
                      setLastMsg(`x "${product.name}" esta inactivo`);
                    } else if (product.stock < qty) {
                      setLastMsg(`x Stock insuficiente (disponible: ${product.stock})`);
                    } else {
                      for (let i = 0; i < qty; i++) add(product);
                      const unitLabel = product.unitType === "pza" ? "pza" : product.unitType;
                      const qtyStr    = qty > 1 ? `${qty}x ` : "";
                      setLastMsg(`v ${qtyStr}${product.name.substring(0, 12)} ${unitLabel} $${product.price}`);
                    }
                  } else {
                    setLastMsg(`x Codigo "${code}" no encontrado`);
                  }
                }
                setQuery("");
                setActivePanel("grid");
              }}
              placeholder={
                layout.widthTier === "compact"
                  ? "Buscar o codigo..."
                  : "Buscar producto o codigo: 4*7501234560014"
              }
              focus={isSearchActive}
            />
          </Box>
          {query && layout.widthTier !== "compact" && (
            <>
              <Text color={theme.textDim}>│</Text>
              <Text color={theme.textMuted}>
                {products.filter(p =>
                  p.name.toLowerCase().includes(query.toLowerCase()) ||
                  p.sku.toLowerCase().includes(query.toLowerCase())
                ).length} resultados
              </Text>
            </>
          )}
        </Box>
      </BgBox>

      {/* ── MAIN AREA ────────────────────────────────────────────────────── */}
      <Box flexDirection="row" height={mainH}>

        {/* ── Products panel ───────────────────────────────────────────── */}
        <Box flexDirection="column" width={gridW} height={mainH}>

          {/* Sub-header */}
          <BgBox variant="section" flexDirection="row" width={gridW} paddingX={1}>
            <Box justifyContent="space-between" width={gridW - 2}>
              <Box flexDirection="row" gap={1}>
                <Text color={isGridActive ? theme.green : theme.textSec} bold>
                  {isGridActive ? "▸" : " "}
                </Text>
                <Text color={isGridActive ? theme.white : theme.textSec} bold>
                  Productos
                </Text>
                {barcode && (
                  <>
                    <Text color={theme.textDim}>│</Text>
                    <Text color={theme.amber}>⊞ {barcode}</Text>
                  </>
                )}
              </Box>
              <Box flexDirection="row" gap={2}>
                <Text color={theme.textDim}>{products.length} total</Text>
                {query && <Text color={theme.amber}>"{query}"</Text>}
              </Box>
            </Box>
          </BgBox>

          {/* Product grid */}
          <Box width={gridW} height={gridH} paddingX={1}>
            <ProductGrid
              products={products}
              query={query}
              onSelect={p => {
                add(p);
                setLastMsg(`v ${p.name} · ${fmt.money(p.price)}`);
              }}
              active={isGridActive}
              width={gridW - 4}
              height={gridH}
              cols={gridCols}
              itemH={itemH}
            />
          </Box>

          {/* Hints bar */}
          <BgBox variant="section" flexDirection="row" width={gridW} paddingX={1}>
            <Box justifyContent="space-between" width={gridW - 2}>
              <Text color={theme.textDim}>
                {isGridActive
                  ? layout.widthTier === "compact"
                    ? "1/2 navegar  Enter agregar  Tab ticket"
                    : "↑↓←→ navegar  Enter agregar  Tab ticket  / buscar"
                  : "/ buscar  ↑↓ navegar  Tab ticket"
                }
              </Text>
              <Box flexDirection="row" gap={2}>
                <Text color={theme.textDim}>
                  <Text color={theme.textMuted}>R</Text> reportes
                </Text>
                <Text color={theme.textDim}>
                  <Text color={theme.textMuted}>L</Text> salir
                </Text>
              </Box>
            </Box>
          </BgBox>
        </Box>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <Box width={divW} height={mainH} flexDirection="column">
          <Text color={theme.textDim}>{"│\n".repeat(mainH)}</Text>
        </Box>

        {/* ── Ticket panel ─────────────────────────────────────────────── */}
        <Box width={ticketW} height={mainH}>
          <Ticket
            active={isTicketActive}
            onPay={() => setActivePanel("pay")}
            height={mainH}
          />
        </Box>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <BgBox variant="section" flexDirection="row" width={cols} paddingX={1}>
        <Box justifyContent="space-between" width={cols - 2}>

          {/* Connection status */}
          <Box flexDirection="row" gap={1}>
            <Text color={theme.green}>●</Text>
            {layout.widthTier !== "compact" && (
              <Text color={theme.textMuted}>Online</Text>
            )}
          </Box>

          {/* Active panel indicators */}
          <Box flexDirection="row" gap={1}>
            {(["search", "grid", "ticket"] as PanelType[]).map(p => (
              <Text key={p} color={activePanel === p ? theme.green : theme.textDim}>
                {activePanel === p ? "◉" : "○"}
                {" "}
                {layout.widthTier !== "compact" && (
                  <Text color={activePanel === p ? theme.white : theme.textDim}>
                    {p === "search" ? "buscar" : p === "grid" ? "productos" : "ticket"}
                  </Text>
                )}
              </Text>
            ))}
          </Box>

          {/* Last event message */}
          <Text color={msgColor}>
            {lastMsg
              ? fmt.trunc(lastMsg, layout.widthTier === "compact" ? 20 : 40)
              : <Text color={theme.textDim}>Listo</Text>
            }
          </Text>
        </Box>
      </BgBox>

      {/* ── PAY MODAL ────────────────────────────────────────────────────── */}
      <PayModal
        active={activePanel === "pay"}
        marginLeft={payModalLeft}
        marginTop={payModalTop}
        onConfirm={(method, received, change) => {
          confirmPay(method, received, change);
          setActivePanel("search");
        }}
        onCancel={() => setActivePanel("ticket")}
      />

      {/* ── REPORTS SCREEN ───────────────────────────────────────────────── */}
      <ReportsScreen
        rows={rows}
        cols={cols}
        active={activePanel === "reports"}
        onClose={() => setActivePanel("grid")}
      />

    </Box>
  );
}