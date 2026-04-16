import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { db, sales, type Sale, BgBox, theme } from "@openpos/shared";
import { sql } from "drizzle-orm";
import { useTerminalSize } from "./useTerminalSize";

type SalesConfigProps = {
	onBack: () => void;
	isAdmin: boolean;
};

type Filter = {
	dateFrom: string;
	dateTo: string;
	method: string;
	cfdiStatus: string;
};

export function SalesConfig({ onBack }: SalesConfigProps) {
	const { cols, rows } = useTerminalSize();
	const [salesList, setSalesList] = React.useState<Sale[]>([]);
	const [selected, setSelected] = React.useState(0);
	const [filter, setFilter] = React.useState<Filter>({
		dateFrom: "",
		dateTo: "",
		method: "TODOS",
		cfdiStatus: "TODOS",
	});
	const [view, setView] = React.useState<"list" | "detail">("list");
	const [detailSale, setDetailSale] = React.useState<Sale | null>(null);

	const panelWidth = Math.min(80, cols - 6);
	const listHeight = Math.max(10, rows - 14);

	const loadSales = React.useCallback(() => {
		let result = db.select().from(sales).orderBy(sql`created_at DESC`).all() as Sale[];
		
		if (filter.method !== "TODOS") {
			result = result.filter((s) => s.method === filter.method);
		}
		if (filter.cfdiStatus !== "TODOS") {
			result = result.filter((s) => s.cfdiStatus === filter.cfdiStatus);
		}
		
		setSalesList(result);
	}, [filter]);

	React.useEffect(() => {
		loadSales();
	}, [loadSales]);

	const formatDate = (dateStr: string) => {
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString("es-MX", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return dateStr;
		}
	};

	const getCfdiStatusText = (status: string | null) => {
		switch (status) {
			case "sent": return "✓ENV";
			case "pending": return "⏳PEN";
			case "cancelled": return "✗CAN";
			default: return "---";
		}
	};

	const getCfdiStatusColor = (status: string | null) => {
		switch (status) {
			case "sent": return theme.green;
			case "pending": return theme.amber;
			case "cancelled": return theme.red;
			default: return theme.textDim;
		}
	};

	const showDetail = (sale: Sale) => {
		setDetailSale(sale);
		setView("detail");
	};

	useInput((input, key) => {
		if (key.escape) {
			if (view === "detail") {
				setView("list");
				setDetailSale(null);
			} else {
				onBack();
			}
			return;
		}

		if (view === "list") {
			if (key.upArrow) {
				setSelected((s) => Math.max(0, s - 1));
			} else if (key.downArrow) {
				setSelected((s) => Math.min(salesList.length - 1, s + 1));
			} else if (input === "v" && salesList[selected]) {
				showDetail(salesList[selected]!);
			} else if (input === "f") {
				setFilter((f) => ({
					...f,
					method: f.method === "TODOS" ? "efectivo" : f.method === "efectivo" ? "tarjeta" : "TODOS",
				}));
			} else if (input === "c") {
				setFilter((f) => ({
					...f,
					cfdiStatus: f.cfdiStatus === "TODOS" ? "sent" : f.cfdiStatus === "sent" ? "pending" : "TODOS",
				}));
			}
		}
	}, { isActive: true });

	if (view === "detail" && detailSale) {
		const items = detailSale.items ? JSON.parse(detailSale.items) : [];
		
		return (
			<Box flexDirection="column" width={cols} height={rows}>
				<BgBox variant="section" width={cols} paddingX={2}>
					<Box width={cols - 4} justifyContent="space-between">
						<Box flexDirection="row" gap={1}>
							<Text color={theme.green} bold>▸</Text>
							<Text color={theme.textMuted}>VENTAS</Text>
						</Box>
						<Text color={theme.textMuted}>Detalle</Text>
					</Box>
				</BgBox>

				<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
					<Box justifyContent="center" marginY={1}>
						<Text bold color={theme.cyan}>
							📄 DETALLE DE VENTA #{detailSale.ticket}
						</Text>
					</Box>

					<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
						<Box flexDirection="column" gap={0}>
							<Box width={panelWidth - 6}>
								<Text>Ticket: </Text>
								<Text bold>{detailSale.ticket}</Text>
							</Box>
							<Box width={panelWidth - 6}>
								<Text>Fecha: </Text>
								<Text>{formatDate(detailSale.createdAt)}</Text>
							</Box>
							<Box width={panelWidth - 6}>
								<Text>Método: </Text>
								<Text>{detailSale.method}</Text>
							</Box>
							<Box width={panelWidth - 6}>
								<Text>Subtotal: </Text>
								<Text color={theme.amber}>${detailSale.subtotal.toFixed(2)}</Text>
							</Box>
							<Box width={panelWidth - 6}>
								<Text>IVA: </Text>
								<Text color={theme.amber}>${detailSale.tax.toFixed(2)}</Text>
							</Box>
							<Box width={panelWidth - 6}>
								<Text>Total: </Text>
								<Text bold color={theme.green}>${detailSale.total.toFixed(2)}</Text>
							</Box>
						</Box>
					</BgBox>

					<Box marginTop={1}>
						<Text bold>Productos:</Text>
					</Box>
					<BgBox variant="panel" width={panelWidth} paddingX={2} paddingY={0}>
						<Box flexDirection="column" height={Math.min(8, listHeight - 2)}>
							{Array.isArray(items) ? items.slice(0, 6).map((it: any, idx: number) => (
								<Text key={idx} color={theme.textMuted}>
									- {it.name} x{it.qty} = ${(it.price * it.qty).toFixed(2)}
								</Text>
							)) : <Text color={theme.textDim}>Sin detalles</Text>}
						</Box>
					</BgBox>

					<Box marginTop={1}>
						<Text dimColor>Esc Volver</Text>
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

	return (
		<Box flexDirection="column" width={cols} height={rows}>
			<BgBox variant="section" width={cols} paddingX={2}>
				<Box width={cols - 4} justifyContent="space-between">
					<Box flexDirection="row" gap={1}>
						<Text color={theme.green} bold>▸</Text>
						<Text color={theme.textMuted}>VENTAS</Text>
					</Box>
					<Text color={theme.textMuted}>Historial</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
				<Box>
					<Text>Método: </Text>
					<Text color={theme.cyan}>{filter.method}</Text>
					<Text> | CFDI: </Text>
					<Text color={theme.cyan}>{filter.cfdiStatus}</Text>
				</Box>

				<BgBox variant="panel" width={panelWidth} paddingX={2} paddingY={0}>
					<Box flexDirection="column" height={listHeight}>
						<Box width={panelWidth - 4}>
							<Text bold color={theme.textMuted}>#TICKET</Text>
							<Text bold color={theme.textMuted}> FECHA</Text>
							<Text bold color={theme.textMuted}> MÉTODO</Text>
							<Text bold color={theme.textMuted}> TOTAL</Text>
							<Text bold color={theme.textMuted}> CFDI</Text>
						</Box>
						{salesList.length === 0 ? (
							<Box justifyContent="center" flexGrow={1}>
								<Text color={theme.textDim}>No hay ventas</Text>
							</Box>
						) : (
							salesList.slice(0, listHeight - 2).map((s, idx) => (
								<Box key={s.id} width={panelWidth - 4}>
									<Text color={selected === idx ? theme.green : theme.white}>
										{selected === idx ? "▶ " : "  "}
									</Text>
									<Text color={theme.white}>{s.ticket}</Text>
									<Text color={theme.textDim}> {formatDate(s.createdAt).split(" ")[0]}</Text>
									<Text color={theme.textMuted}> {s.method}</Text>
									<Text color={theme.amber}> ${s.total.toFixed(2)}</Text>
									<Text color={getCfdiStatusColor(s.cfdiStatus)}>
										{" "}{getCfdiStatusText(s.cfdiStatus)}
									</Text>
								</Box>
							))
						)}
					</Box>
				</BgBox>

				<Box marginTop={1}>
					<Text dimColor>
						↑↓ Navegar | [V]er detalle | [F]iltro método | [C]filtro CFDI | Esc Volver
					</Text>
				</Box>

				<Box>
					<Text dimColor>Total: {salesList.length} ventas</Text>
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