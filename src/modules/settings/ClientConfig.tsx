import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { db, clients, listClients, getClientByRfc, type Client, BgBox, theme } from "@openpos/shared";
import { sql } from "drizzle-orm";
import { useTerminalSize } from "./useTerminalSize";

type ClientConfigProps = {
	onBack: () => void;
	isAdmin: boolean;
};

type ClientForm = {
	rfc: string;
	razonSocial: string;
	email: string;
	telefono: string;
	direccion: string;
	regimenFiscal: string;
	puntos: string;
};

const EMPTY_FORM: ClientForm = {
	rfc: "",
	razonSocial: "",
	email: "",
	telefono: "",
	direccion: "",
	regimenFiscal: "601",
	puntos: "0",
};

export function ClientConfig({ onBack, isAdmin }: ClientConfigProps) {
	const { cols, rows } = useTerminalSize();
	const [view, setView] = React.useState<"list" | "add" | "edit">("list");
	const [clientsList, setClientsList] = React.useState<Client[]>([]);
	const [selected, setSelected] = React.useState(0);
	const [search, setSearch] = React.useState("");
	const [form, setForm] = React.useState<ClientForm>(EMPTY_FORM);
	const [editingRfc, setEditingRfc] = React.useState<string | null>(null);
	const [msg, setMsg] = React.useState("");
	const [fieldIdx, setFieldIdx] = React.useState(0);

	const panelWidth = Math.min(75, cols - 8);
	const listHeight = Math.max(8, rows - 12);

	const loadClients = React.useCallback(() => {
		const result = listClients(search || undefined);
		setClientsList(result as Client[]);
	}, [search]);

	React.useEffect(() => {
		loadClients();
	}, [loadClients]);

	const handleSave = () => {
		if (!form.rfc || !form.razonSocial) {
			setMsg("❌ RFC y razón social son obligatorios");
			return;
		}

		if (form.rfc.length < 10) {
			setMsg("❌ RFC debe tener al menos 10 caracteres");
			return;
		}

		const clientData = {
			rfc: form.rfc.toUpperCase(),
			razonSocial: form.razonSocial.toUpperCase(),
			email: form.email.toLowerCase(),
			telefono: form.telefono || undefined,
			direccion: form.direccion || undefined,
			regimenFiscal: form.regimenFiscal || undefined,
			puntos: parseFloat(form.puntos) || 0,
		};

		if (view === "add") {
			const existing = getClientByRfc(form.rfc.toUpperCase());
			if (existing) {
				setMsg("❌ Ya existe un cliente con ese RFC");
				return;
			}

			db.insert(clients).values({
				code: "CL-" + String(Date.now()).slice(-5),
				...clientData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}).run();
			setMsg("✅ Cliente agregado");
		} else if (view === "edit" && editingRfc) {
			db.run(sql`
				UPDATE clients SET
					razon_social = ${clientData.razonSocial},
					email = ${clientData.email},
					telefono = ${clientData.telefono},
					direccion = ${clientData.direccion},
					regimen_fiscal = ${clientData.regimenFiscal},
					puntos = ${clientData.puntos},
					updated_at = datetime('now')
				WHERE rfc = ${editingRfc}
			`);
			setMsg("✅ Cliente actualizado");
		}

		setTimeout(() => {
			setMsg("");
			setView("list");
			setForm(EMPTY_FORM);
			setEditingRfc(null);
			loadClients();
		}, 1500);
	};

	const handleDelete = (rfc: string) => {
		if (!isAdmin) return;
		db.run(sql`DELETE FROM clients WHERE rfc = ${rfc}`);
		setMsg("✅ Cliente eliminado");
		setTimeout(() => {
			setMsg("");
			loadClients();
		}, 1000);
	};

	const startEdit = (client: Client) => {
		setForm({
			rfc: client.rfc,
			razonSocial: client.razonSocial,
			email: client.email || "",
			telefono: client.telefono || "",
			direccion: client.direccion || "",
			regimenFiscal: client.regimenFiscal || "601",
			puntos: (client.puntos || 0).toString(),
		});
		setEditingRfc(client.rfc);
		setView("edit");
	};

	useInput((input, key) => {
		if (key.escape) {
			if (view === "list") {
				onBack();
			} else {
				setView("list");
				setForm(EMPTY_FORM);
				setEditingRfc(null);
			}
			return;
		}

		if (view === "list") {
			if (key.upArrow) {
				setSelected((s) => Math.max(0, s - 1));
			} else if (key.downArrow) {
				setSelected((s) => Math.min(clientsList.length - 1, s + 1));
			} else if (input === "e" && isAdmin && clientsList[selected]) {
				startEdit(clientsList[selected]!);
			} else if (input === "x" && isAdmin && clientsList[selected]) {
				handleDelete(clientsList[selected]!.rfc);
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
			setFieldIdx((f) => Math.min(6, f + 1));
		}
		if (input && /^[a-zA-Z0-9@.\- ]$/.test(input)) {
			const formFields = [
				{ key: "rfc", label: "RFC", maxLen: 13 },
				{ key: "razonSocial", label: "Razón Social", maxLen: 100 },
				{ key: "email", label: "Email", maxLen: 100 },
				{ key: "telefono", label: "Teléfono", maxLen: 20 },
				{ key: "direccion", label: "Dirección", maxLen: 200 },
				{ key: "regimenFiscal", label: "Régimen", maxLen: 10 },
				{ key: "puntos", label: "Puntos", maxLen: 10 },
			];
			const k = formFields[fieldIdx].key as keyof ClientForm;
			setForm((f) => ({ ...f, [k]: (f[k] + input).slice(0, formFields[fieldIdx].maxLen) }));
		}
		if (input === "3" || key.backspace) {
			const formFields = [
				{ key: "rfc", label: "RFC", maxLen: 13 },
				{ key: "razonSocial", label: "Razón Social", maxLen: 100 },
				{ key: "email", label: "Email", maxLen: 100 },
				{ key: "telefono", label: "Teléfono", maxLen: 20 },
				{ key: "direccion", label: "Dirección", maxLen: 200 },
				{ key: "regimenFiscal", label: "Régimen", maxLen: 10 },
				{ key: "puntos", label: "Puntos", maxLen: 10 },
			];
			const k = formFields[fieldIdx].key as keyof ClientForm;
			setForm((f) => ({ ...f, [k]: f[k].slice(0, -1) }));
		}
	}, { isActive: true });

	if (view !== "list") {
		const formFields = [
			{ key: "rfc", label: "RFC", maxLen: 13 },
			{ key: "razonSocial", label: "Razón Social", maxLen: 100 },
			{ key: "email", label: "Email", maxLen: 100 },
			{ key: "telefono", label: "Teléfono", maxLen: 20 },
			{ key: "direccion", label: "Dirección", maxLen: 200 },
			{ key: "regimenFiscal", label: "Régimen", maxLen: 10 },
			{ key: "puntos", label: "Puntos", maxLen: 10 },
		];

		return (
			<Box flexDirection="column" width={cols} height={rows}>
				<BgBox variant="section" width={cols} paddingX={2}>
					<Box width={cols - 4} justifyContent="space-between">
						<Box flexDirection="row" gap={1}>
							<Text color={theme.green} bold>▸</Text>
							<Text color={theme.textMuted}>CLIENTES</Text>
						</Box>
						<Text color={theme.textMuted}>{view === "add" ? "Agregar" : "Editar"}</Text>
					</Box>
				</BgBox>

				<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
					<Box justifyContent="center" marginY={1}>
						<Text bold color={theme.cyan}>
							{view === "add" ? "➕ AGREGAR CLIENTE" : "✏️ EDITAR CLIENTE"}
						</Text>
					</Box>

					<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
						<Box flexDirection="column" gap={0}>
							{formFields.map((f, idx) => {
								const val = form[f.key as keyof ClientForm] || "";
								const isReadOnly = view === "edit" && f.key === "rfc";
								return (
									<Box key={f.key} width={panelWidth - 6}>
										<Text bold color={fieldIdx === idx ? theme.green : theme.textMuted}>
											{fieldIdx === idx ? "▶ " : "  "}
										</Text>
										<Text bold color={fieldIdx === idx ? theme.green : theme.white}>
											{f.label}:
										</Text>
										<Text color={isReadOnly ? theme.textDim : theme.amber}> {val}</Text>
									</Box>
								);
							})}
						</Box>
					</BgBox>

					<Box marginTop={1}>
						<Text dimColor>↑↓ Mover · Escribir · Enter guardar · Esc cancelar</Text>
					</Box>

					{msg && (
						<Box marginTop={1}>
							<Text bold color={theme.green}>{msg}</Text>
						</Box>
					)}

					{view === "edit" && (
						<Text dimColor>RFC no editable</Text>
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
						<Text color={theme.textMuted}>CLIENTES</Text>
					</Box>
					<Text color={theme.textMuted}>Gestión {isAdmin && "[A] Agregar"}</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
				<Box>
					<Text>Buscar: </Text>
					<Text color={theme.amber}>{search || "..."}</Text>
				</Box>

				<BgBox variant="panel" width={panelWidth} paddingX={2} paddingY={0}>
					<Box flexDirection="column" height={listHeight}>
						<Box width={panelWidth - 4}>
							<Text bold color={theme.textMuted}>CÓDIGO</Text>
							<Text bold color={theme.textMuted}> RFC</Text>
							<Text bold color={theme.textMuted}> RAZÓN SOCIAL</Text>
							<Text bold color={theme.textMuted}> PUNTOS</Text>
						</Box>
						{clientsList.length === 0 ? (
							<Box justifyContent="center" flexGrow={1}>
								<Text color={theme.textDim}>No hay clientes</Text>
							</Box>
						) : (
							clientsList.slice(0, listHeight - 2).map((c, idx) => (
								<Box key={c.id} width={panelWidth - 4}>
									<Text color={selected === idx ? theme.green : theme.white}>
										{selected === idx ? "▶ " : "  "}
									</Text>
									<Text color={theme.cyan}>{c.code}</Text>
									<Text color={theme.white}> {c.rfc}</Text>
									<Text color={theme.white}> {(c.razonSocial || "").slice(0, 15)}</Text>
									<Text color={theme.amber}> {(c.puntos || 0).toFixed(0)}</Text>
								</Box>
							))
						)}
					</Box>
				</BgBox>

				<Box marginTop={1}>
					<Text dimColor>
						↑↓ Navegar {isAdmin && "| [E]ditar [X]Eliminar [A]gregar"} | / Buscar | Esc Volver
					</Text>
				</Box>

				{msg && (
					<Box marginTop={1}>
						<Text bold color={theme.green}>{msg}</Text>
					</Box>
				)}

				<Box>
					<Text dimColor>Total: {clientsList.length} clientes</Text>
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