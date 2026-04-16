import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { getConfig, setConfig, CONFIG_KEYS, BgBox, theme } from "@openpos/shared";
import { useTerminalSize } from "./useTerminalSize";

type TaxConfigProps = {
	onBack: () => void;
	isAdmin: boolean;
};

export function TaxConfig({ onBack, isAdmin }: TaxConfigProps) {
	const { cols, rows } = useTerminalSize();
	const [field, setField] = React.useState(0);
	const [taxRate, setTaxRate] = React.useState(() => getConfig(CONFIG_KEYS.TAX_RATE) || "16");
	const [lastTicket, setLastTicket] = React.useState(() => getConfig(CONFIG_KEYS.LAST_TICKET) || "1");
	const [saved, setSaved] = React.useState(false);
	const [error, setError] = React.useState(false);

	useInput((input, key) => {
		if (key.escape) {
			onBack();
			return;
		}
		if (key.return) {
			if (isAdmin) {
				let allSaved = true;
				const rate = parseFloat(taxRate);
				if (!isNaN(rate) && rate >= 0 && rate <= 100) {
					if (!setConfig(CONFIG_KEYS.TAX_RATE, taxRate)) allSaved = false;
				}
				if (!setConfig(CONFIG_KEYS.LAST_TICKET, lastTicket)) allSaved = false;
				if (allSaved) {
					setSaved(true);
					setTimeout(() => setSaved(false), 2000);
				} else {
					setError(true);
					setTimeout(() => setError(false), 2000);
				}
			}
			return;
		}
		if (key.upArrow) {
			setField((f) => (f > 0 ? f - 1 : 1));
		} else if (key.downArrow) {
			setField((f) => (f < 1 ? f + 1 : 0));
		}
		if (isAdmin && input && /^[0-9.]$/.test(input)) {
			if (field === 0) {
				setTaxRate((v) => (v + input).slice(0, 5));
			} else {
				setLastTicket((v) => (v + input).slice(0, 10));
			}
		}
		if (isAdmin && (input === "3" || key.backspace)) {
			if (field === 0) {
				setTaxRate((v) => v.slice(0, -1));
			} else {
				setLastTicket((v) => v.slice(0, -1));
			}
		}
	}, { isActive: true });

	const panelWidth = Math.min(50, cols - 10);

	return (
		<Box flexDirection="column" width={cols} height={rows}>
			<BgBox variant="section" width={cols} paddingX={2}>
				<Box width={cols - 4} justifyContent="space-between">
					<Box flexDirection="row" gap={1}>
						<Text color={theme.green} bold>▸</Text>
						<Text color={theme.textMuted}>IMPUESTOS</Text>
					</Box>
					<Text color={theme.textMuted}>Configuración</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={1}>
				<Box justifyContent="center" marginY={1}>
					<Text bold color={theme.cyan}>💰 IMPUESTOS Y TICKETS</Text>
				</Box>

				<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
					<Box width={panelWidth - 6}>
						<Text bold color={field === 0 ? theme.green : theme.textMuted}>
							{field === 0 ? "▶ " : "  "}
						</Text>
						<Text bold color={field === 0 ? theme.green : theme.white}>
							Tasa IVA (%):
						</Text>
						<Text color={theme.amber}> {taxRate}%</Text>
					</Box>
					<Box width={panelWidth - 6}>
						<Text bold color={field === 1 ? theme.green : theme.textMuted}>
							{field === 1 ? "▶ " : "  "}
						</Text>
						<Text bold color={field === 1 ? theme.green : theme.white}>
							Último ticket:
						</Text>
						<Text color={theme.amber}> {lastTicket}</Text>
					</Box>
				</BgBox>

				<Box marginTop={1} borderStyle="round" borderColor={theme.blue} paddingX={2}>
					<Text>
						{field === 0 ? "Porcentaje de IVA aplicado a las ventas" : "Número del último ticket (para reiniciar, usar 1)"}
					</Text>
				</Box>

				<Box marginTop={1}>
					<Text dimColor>
						{isAdmin
							? "↑↓ Mover · Escribir para editar · Enter para guardar · Esc atrás"
							: "Solo lectura (requiere admin)"}
					</Text>
				</Box>

				{saved && (
					<Box marginTop={1}>
						<Text bold color={theme.green}>✅ Cambios guardados</Text>
					</Box>
				)}

				{error && (
					<Box marginTop={1}>
						<Text bold color={theme.red}>❌ Error al guardar</Text>
					</Box>
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