import React from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { db, users, type User, BgBox, theme } from "@openpos/shared";
import { sql } from "drizzle-orm";
import { useTerminalSize } from "./useTerminalSize";

type UserConfigProps = {
	onBack: () => void;
	isAdmin: boolean;
};

type UserForm = {
	username: string;
	name: string;
	pin: string;
	role: string;
};

const EMPTY_FORM: UserForm = {
	username: "",
	name: "",
	pin: "",
	role: "cashier",
};

export function UserConfig({ onBack, isAdmin }: UserConfigProps) {
	const { cols, rows } = useTerminalSize();
	const [view, setView] = React.useState<"list" | "add" | "edit">("list");
	const [usersList, setUsersList] = React.useState<User[]>([]);
	const [selected, setSelected] = React.useState(0);
	const [form, setForm] = React.useState<UserForm>(EMPTY_FORM);
	const [editingId, setEditingId] = React.useState<number | null>(null);
	const [msg, setMsg] = React.useState("");
	const [fieldIdx, setFieldIdx] = React.useState(0);

	const panelWidth = Math.min(70, cols - 10);
	const listHeight = Math.max(8, rows - 12);

	const loadUsers = React.useCallback(() => {
		const result = db.select().from(users).where(sql`active = 1`).all();
		setUsersList(result as User[]);
	}, []);

	React.useEffect(() => {
		loadUsers();
	}, [loadUsers]);

	const handleSave = () => {
		if (!form.username || !form.pin) {
			setMsg("❌ Username y PIN son obligatorios");
			return;
		}

		if (form.pin.length < 4) {
			setMsg("❌ PIN debe tener al menos 4 dígitos");
			return;
		}

		if (view === "add") {
			const existing = db.select().from(users).where(sql`username = ${form.username}`).get();
			if (existing) {
				setMsg("❌ Ya existe un usuario con ese username");
				return;
			}

			db.insert(users).values({
				username: form.username,
				name: form.name || form.username,
				pin: form.pin,
				role: form.role || "cashier",
				active: 1,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}).run();
			setMsg("✅ Usuario agregado");
		} else if (view === "edit" && editingId) {
			db.run(sql`
				UPDATE users SET
					name = ${form.name || form.username},
					pin = ${form.pin},
					role = ${form.role},
					updated_at = datetime('now')
				WHERE id = ${editingId}
			`);
			setMsg("✅ Usuario actualizado");
		}

		setTimeout(() => {
			setMsg("");
			setView("list");
			setForm(EMPTY_FORM);
			setEditingId(null);
			loadUsers();
		}, 1500);
	};

	const handleDelete = (id: number) => {
		if (!isAdmin) return;
		db.run(sql`UPDATE users SET active = 0 WHERE id = ${id}`);
		setMsg("✅ Usuario eliminado");
		setTimeout(() => {
			setMsg("");
			loadUsers();
		}, 1000);
	};

	const startEdit = (user: User) => {
		setForm({
			username: user.username,
			name: user.name,
			pin: user.pin,
			role: user.role,
		});
		setEditingId(user.id);
		setView("edit");
	};

	useInput((input, key) => {
		if (key.escape) {
			if (view === "list") {
				onBack();
			} else {
				setView("list");
				setForm(EMPTY_FORM);
				setEditingId(null);
			}
			return;
		}

		if (view === "list") {
			if (key.upArrow) {
				setSelected((s) => Math.max(0, s - 1));
			} else if (key.downArrow) {
				setSelected((s) => Math.min(usersList.length - 1, s + 1));
			} else if (input === "e" && isAdmin && usersList[selected]) {
				startEdit(usersList[selected]!);
			} else if (input === "x" && isAdmin && usersList[selected]) {
				handleDelete(usersList[selected]!.id);
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
			setFieldIdx((f) => Math.min(3, f + 1));
		}
		if (input && /^[a-zA-Z0-9]$/.test(input)) {
			const formFields = [
				{ key: "username", label: "Username", maxLen: 20 },
				{ key: "name", label: "Nombre", maxLen: 50 },
				{ key: "pin", label: "PIN", maxLen: 10 },
				{ key: "role", label: "Rol (admin/cashier)", maxLen: 10 },
			];
			const k = formFields[fieldIdx].key as keyof UserForm;
			setForm((f) => ({ ...f, [k]: (f[k] + input).slice(0, formFields[fieldIdx].maxLen) }));
		}
		if (input === "3" || key.backspace) {
			const formFields = [
				{ key: "username", label: "Username", maxLen: 20 },
				{ key: "name", label: "Nombre", maxLen: 50 },
				{ key: "pin", label: "PIN", maxLen: 10 },
				{ key: "role", label: "Rol (admin/cashier)", maxLen: 10 },
			];
			const k = formFields[fieldIdx].key as keyof UserForm;
			setForm((f) => ({ ...f, [k]: f[k].slice(0, -1) }));
		}
	}, { isActive: true });

	if (view !== "list") {
		const formFields = [
			{ key: "username", label: "Username", maxLen: 20 },
			{ key: "name", label: "Nombre", maxLen: 50 },
			{ key: "pin", label: "PIN", maxLen: 10 },
			{ key: "role", label: "Rol (admin/cashier)", maxLen: 10 },
		];

		return (
			<Box flexDirection="column" width={cols} height={rows}>
				<BgBox variant="section" width={cols} paddingX={2}>
					<Box width={cols - 4} justifyContent="space-between">
						<Box flexDirection="row" gap={1}>
							<Text color={theme.green} bold>▸</Text>
							<Text color={theme.textMuted}>USUARIOS</Text>
						</Box>
						<Text color={theme.textMuted}>{view === "add" ? "Agregar" : "Editar"}</Text>
					</Box>
				</BgBox>

				<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
					<Box justifyContent="center" marginY={1}>
						<Text bold color={theme.cyan}>
							{view === "add" ? "➕ AGREGAR USUARIO" : "✏️ EDITAR USUARIO"}
						</Text>
					</Box>

					<BgBox variant="panel" width={panelWidth} paddingX={3} paddingY={1}>
						<Box flexDirection="column" gap={0}>
							{formFields.map((f, idx) => {
								const val = form[f.key as keyof UserForm] || "";
								const isPassword = f.key === "pin";
								return (
									<Box key={f.key} width={panelWidth - 6}>
										<Text bold color={fieldIdx === idx ? theme.green : theme.textMuted}>
											{fieldIdx === idx ? "▶ " : "  "}
										</Text>
										<Text bold color={fieldIdx === idx ? theme.green : theme.white}>
											{f.label}:
										</Text>
										<Text color={theme.amber}> {isPassword ? "••••••" : val}</Text>
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
						<Text dimColor>Username no editable</Text>
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
						<Text color={theme.textMuted}>USUARIOS</Text>
					</Box>
					<Text color={theme.textMuted}>Gestión {isAdmin && "[A] Agregar"}</Text>
				</Box>
			</BgBox>

			<Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={0}>
				<BgBox variant="panel" width={panelWidth} paddingX={2} paddingY={0}>
					<Box flexDirection="column" height={listHeight}>
						<Box width={panelWidth - 4}>
							<Text bold color={theme.textMuted}>USERNAME</Text>
							<Text bold color={theme.textMuted}> NOMBRE</Text>
							<Text bold color={theme.textMuted}> ROL</Text>
						</Box>
						{usersList.length === 0 ? (
							<Box justifyContent="center" flexGrow={1}>
								<Text color={theme.textDim}>No hay usuarios</Text>
							</Box>
						) : (
							usersList.slice(0, listHeight - 2).map((u, idx) => (
								<Box key={u.id} width={panelWidth - 4}>
									<Text color={selected === idx ? theme.green : theme.white}>
										{selected === idx ? "▶ " : "  "}
									</Text>
									<Text color={theme.white}>{u.username}</Text>
									<Text color={theme.white}> {(u.name || "").slice(0, 15)}</Text>
									<Text color={u.role === "admin" ? theme.amber : theme.cyan}>
										{" "}{u.role}
									</Text>
								</Box>
							))
						)}
					</Box>
				</BgBox>

				<Box marginTop={1}>
					<Text dimColor>
						↑↓ Navegar {isAdmin && "| [E]ditar [X]Eliminar [A]gregar"} | Esc Volver
					</Text>
				</Box>

				{msg && (
					<Box marginTop={1}>
						<Text bold color={theme.green}>{msg}</Text>
					</Box>
				)}

				<Box>
					<Text dimColor>Total: {usersList.length} usuarios</Text>
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