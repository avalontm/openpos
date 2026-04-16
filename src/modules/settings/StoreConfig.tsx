import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { getConfig, setConfig, CONFIG_KEYS, BgBox, theme } from "@openpos/shared";
import { useTerminalSize } from "./useTerminalSize";

type StoreConfigProps = {
	onBack: () => void;
	isAdmin: boolean;
};

export function StoreConfig({ onBack, isAdmin }: StoreConfigProps) {
	const { cols, rows } = useTerminalSize();
	const [field, setField] = React.useState(0);
	const [values, setValues] = React.useState(() => ({
		storeName: getConfig(CONFIG_KEYS.STORE_NAME) || "",
		storeRfc: getConfig(CONFIG_KEYS.STORE_RFC) || "",
		storeLegalName: getConfig(CONFIG_KEYS.STORE_LEGAL_NAME) || "",
		storeAddress: getConfig(CONFIG_KEYS.STORE_ADDRESS) || "",
		storeEmail: getConfig(CONFIG_KEYS.STORE_EMAIL) || "",
		storePhone: getConfig(CONFIG_KEYS.STORE_PHONE) || "",
		storeRegimen: getConfig(CONFIG_KEYS.STORE_REGIMEN) || "601",
	}));

	const [saved, setSaved] = React.useState(false);
	const [error, setError] = React.useState(false);

	const fields = [
		{ key: "storeName", label: "Nombre de tienda", maxLen: 50 },
		{ key: "storeRfc", label: "RFC", maxLen: 13 },
		{ key: "storeLegalName", label: "Razón social", maxLen: 100 },
		{ key: "storeAddress", label: "Dirección", maxLen: 200 },
		{ key: "storeEmail", label: "Email", maxLen: 100 },
		{ key: "storePhone", label: "Teléfono", maxLen: 20 },
		{ key: "storeRegimen", label: "Régimen fiscal", maxLen: 10 },
	];

	const currentField = fields[field]!;

	useInput((input, key) => {
		if (key.escape) {
			onBack();
			return;
		}
		if (key.return) {
			if (isAdmin) {
				let allSaved = true;
				Object.entries(values).forEach(([k, v]) => {
					const ok = setConfig(k, v);
					if (!ok) allSaved = false;
				});
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
			setField((f) => Math.max(0, f - 1));
		} else if (key.downArrow) {
			setField((f) => Math.min(fields.length - 1, f + 1));
		}
		if (isAdmin && input) {
			const key2 = currentField.key as keyof typeof values;
			const newVal = (values[key2] + input).slice(0, currentField.maxLen);
			setValues((v) => ({ ...v, [key2]: newVal }));
		}
		if (isAdmin && (input === "3" || key.backspace)) {
			const key2 = currentField.key as keyof typeof values;
			setValues((v) => ({ ...v, [key2]: v[key2].slice(0, -1) }));
		}
	}, { isActive: true });

	const panelWidth = Math.min(60, cols - 10);

	return (
		<Box flexDirection="column" width={cols} height={rows}>
			<BgBox variant="section" width={cols} paddingX={2}>
				<Box width={cols - 4} justifyContent="space-between">
					<Box flexDirection="row" gap={1}>
						<Text color={theme.green} bold>▸</Text>
						<Text color={theme.textMuted}>TIENDA</Text>
					</Box>
					<Text color={theme.textMuted}>Configuración</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
				<Box justifyContent="center" marginY={1}>
					<Text bold color={theme.cyan}>🏪 CONFIGURACIÓN DE TIENDA</Text>
				</Box>

				<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
					<Box flexDirection="column" gap={0}>
						{fields.map((f, idx) => {
							const valKey = f.key as keyof typeof values;
							return (
								<Box key={f.key} width={panelWidth - 6}>
									<Text bold color={field === idx ? theme.green : theme.textMuted}>
										{field === idx ? "▶ " : "  "}
									</Text>
									<Text bold color={field === idx ? theme.green : theme.white}>
										{f.label}:
									</Text>
									<Text color={isAdmin ? theme.amber : theme.textDim}> {isAdmin ? values[valKey] : "******"}</Text>
								</Box>
							);
						})}
					</Box>
				</BgBox>

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