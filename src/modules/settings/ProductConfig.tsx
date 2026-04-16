import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { db, products, type Product, BgBox, theme, logger } from "@openpos/shared";
import { sql } from "drizzle-orm";
import { useTerminalSize } from "./useTerminalSize";

type ProductConfigProps = {
	onBack: () => void;
	isAdmin: boolean;
};

	type ProductForm = {
		barcode: string;
		sku: string;
		name: string;
		price: string;
		cost: string;
		category: string;
		stock: string;
		unitType: string;
		minStock: string;
	};

	const UNIT_OPTIONS = ["pza", "kg", "lt", "ml", "m"];
	const UNIT_LABELS: Record<string, string> = {
		pza: "Pieza",
		kg: "Kilogramo",
		lt: "Litro",
		ml: "Mililitro",
		m: "Metro",
	};

	const COL_SIZES = {
		id: 3,
		barcode: 13,
		sku: 10,
		name: 20,
		price: 9,
		stock: 6,
	} as const;

	const EMPTY_FORM: ProductForm = {
		barcode: "",
		sku: "",
		name: "",
		price: "",
		cost: "",
		category: "GEN",
		stock: "0",
		unitType: "pza",
		minStock: "5",
	};

export function ProductConfig({ onBack, isAdmin }: ProductConfigProps) {
	const { cols, rows } = useTerminalSize();
	const [view, setView] = React.useState<"list" | "add" | "edit">("list");
	const [productsList, setProductsList] = React.useState<Product[]>([]);
	const [selected, setSelected] = React.useState(0);
	const [search, setSearch] = React.useState("");
	const [searchInput, setSearchInput] = React.useState("");
	const [searchMode, setSearchMode] = React.useState(false);
	const [categoryFilter, setCategoryFilter] = React.useState("TODAS");
	const [page, setPage] = React.useState(0);
	const [totalProducts, setTotalProducts] = React.useState(0);
	const PAGE_SIZE = 50;
	const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
	const [form, setForm] = React.useState<ProductForm>(EMPTY_FORM);
	const [editingId, setEditingId] = React.useState<number | null>(null);
	const [msg, setMsg] = React.useState("");
	const [error, setError] = React.useState("");
	const [fieldIdx, setFieldIdx] = React.useState(0);

	const loadProducts = React.useCallback(() => {
		try {
			const searchLower = search.toLowerCase().trim();
			let result = db.select().from(products)
				.orderBy(products.sku)
				.limit(PAGE_SIZE)
				.offset(page * PAGE_SIZE)
				.all();
			
			let filteredResult = result;
			if (searchLower) {
				filteredResult = result.filter((p: Product) => 
					String(p.id).includes(searchLower) ||
					(p.barcode || "").toLowerCase().includes(searchLower) ||
					(p.sku || "").toLowerCase().includes(searchLower) ||
					(p.name || "").toLowerCase().includes(searchLower)
				);
			}
			
			if (categoryFilter !== "TODAS") {
				filteredResult = filteredResult.filter((p: Product) => p.category === categoryFilter);
			}
			
			setProductsList(filteredResult);
			
			const total = db.select({ count: sql<number>`count(*)` }).from(products).get();
			setTotalProducts(total?.count || 0);
			setError("");
		} catch (e) {
			logger.error("ProductConfig: error loading products", e);
			setError("Error al cargar productos");
			setProductsList([]);
		}
	}, [search, categoryFilter, page]);

	React.useEffect(() => {
		loadProducts();
	}, [loadProducts]);

	const categories = React.useMemo(() => {
		const cats = new Set(productsList.map((p) => p.category));
		return ["TODAS", ...Array.from(cats).sort()];
	}, [productsList]);

	const handleSave = () => {
		if (!form.sku || !form.name || !form.price) {
			setMsg("SKU, nombre y precio obligatorios");
			return;
		}

		const price = parseFloat(form.price);
		if (isNaN(price) || price <= 0) {
			setMsg("Precio inválido");
			return;
		}

		const productData = {
			sku: form.sku,
			name: form.name,
			price,
			cost: parseFloat(form.cost) || 0,
			category: form.category || "GEN",
			stock: parseFloat(form.stock) || 0,
			barcode: form.barcode || null,
			unitType: form.unitType || "pza",
			minStock: parseFloat(form.minStock) || 5,
			active: 1,
		};

		try {
			if (view === "add") {
				const existing = db.select().from(products).where(sql`sku = ${form.sku}`).get();
				if (existing) {
					setMsg("Ya existe un producto con ese SKU");
					return;
				}

				db.insert(products).values({
					...productData,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}).run();
				setMsg("Producto agregado");
			} else if (view === "edit" && editingId) {
				db.update(products).set({
					name: form.name,
					price,
					cost: parseFloat(form.cost) || 0,
					category: form.category,
					stock: parseFloat(form.stock) || 0,
					barcode: form.barcode || null,
					unitType: form.unitType,
					minStock: parseFloat(form.minStock) || 5,
					updatedAt: new Date().toISOString(),
				}).where(sql`id = ${editingId}`).run();
				setMsg("Producto actualizado");
			}

			setTimeout(() => {
				setMsg("");
				setView("list");
				setForm(EMPTY_FORM);
				setEditingId(null);
				loadProducts();
			}, 1500);
		} catch (e) {
			setMsg("Error al guardar");
		}
	};

	const handleDelete = (id: number) => {
		if (!isAdmin) return;
		try {
			db.run(sql`DELETE FROM products WHERE id = ${id}`);
			setMsg("Producto eliminado");
			setTimeout(() => {
				setMsg("");
				loadProducts();
			}, 1000);
		} catch (e) {
			setMsg("Error al eliminar");
		}
	};

	const startEdit = (product: Product) => {
		setForm({
			barcode: product.barcode || "",
			sku: product.sku,
			name: product.name || "",
			price: product.price.toString(),
			cost: (product.cost || 0).toString(),
			category: product.category,
			stock: (product.stock || 0).toString(),
			unitType: product.unitType,
			minStock: (product.minStock || 5).toString(),
		});
		setEditingId(product.id);
		setView("edit");
	};

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setSearch(searchInput);
			setPage(0);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	useInput((input, key) => {
		if (key.escape) {
			if (searchMode) {
				setSearchMode(false);
				setSearchInput("");
				setSearch("");
				setPage(0);
				return;
			}
			if (view === "list") {
				onBack();
			} else {
				setView("list");
				setForm(EMPTY_FORM);
				setEditingId(view === "edit" ? null : null);
			}
			return;
		}

		if (view === "list") {
			if (input === "/" || input === "f") {
				setSearchMode(true);
				return;
			}
			
			if (searchMode) {
				if (key.backspace) {
					setSearchInput((s) => s.slice(0, -1));
				} else if (input && /^[a-zA-Z0-9\-_]$/.test(input)) {
					setSearchInput((s) => s + input);
				}
				return;
			}
			
			if (key.leftArrow) {
				setPage((p) => Math.max(0, p - 1));
			} else if (key.rightArrow) {
				setPage((p) => p + 1);
			}
			if (key.upArrow) {
				setSelected((s) => Math.max(0, s - 1));
			} else if (key.downArrow) {
				setSelected((s) => Math.min(productsList.length - 1, s + 1));
			} else if (input === "e" && isAdmin && productsList[selected]) {
				startEdit(productsList[selected]!);
			} else if (input === "x" && isAdmin && productsList[selected]) {
				handleDelete(productsList[selected]!.id);
			} else if (input === "a" && isAdmin) {
				setView("add");
			}
		}
	}, { isActive: true });

	useInput((input, key) => {
		if (view === "list") return;
		if (key.escape) {
			setView("list");
			setForm(EMPTY_FORM);
			return;
		}
		if (key.return) {
			handleSave();
			return;
		}
		if (key.upArrow) {
			setFieldIdx((f) => Math.max(0, f - 1));
		} else if (key.downArrow) {
			setFieldIdx((f) => Math.min(8, f + 1));
		}
		if (fieldIdx === 7 && (key.leftArrow || key.rightArrow)) {
			const currentIdx = UNIT_OPTIONS.indexOf(form.unitType);
			let newIdx = currentIdx;
			if (key.leftArrow) {
				newIdx = currentIdx <= 0 ? UNIT_OPTIONS.length - 1 : currentIdx - 1;
			} else {
				newIdx = currentIdx >= UNIT_OPTIONS.length - 1 ? 0 : currentIdx + 1;
			}
			setForm((f) => ({ ...f, unitType: UNIT_OPTIONS[newIdx] }));
			return;
		}
		if (input && /^[a-zA-Z0-9.\- ]$/.test(input)) {
			const formFields = [
				{ key: "barcode", label: "Código de barras", maxLen: 30 },
				{ key: "sku", label: "SKU", maxLen: 20 },
				{ key: "name", label: "Nombre", maxLen: 100 },
				{ key: "price", label: "Precio", maxLen: 10 },
				{ key: "cost", label: "Costo", maxLen: 10 },
				{ key: "category", label: "Categoría", maxLen: 20 },
				{ key: "stock", label: "Stock", maxLen: 10 },
				{ key: "unitType", label: "Unidad", maxLen: 10 },
				{ key: "minStock", label: "Stock mínimo", maxLen: 10 },
			];
			const currentField = formFields[fieldIdx]!;
			const k = currentField.key as keyof ProductForm;
			setForm((f) => ({ ...f, [k]: (f[k] + input).slice(0, currentField.maxLen) }));
		}
		if (input === "3" || key.backspace) {
			const formFields = [
				{ key: "barcode", label: "Código de barras", maxLen: 30 },
				{ key: "sku", label: "SKU", maxLen: 20 },
				{ key: "name", label: "Nombre", maxLen: 100 },
				{ key: "price", label: "Precio", maxLen: 10 },
				{ key: "cost", label: "Costo", maxLen: 10 },
				{ key: "category", label: "Categoría", maxLen: 20 },
				{ key: "stock", label: "Stock", maxLen: 10 },
				{ key: "unitType", label: "Unidad", maxLen: 10 },
				{ key: "minStock", label: "Stock mínimo", maxLen: 10 },
			];
			const currentField = formFields[fieldIdx]!;
			const k = currentField.key as keyof ProductForm;
			setForm((f) => ({ ...f, [k]: f[k].slice(0, -1) }));
		}
	}, { isActive: true });

	const panelWidth = Math.min(80, cols - 4);
	const listHeight = Math.max(10, rows - 14);

	if (view !== "list") {
		const formFields = [
			{ key: "barcode", label: "Código de barras", maxLen: 30 },
			{ key: "sku", label: "SKU", maxLen: 20 },
			{ key: "name", label: "Nombre", maxLen: 100 },
			{ key: "price", label: "Precio", maxLen: 10 },
			{ key: "cost", label: "Costo", maxLen: 10 },
			{ key: "category", label: "Categoría", maxLen: 20 },
			{ key: "stock", label: "Stock", maxLen: 10 },
			{ key: "unitType", label: "Unidad", maxLen: 10 },
			{ key: "minStock", label: "Stock mínimo", maxLen: 10 },
		];
		const currentField = formFields[fieldIdx]!;

		return (
			<Box flexDirection="column" width={cols} height={rows}>
				<BgBox variant="section" width={cols} paddingX={2}>
					<Box width={cols - 4} justifyContent="space-between">
						<Box flexDirection="row" gap={1}>
							<Text color={theme.green} bold>▸</Text>
							<Text color={theme.textMuted}>PRODUCTOS</Text>
						</Box>
						<Text color={theme.textMuted}>{view === "add" ? "Agregar" : "Editar"}</Text>
					</Box>
				</BgBox>

				<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
					<Box justifyContent="center" marginY={1}>
						<Text bold color={theme.cyan}>
							{view === "add" ? "➕ AGREGAR PRODUCTO" : "✏️ EDITAR PRODUCTO"}
						</Text>
					</Box>

					<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
						<Box flexDirection="column" gap={0}>
							{formFields.map((f, idx) => {
								const val = form[f.key as keyof ProductForm] || "";
								const isUnitType = idx === 7;
								const unitLabel = isUnitType ? UNIT_LABELS[form.unitType] || form.unitType : val;
								return (
									<Box key={f.key} width={panelWidth - 6}>
										<Text bold color={fieldIdx === idx ? theme.green : theme.textMuted}>
											{fieldIdx === idx ? "▶ " : "  "}
										</Text>
										<Text bold color={fieldIdx === idx ? theme.green : theme.white}>
											{f.label}:
										</Text>
										{isUnitType ? (
											<Text color={theme.amber}> {unitLabel} (← →)</Text>
										) : (
											<Text color={theme.amber}> {val}</Text>
										)}
									</Box>
								);
							})}
						</Box>
					</BgBox>

					<Box marginTop={1}>
						<Text dimColor>↑↓ Mover · Escribir · ←→ Unidad · Enter guardar · Esc cancelar</Text>
					</Box>

					{msg ? (
						<Box marginTop={1}>
							<Text bold color={msg.startsWith("Error") || msg.includes("inválido") || msg.includes("falta") ? theme.red : theme.green}>{msg}</Text>
						</Box>
					) : view === "edit" ? (
						<Text dimColor>SKU no editable</Text>
					) : (
						<Text dimColor>↑↓ Mover · Escribir · Enter guardar · Esc cancelar</Text>
					)}
				</Box>

				<BgBox variant="section" width={cols} paddingX={2}>
					<Box width={cols - 4} justifyContent="space-between">
						<Text color={theme.textDim}>v1.0.0</Text>
						<Box flexDirection="row" gap={1}>
							<Text color={theme.textDim}>Developed by</Text>
							<Text color={theme.textMuted}>AvalonTM</Text>
						</Box>
					</Box>
				</BgBox>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width={cols} height={rows}>
			<BgBox variant="section" width={cols} paddingX={2}>
				<Box width={cols - 4} justifyContent="space-between">
					<Box flexDirection="row" gap={1}>
						<Text color={theme.green} bold>▸</Text>
						<Text color={theme.textMuted}>PRODUCTOS</Text>
					</Box>
					<Text color={theme.textMuted}>Gestión {isAdmin && "[A] Agregar"}</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
				<Box>
					{searchMode ? (
						<>
							<Text>Buscar: </Text>
							<Text color={theme.green} bold>{searchInput || "escribe..."}</Text>
							<Text color={theme.textDim}> (Esc salir)</Text>
						</>
					) : (
						<>
							<Text>Buscar: </Text>
							<Text color={theme.amber}>{search || "..."}</Text>
							<Text color={theme.textDim}> (/ para buscar)</Text>
							<Text> | Categoría: </Text>
							<Text color={theme.cyan}>{categoryFilter}</Text>
						</>
					)}
				</Box>

				<BgBox variant="panel" width={panelWidth} paddingX={1} paddingY={0}>
					<Box flexDirection="column" height={listHeight}>
						<Box>
							<Text bold color={theme.textMuted}>ID</Text>
							<Text bold color={theme.textMuted}>{" ".repeat(COL_SIZES.id - 2)}</Text>
							<Text bold color={theme.textMuted}>CODEBAR</Text>
							<Text bold color={theme.textMuted}>{" ".repeat(COL_SIZES.barcode - 8)}</Text>
							<Text bold color={theme.textMuted}>SKU</Text>
							<Text bold color={theme.textMuted}>{" ".repeat(COL_SIZES.sku - 3)}</Text>
							<Text bold color={theme.textMuted}>NOMBRE</Text>
							<Text bold color={theme.textMuted}>{" ".repeat(COL_SIZES.name - 5)}</Text>
							<Text bold color={theme.textMuted}>PRECIO</Text>
							<Text bold color={theme.textMuted}>{" ".repeat(COL_SIZES.price - 6)}</Text>
							<Text bold color={theme.textMuted}>STOCK</Text>
						</Box>
						<Box borderStyle="single" borderColor={theme.textDim} width={panelWidth - 2} />
						{productsList.length === 0 ? (
							<Box justifyContent="center" flexGrow={1}>
								<Text color={theme.textDim}>No hay productos</Text>
							</Box>
						) : (
							productsList.slice(0, listHeight - 3).map((p, idx) => (
								<Box key={p.id}>
									<Text color={selected === idx ? theme.green : theme.cyan}>
										{selected === idx ? "▶" : " "}
									</Text>
									<Text color={selected === idx ? theme.green : theme.cyan}>
										{String(p.id).padEnd(COL_SIZES.id)}
									</Text>
									<Text color={selected === idx ? theme.green : theme.white}>
										{(p.barcode || "-").slice(0, COL_SIZES.barcode).padEnd(COL_SIZES.barcode)}
									</Text>
									<Text color={selected === idx ? theme.green : theme.amber}>
										{p.sku.slice(0, COL_SIZES.sku).padEnd(COL_SIZES.sku)}
									</Text>
									<Text color={selected === idx ? theme.green : theme.white}>
										{(p.name || "").slice(0, COL_SIZES.name).padEnd(COL_SIZES.name)}
									</Text>
									<Text color={selected === idx ? theme.green : theme.green}>
										${p.price.toFixed(2).padStart(COL_SIZES.price)}
									</Text>
									<Text color={selected === idx ? theme.green : p.stock <= (p.minStock || 5) ? theme.red : theme.white}>
										{String(p.stock).padStart(COL_SIZES.stock)}
									</Text>
								</Box>
							))
						)}
					</Box>
				</BgBox>

				{error && (
					<Box marginTop={1}>
						<Text bold color={theme.red}>{error}</Text>
					</Box>
				)}

				<Box marginTop={1}>
					<Text dimColor>
						↑↓ Navegar {isAdmin && "| [E]ditar [X]Eliminar [A]gregar"} | ←→ Página | / Buscar | Esc Volver
					</Text>
				</Box>

				{msg && (
					<Box marginTop={1}>
						<Text bold color={theme.green}>{msg}</Text>
					</Box>
				)}

					<Box>
					<Text dimColor>
						Página {page + 1} de {totalPages || 1} | Total: {totalProducts} productos
					</Text>
				</Box>
			</Box>

			<BgBox variant="section" width={cols} paddingX={2}>
				<Box width={cols - 4} justifyContent="space-between">
					<Text color={theme.textDim}>v1.0.0</Text>
					<Box flexDirection="row" gap={1}>
						<Text color={theme.textDim}>Developed by</Text>
						<Text color={theme.textMuted}>AvalonTM</Text>
					</Box>
				</Box>
			</BgBox>
		</Box>
	);
}