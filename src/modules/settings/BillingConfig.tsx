import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { getBillingConfig, saveBillingConfig, BgBox, theme } from "@openpos/shared";
import { useTerminalSize } from "./useTerminalSize";

type BillingConfigProps = {
	onBack: () => void;
	isAdmin: boolean;
};

export function BillingConfig({ onBack, isAdmin }: BillingConfigProps) {
	const { cols, rows } = useTerminalSize();
	const [field, setField] = React.useState(0);
	const billingConfig = getBillingConfig();
	
	const [values, setValues] = React.useState({
		billingApiKey: billingConfig?.apiKey || "",
		billingProvider: billingConfig?.provider || "facturapi",
		billingSandbox: billingConfig?.sandbox ?? true,
	});

	const [saved, setSaved] = React.useState(false);

	const fields = [
		{ key: "billingApiKey", label: "API Key", maxLen: 100 },
		{ key: "billingProvider", label: "Proveedor", maxLen: 20 },
		{ key: "billingSandbox", label: "Modo sandbox", maxLen: 10 },
	];

	const currentField = fields[field]!;

	useInput((input, key) => {
		if (key.escape) {
			onBack();
			return;
		}
		if (key.return) {
			if (isAdmin) {
				saveBillingConfig({
					provider: values.billingProvider,
					apiKey: values.billingApiKey,
					sandbox: values.billingSandbox,
				});
				setSaved(true);
				setTimeout(() => setSaved(false), 2000);
			}
			return;
		}
		if (key.upArrow) {
			setField((f) => Math.max(0, f - 1));
		} else if (key.downArrow) {
			setField((f) => Math.min(fields.length - 1, f + 1));
		}
		if (isAdmin && key.rightArrow && field === 1) {
			setValues((v) => ({
				...v,
				billingProvider: v.billingProvider === "facturapi" ? "local" : "facturapi",
			}));
		}
		if (isAdmin && key.rightArrow && field === 2) {
			setValues((v) => ({
				...v,
				billingSandbox: !v.billingSandbox,
			}));
		}
		if (isAdmin && field === 0 && input) {
			setValues((v) => ({
				...v,
				billingApiKey: (v.billingApiKey + input).slice(0, 100),
			}));
		}
		if (isAdmin && (input === "3" || key.backspace) && field === 0) {
			setValues((v) => ({
				...v,
				billingApiKey: v.billingApiKey.slice(0, -1),
			}));
		}
	}, { isActive: true });

	const isSandbox = values.billingSandbox;
	const panelWidth = Math.min(70, cols - 10);

	return (
		<Box flexDirection="column" width={cols} height={rows}>
			<BgBox variant="section" width={cols} paddingX={2}>
				<Box width={cols - 4} justifyContent="space-between">
					<Box flexDirection="row" gap={1}>
						<Text color={theme.green} bold>▸</Text>
						<Text color={theme.textMuted}>FACTURACIÓN</Text>
					</Box>
					<Text color={theme.textMuted}>Configuración</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
				<Box justifyContent="center" marginY={1}>
					<Text bold color={theme.cyan}>🧾 CONFIGURACIÓN DE FACTURACIÓN</Text>
				</Box>

				<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
					<Box flexDirection="column" gap={0}>
						<Box width={panelWidth - 6}>
							<Text bold color={field === 0 ? theme.green : theme.textMuted}>
								{field === 0 ? "▶ " : "  "}
							</Text>
							<Text bold color={field === 0 ? theme.green : theme.white}>
								API Key:
							</Text>
							<Text color={isAdmin ? theme.amber : theme.textDim}> {isAdmin ? values.billingApiKey : "******"}</Text>
						</Box>
						<Box width={panelWidth - 6}>
							<Text bold color={field === 1 ? theme.green : theme.textMuted}>
								{field === 1 ? "▶ " : "  "}
							</Text>
							<Text bold color={field === 1 ? theme.green : theme.white}>
								Proveedor:
							</Text>
							<Text color={theme.amber}> {values.billingProvider}</Text>
						</Box>
						<Box width={panelWidth - 6}>
							<Text bold color={field === 2 ? theme.green : theme.textMuted}>
								{field === 2 ? "▶ " : "  "}
							</Text>
							<Text bold color={field === 2 ? theme.green : theme.white}>
								Sandbox:
							</Text>
							<Text color={isSandbox ? theme.green : theme.red}> {isSandbox ? "✓ ACTIVO" : "✗ INACTIVO"}</Text>
						</Box>
					</Box>
				</BgBox>

				<Box marginTop={1}>
					<BgBox variant="info" width={panelWidth} paddingX={2} paddingY={0}>
						<Box flexDirection="column" gap={0}>
							<Text bold color={theme.cyan}>💡 Obtener API Key:</Text>
							<Text color={theme.textMuted}>1. Visita https://www.facturapi.io/</Text>
							<Text color={theme.textMuted}>2. Crea una cuenta gratis</Text>
							<Text color={theme.textMuted}>3. Copia tu API Key del panel</Text>
						</Box>
					</BgBox>
				</Box>

				<Box marginTop={1}>
					<Text dimColor>
						{isAdmin
							? "↑↓ Mover · Enter para guardar · Esc atrás"
							: "Solo lectura (requiere admin)"}
					</Text>
				</Box>

				{saved && (
					<Box marginTop={1}>
						<Text bold color={theme.green}>✅ Cambios guardados</Text>
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