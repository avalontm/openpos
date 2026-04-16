import React from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { db, initDb, products as productsTable, sales, type Product, useWindowManager, eq, getOrCreateClient, type CreateClientData, searchProducts, findProductByCode } from "@openpos/shared";
import { useCart, BgBox, theme, fmt, printTicket, type TicketData } from "@openpos/shared";

const PAGE_SIZE = 50;
import { useAuth } from "../../shared/useAuth";
import { useLayout, TooSmallOverlay } from "../../shared/useLayout";
import { ProductGrid } from "./components/ProductGrid.js";
import { Ticket } from "./components/Ticket.js";
import { ReportsScreen } from "./ReportsScreen.js";
import { PayModal, type Method, type InvoiceData } from "./components/PayModal.js";
import { billingService, logger } from "@openpos/shared";

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
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [query,       setQuery]       = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(0);
  const [activePanel, setActivePanel] = React.useState<PanelType>("search");
  const [lastMsg,     setLastMsg]     = React.useState("");
  const [time,        setTime]        = React.useState("");
  const [barcode,     setBarcode]     = React.useState("");
  const [billingStatus, setBillingStatus] = React.useState<"idle" | "processing" | "success" | "error">("idle");
  const [billingMsg,   setBillingMsg]   = React.useState("");
  const [billingUuid, setBillingUuid] = React.useState("");
  const [billingVerificationUrl, setBillingVerificationUrl] = React.useState("");
  const [billingEmailSent, setBillingEmailSent] = React.useState(false);

  // ── Clock ─────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const tick = () => setTime(
      new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Load products (paginated) ────────────────────────────────────────────
  const loadProducts = React.useCallback(async (page: number, searchQuery: string) => {
    const result = await searchProducts(searchQuery, page * PAGE_SIZE, PAGE_SIZE);
    if (page === 0) {
      setProducts(result.items);
    } else {
      setProducts(prev => [...prev, ...result.items]);
    }
    setTotalProducts(result.total);
  }, []);

  React.useEffect(() => {
    initDb();
    loadProducts(0, "");
  }, [loadProducts]);

  // ── Load more (infinite scroll) ───────────────────────────────────────────
  const loadMore = React.useCallback(() => {
    const nextPage = currentPage + 1;
    if (products.length < totalProducts) {
      setCurrentPage(nextPage);
      loadProducts(nextPage, query);
    }
  }, [currentPage, products.length, totalProducts, query, loadProducts]);

  // ── Search with debounce ───────────────────────────────────────────────────
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
      loadProducts(0, query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Input handling ────────────────────────────────────────────────────────
  useInput((input, key) => {
    // Skip ALL global navigation when any window is active (window handles its own keys)
    if (useWindowManager.getState().hasActiveWindow()) return;

    // Barcode scanner (numpad while grid is active)
    if (activePanel === "grid" && key.return && barcode.length >= 4) {
      const qtyMatch = barcode.match(/^(\d+)[*\s](.+)$/);
      const qty  = qtyMatch ? parseInt(qtyMatch[1]!) : 1;
      const code = qtyMatch ? qtyMatch[2]!.trim() : barcode.trim();
      const product = findProductByCode(code);
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
    if (input === "/")                                                     { setActivePanel("search");  return; }
    if (input === "r" && activePanel !== "reports")                       { setActivePanel("reports"); return; }
    if (input === "l")                                                     { if (onLogout) onLogout();  return; }
    if (input === "q" && key.ctrl) exit();
  });

  // ── Confirm payment ───────────────────────────────────────────────────────
  async function confirmPay(method: Method, receivedVal = 0, changeVal = 0, invoiceData?: InvoiceData) {
    const cartState = useCart.getState();
    const cartItems = cartState.items;
    if (cartItems.length === 0) { setLastMsg("x Carrito vacio"); return; }

    const t        = cartState.total();
    const sub      = cartState.subtotal();
    const taxVal   = t - sub;
    const tno      = fmt.ticket(ticketNum);
    const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

    const saleValues: Record<string, unknown> = {
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
    };

    // Variables locales para guardar valores de billing
    let localBillingStatus: "idle" | "processing" | "success" | "error" = "idle";
    let localBillingUuid = "";
    let localBillingVerificationUrl = "";
    let localBillingEmailSent = false;

    // ── Facturación CFDI ───────────────────────────────────────────────────
    if (invoiceData) {
      setBillingStatus("processing");
      setBillingMsg("⏳ FACTURANDO...");
      setLastMsg("⏳ FACTURANDO...");
      localBillingStatus = "processing";

      try {
        // Obtener o crear cliente en la base de datos
        const clientData: CreateClientData = {
          rfc: invoiceData.rfc,
          razonSocial: invoiceData.razonSocial,
          email: invoiceData.email,
        };
        const client = getOrCreateClient(clientData);

        const invoiceItems = cartItems.map(i => ({
          sku: i.sku,
          nombre: i.name,
          cantidad: i.qty,
          precioUnitario: i.price,
          claveProdServ: "60131324",
          claveUnidad: "H87",
          unidad: i.unitType,
        }));

        const result = await billingService.createInvoice({
          ticket: tno,
          subtotal: sub,
          tax: taxVal,
          total: t,
          method,
          customer: {
            rfc: invoiceData.rfc,
            razonSocial: invoiceData.razonSocial,
            email: invoiceData.email,
            usoCfdi: invoiceData.usoCfdi,
          },
          items: invoiceItems,
        });

        db.update(sales)
          .set({ cfdiStatus: result.status, cfdiUuid: result.uuid })
          .where(eq(sales.ticket, tno))
          .run();

        // Enviar factura por email si se proporcionó
        if (invoiceData?.email && result.id) {
          try {
            await billingService.sendInvoiceEmail(result.id, invoiceData.email);
            setBillingStatus("success");
            setBillingMsg(`✓ FACTURADO · EMAIL ENVIADO`);
            setLastMsg(`✓ VENTA Y FACTURA · EMAIL ENVIADO`);
            setBillingUuid(result.uuid);
            setBillingVerificationUrl(result.verificationUrl || "");
            setBillingEmailSent(true);
            
            localBillingStatus = "success";
            localBillingUuid = result.uuid;
            localBillingVerificationUrl = result.verificationUrl || "";
            localBillingEmailSent = true;
            
            logger.info("FACTURA ENVIADA POR EMAIL", { email: invoiceData.email, uuid: result.uuid });
          } catch (emailErr) {
            const emailErrMsg = emailErr instanceof Error ? emailErr.message : "Error desconocido";
            setBillingStatus("error");
            setBillingMsg(`✓ FACTURADO · ✗ EMAIL ERROR`);
            setLastMsg(`✓ VENTA Y FACTURA · EMAIL FALLÓ`);
            setBillingUuid(result.uuid);
            setBillingVerificationUrl(result.verificationUrl || "");
            setBillingEmailSent(false);
            
            localBillingStatus = "error";
            localBillingUuid = result.uuid;
            localBillingVerificationUrl = result.verificationUrl || "";
            localBillingEmailSent = false;
            
            logger.warn("ERROR AL ENVIAR EMAIL", { error: emailErrMsg, uuid: result.uuid });
          }
        } else {
          setBillingStatus("success");
          setBillingMsg(`✓ FACTURADO: ${result.uuid}`);
          setLastMsg(`✓ VENTA Y FACTURA ${result.uuid}`);
          setBillingUuid(result.uuid);
          setBillingVerificationUrl(result.verificationUrl || "");
          setBillingEmailSent(false);
          
          localBillingStatus = "success";
          localBillingUuid = result.uuid;
          localBillingVerificationUrl = result.verificationUrl || "";
          localBillingEmailSent = false;
        }
        logger.info("FACTURACIÓN COMPLETADA", { uuid: result.uuid, ticket: tno });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Error desconocido";
        setBillingStatus("error");
        setBillingMsg(`✗ ERROR: ${errMsg}`);
        setLastMsg(`✗ ERROR FACTURA: ${errMsg}`);
        setBillingUuid(errMsg);
        setBillingVerificationUrl("");
        setBillingEmailSent(false);
        
        localBillingStatus = "error";
        localBillingUuid = errMsg;
        localBillingVerificationUrl = "";
        localBillingEmailSent = false;
        
        logger.error("ERROR FACTURACIÓN API", { error: errMsg, ticket: tno });
      }
    }

    for (const item of cartItems) {
      const current = products.find(p => p.sku === item.sku);
      if (current && current.stock !== null) {
        const newStock = Math.max(0, current.stock - item.qty);
        db.update(productsTable)
          .set({ stock: newStock, updatedAt: new Date().toISOString() })
          .where(eq(productsTable.sku, item.sku))
          .run();
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
      billingStatus: invoiceData ? localBillingStatus : undefined,
      billingUuid: invoiceData ? localBillingUuid : undefined,
      billingVerificationUrl: invoiceData ? localBillingVerificationUrl : undefined,
      billingEmailSent: invoiceData ? localBillingEmailSent : undefined,
    };
    
    printTicket(ticketData).catch(err => console.error("Print error:", err));

    nextTicket();
    setQuery("");
    setBillingStatus("idle");
    setBillingMsg("");
    setBillingUuid("");
    setBillingVerificationUrl("");
    setBillingEmailSent(false);
    const cfdiMsg = invoiceData ? " · CFDI" : "";
    setLastMsg(`v Venta ${tno} · ${fmt.money(t)} · ${method}${cfdiMsg}`);
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
  const payModalLeft = Math.max(0, Math.floor((gridW - 42) / 2));
  const payModalTop  = headerH + searchH + Math.floor((mainH - 30) / 2);

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
                  const isBarcodeInput = qtyMatch !== null || /^\d/.test(code);
                  
                  if (isBarcodeInput) {
                    const product = findProductByCode(code);
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
                    setQuery("");
                  }
                }
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
                <Text color={theme.textDim}>{totalProducts} total</Text>
                {query && <Text color={theme.amber}>"{query}"</Text>}
              </Box>
            </Box>
          </BgBox>

          {/* Product grid */}
          <Box width={gridW} height={gridH} paddingX={1}>
            <ProductGrid
              products={products}
              query={query}
              total={totalProducts}
              onSelect={p => {
                add(p);
                setLastMsg(`v ${p.name} · ${fmt.money(p.price)}`);
              }}
              onLoadMore={loadMore}
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
            width={ticketW}
            billingStatus={billingStatus}
            billingMsg={billingMsg}
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
        onConfirm={(method, received, change, invoiceData) => {
          confirmPay(method, received, change, invoiceData || undefined);
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