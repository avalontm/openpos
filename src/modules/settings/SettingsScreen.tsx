import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";

type SettingsScreenProps = {
	onSelect: (option: number) => void;
};

import { BgBox, theme } from "@openpos/shared";
import { useTerminalSize } from "./useTerminalSize";

export function SettingsScreen({ onSelect }: SettingsScreenProps) {
	const { cols, rows } = useTerminalSize();
	const [selected, setSelected] = React.useState(0);

	const menuItems = [
		{ key: "1", label: "TIENDA", description: "Datos fiscales y contacto", index: 0 },
		{ key: "2", label: "FACTURACIÓN", description: "API keys y proveedor", index: 1 },
		{ key: "3", label: "PRODUCTOS", description: "Agregar, editar, eliminar", index: 2 },
		{ key: "4", label: "USUARIOS", description: "Gestión de usuarios", index: 3 },
		{ key: "5", label: "IMPUESTOS", description: "IVA y tickets", index: 4 },
		{ key: "6", label: "IMPRESORA", description: "Configuración", index: 5 },
		{ key: "7", label: "VENTAS", description: "Ver y filtrar", index: 6 },
		{ key: "8", label: "CLIENTES", description: "Gestión de clientes", index: 7 },
		{ key: "0", label: "SALIR", description: "Volver al menú", index: 8 },
	];

	useInput((input, key) => {
		if (key.upArrow) {
			setSelected((s) => (s > 0 ? s - 1 : menuItems.length - 1));
		} else if (key.downArrow) {
			setSelected((s) => (s < menuItems.length - 1 ? s + 1 : 0));
		} else if (key.return) {
			setSelected(selected);
			onSelect(selected);
		} else if (input >= "0" && input <= "8") {
			const item = menuItems.find(m => m.key === input);
			if (item) {
				setSelected(item.index);
				onSelect(item.index);
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
						<Text color={theme.textMuted}>CONFIGURACIÓN</Text>
					</Box>
					<Text color={theme.textMuted}>Menú principal</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
				<Box justifyContent="center" marginY={1}>
					<Text bold color={theme.cyan}>⚙️ CONFIGURACIÓN DEL SISTEMA ⚙️</Text>
				</Box>

				<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
					<Box flexDirection="column" gap={0}>
						{menuItems.map((item, index) => (
							<Box key={item.key} width={panelWidth - 6}>
								<Text bold color={selected === index ? theme.green : theme.textMuted}>
									{selected === index ? "▶ " : "  "}
								</Text>
								<Text bold color={selected === index ? theme.green : theme.white}>
									[{item.key}] {item.label}
								</Text>
							</Box>
						))}
					</Box>
				</BgBox>

				<Box marginTop={1} flexDirection="column">
					<Text dimColor>────────────────────────────────</Text>
					<Text dimColor>↑↓ Navegar · Enter/Seleccionar número · 0 Salir</Text>
				</Box>

				<Box marginTop={1} borderStyle="round" borderColor={theme.blue} paddingX={2}>
					<Text>{menuItems[selected]?.description || "Selecciona una opción"}</Text>
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