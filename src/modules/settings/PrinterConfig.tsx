import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { getPrinterConfig, savePrinterConfig, BgBox, theme, getWindowsPrinters, testPrint } from "@openpos/shared";
import { useTerminalSize } from "./useTerminalSize";

type PrinterConfigProps = {
	onBack: () => void;
	isAdmin: boolean;
};

const INTERFACE_TYPES = ["Windows Printer", "TCP", "USB", "Archivo"];
const WIDTHS = [48, 58, 80];
const CHAR_SETS = ["PC437", "PC850", "PC860", "PC863", "PC865", "PC858", "WIN1252", "ISO8859_1"];

export function PrinterConfig({ onBack, isAdmin }: PrinterConfigProps) {
	const { cols, rows } = useTerminalSize();
	const printerConfig = getPrinterConfig();
	
	const [values, setValues] = React.useState({
		printerType: printerConfig?.type || "epson",
		printerInterface: printerConfig?.interface || "printer:POS-80",
		printerWidth: printerConfig?.width || 48,
		printerCharSet: printerConfig?.characterSet || "PC437",
	});
	
	const [field, setField] = React.useState(0);
	const [saved, setSaved] = React.useState(false);
	const [testing, setTesting] = React.useState(false);
	const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
	const [windowsPrinters, setWindowsPrinters] = React.useState<string[]>([]);
	const [selectedPrinterIdx, setSelectedPrinterIdx] = React.useState(0);

	React.useEffect(() => {
		if (values.printerType === "Windows Printer") {
			const printers = getWindowsPrinters();
			setWindowsPrinters(printers);
			if (printers.length > 0) {
				const currentName = values.printerInterface.replace(/^printer:/i, "").trim();
				const idx = printers.findIndex(p => p.toLowerCase() === currentName.toLowerCase());
				setSelectedPrinterIdx(idx >= 0 ? idx : 0);
			}
		}
	}, [values.printerType]);

	const handleTestPrint = async () => {
		if (testing) return;
		setTesting(true);
		setTestResult(null);
		try {
			savePrinterConfig({
				type: values.printerType,
				interface: values.printerInterface,
				width: values.printerWidth,
				characterSet: values.printerCharSet,
			});
			const result = await testPrint();
			setTestResult({
				success: result.success,
				message: result.success ? "Impresión de prueba exitosa" : (result.error || "Error desconocido"),
			});
		} catch (err) {
			setTestResult({
				success: false,
				message: String(err),
			});
		}
		setTesting(false);
		setTimeout(() => setTestResult(null), 5000);
	};

	const fields = [
		{ key: "printerType", label: "Tipo", options: INTERFACE_TYPES },
		{ key: "printerInterface", label: "Interfaz", maxLen: 50 },
		{ key: "printerWidth", label: "Ancho", options: WIDTHS.map(String) },
		{ key: "printerCharSet", label: "Charset", options: CHAR_SETS },
	];

	useInput((input, key) => {
		if (key.escape) {
			onBack();
			return;
		}
		if (key.return) {
			if (field === 4 && isAdmin) {
				handleTestPrint();
				return;
			}
			if (isAdmin) {
				savePrinterConfig({
					type: values.printerType,
					interface: values.printerInterface,
					width: values.printerWidth,
					characterSet: values.printerCharSet,
				});
				setSaved(true);
				setTimeout(() => setSaved(false), 2000);
			}
			return;
		}
		if (key.upArrow) {
			setField((f) => isAdmin ? Math.max(0, f - 1) : Math.max(0, f - 1));
			return;
		}
		if (key.downArrow) {
			setField((f) => isAdmin ? Math.min(4, f + 1) : Math.min(fields.length - 1, f + 1));
			return;
		}
		if (key.tab) {
			if (field === 4) {
				setField(0);
			} else {
				setField((f) => Math.min(fields.length, f + 1));
			}
			return;
		}
		if (input === "t" || input === "T") {
			handleTestPrint();
			return;
		}
		if (!isAdmin) return;
		
		if (field === 0 && (key.rightArrow || input === " ")) {
			const currentIdx = INTERFACE_TYPES.indexOf(values.printerType);
			const nextIdx = (currentIdx + 1) % INTERFACE_TYPES.length;
			setValues((v) => ({ ...v, printerType: INTERFACE_TYPES[nextIdx] }));
			if (nextIdx === 0) setValues((v) => ({ ...v, printerInterface: "printer:POS-80" }));
			if (nextIdx === 1) setValues((v) => ({ ...v, printerInterface: "tcp://192.168.1.100:9100" }));
			if (nextIdx === 2) setValues((v) => ({ ...v, printerInterface: "USB" }));
			if (nextIdx === 3) setValues((v) => ({ ...v, printerInterface: "/dev/usb/lp0" }));
		}
		if (field === 0 && key.leftArrow) {
			const currentIdx = INTERFACE_TYPES.indexOf(values.printerType);
			const prevIdx = (currentIdx - 1 + INTERFACE_TYPES.length) % INTERFACE_TYPES.length;
			setValues((v) => ({ ...v, printerType: INTERFACE_TYPES[prevIdx] }));
			if (prevIdx === 0) setValues((v) => ({ ...v, printerInterface: "printer:POS-80" }));
			if (prevIdx === 1) setValues((v) => ({ ...v, printerInterface: "tcp://192.168.1.100:9100" }));
			if (prevIdx === 2) setValues((v) => ({ ...v, printerInterface: "USB" }));
			if (prevIdx === 3) setValues((v) => ({ ...v, printerInterface: "/dev/usb/lp0" }));
		}
		if (field === 2 && (key.rightArrow || input === " ")) {
			const currentIdx = WIDTHS.indexOf(values.printerWidth);
			const nextIdx = (currentIdx + 1) % WIDTHS.length;
			setValues((v) => ({ ...v, printerWidth: WIDTHS[nextIdx] }));
		}
		if (field === 2 && key.leftArrow) {
			const currentIdx = WIDTHS.indexOf(values.printerWidth);
			const prevIdx = (currentIdx - 1 + WIDTHS.length) % WIDTHS.length;
			setValues((v) => ({ ...v, printerWidth: WIDTHS[prevIdx] }));
		}
		if (field === 3 && (key.rightArrow || input === " ")) {
			const currentIdx = CHAR_SETS.indexOf(values.printerCharSet);
			const nextIdx = (currentIdx + 1) % CHAR_SETS.length;
			setValues((v) => ({ ...v, printerCharSet: CHAR_SETS[nextIdx] }));
		}
		if (field === 3 && key.leftArrow) {
			const currentIdx = CHAR_SETS.indexOf(values.printerCharSet);
			const prevIdx = (currentIdx - 1 + CHAR_SETS.length) % CHAR_SETS.length;
			setValues((v) => ({ ...v, printerCharSet: CHAR_SETS[prevIdx] }));
		}
		if (field === 1 && values.printerType === "Windows Printer" && windowsPrinters.length > 0) {
			if (key.downArrow || key.rightArrow || input === " ") {
				setSelectedPrinterIdx((i) => (i + 1) % windowsPrinters.length);
				setValues((v) => ({ ...v, printerInterface: `printer:${windowsPrinters[(selectedPrinterIdx + 1) % windowsPrinters.length]}` }));
			}
			if (key.upArrow || key.leftArrow) {
				setSelectedPrinterIdx((i) => (i - 1 + windowsPrinters.length) % windowsPrinters.length);
				setValues((v) => ({ ...v, printerInterface: `printer:${windowsPrinters[(selectedPrinterIdx - 1 + windowsPrinters.length) % windowsPrinters.length]}` }));
			}
		}
		if (field === 1 && values.printerType !== "Windows Printer" && input && /^[a-zA-Z0-9:.\-_/]$/.test(input)) {
			setValues((v) => ({
				...v,
				printerInterface: (v.printerInterface + input).slice(0, 50),
			}));
		}
		if (field === 1 && values.printerType !== "Windows Printer" && (input === "3" || key.backspace)) {
			setValues((v) => ({
				...v,
				printerInterface: v.printerInterface.slice(0, -1),
			}));
		}
	}, { isActive: true });

	const panelWidth = Math.min(55, cols - 10);

	return (
		<Box flexDirection="column" width={cols} height={rows}>
			<BgBox variant="section" width={cols} paddingX={2}>
				<Box width={cols - 4} justifyContent="space-between">
					<Box flexDirection="row" gap={1}>
						<Text color={theme.green} bold>▸</Text>
						<Text color={theme.textMuted}>IMPRESORA</Text>
					</Box>
					<Text color={theme.textMuted}>Configuración</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={1}>
				<Box justifyContent="center" marginY={1}>
					<Text bold color={theme.cyan}>🖨️ CONFIGURACIÓN DE IMPRESORA</Text>
				</Box>

				<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
					<Box flexDirection="column" gap={0}>
						<Box width={panelWidth - 6}>
							<Text bold color={field === 0 ? theme.green : theme.textMuted}>
								{field === 0 ? "▶ " : "  "}
							</Text>
							<Text bold color={field === 0 ? theme.green : theme.white}>
								Tipo:
							</Text>
							<Text color={theme.amber}> {values.printerType}</Text>
							<Text dimColor> (→ para cambiar)</Text>
						</Box>
						<Box width={panelWidth - 6}>
							<Text bold color={field === 1 ? theme.green : theme.textMuted}>
								{field === 1 ? "▶ " : "  "}
							</Text>
							<Text bold color={field === 1 ? theme.green : theme.white}>
								Interfaz:
							</Text>
							<Text color={theme.amber}> {values.printerInterface}</Text>
							{values.printerType === "Windows Printer" && windowsPrinters.length > 0 && (
								<Text dimColor> (↑↓ navegar)</Text>
							)}
							{values.printerType === "Windows Printer" && windowsPrinters.length === 0 && (
								<Text dimColor> (sin impresoras)</Text>
							)}
							{values.printerType !== "Windows Printer" && (
								<Text dimColor> (escribir)</Text>
							)}
						</Box>
						<Box width={panelWidth - 6}>
							<Text bold color={field === 2 ? theme.green : theme.textMuted}>
								{field === 2 ? "▶ " : "  "}
							</Text>
							<Text bold color={field === 2 ? theme.green : theme.white}>
								Ancho:
							</Text>
							<Text color={theme.amber}> {values.printerWidth} cols</Text>
							<Text dimColor> (→ para cambiar)</Text>
						</Box>
						<Box width={panelWidth - 6}>
							<Text bold color={field === 3 ? theme.green : theme.textMuted}>
								{field === 3 ? "▶ " : "  "}
							</Text>
							<Text bold color={field === 3 ? theme.green : theme.white}>
								Charset:
							</Text>
							<Text color={theme.amber}> {values.printerCharSet}</Text>
							<Text dimColor> (→ para cambiar)</Text>
						</Box>
					</Box>
				</BgBox>

				<Box marginTop={1}>
					<Text dimColor>
						{isAdmin
							? "↑↓ Mover · →/Espacio cambiar · Enter guardar · T prueba · Esc atrás"
							: "Solo lectura (requiere admin)"}
					</Text>
				</Box>

				{field === 4 && isAdmin && (
					<Box marginTop={1}>
						<Text bold color={field === 4 ? theme.green : theme.white}>
							{field === 4 ? "▶ " : "  "}
						</Text>
						<Text bold color={field === 4 ? theme.green : theme.white}>
							Impresión de prueba:
						</Text>
						{testing ? (
							<Text color={theme.amber}> ⏳ Imprimiendo...</Text>
						) : (
							<Text color={theme.amber}> (Presiona T o Enter)</Text>
						)}
					</Box>
				)}

				{field !== 4 && isAdmin && (
					<Box marginTop={1}>
						<Text dimColor>
							{field === 4 ? "▶ " : "  "}
							<Text bold color={field === 4 ? theme.green : theme.white}>🖨️ Prueba:</Text>
							<Text color={theme.amber}> (Presiona T)</Text>
						</Text>
					</Box>
				)}

				{saved && (
					<Box marginTop={1}>
						<Text bold color={theme.green}>✅ Cambios guardados</Text>
					</Box>
				)}

				{testResult && (
					<Box marginTop={1}>
						<Text bold color={testResult.success ? theme.green : theme.red}>
							{testResult.success ? "✅" : "❌"} {testResult.message}
						</Text>
					</Box>
				)}

				<Box marginTop={1} borderStyle="round" borderColor={theme.blue} paddingX={2}>
					<Text>
						Interfaz actual: {values.printerInterface}
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