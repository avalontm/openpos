import React from "react";
import { Text, useInput } from "ink";
import { Box, Row, Col, BgBox, theme, Input, Divider } from "@openpos/shared";
import { db, users } from "@openpos/shared";
import { sql } from "drizzle-orm";
import { useLayout, TooSmallOverlay } from "../../shared/useLayout";
import { cachedBannerLines, cachedBannerCols, reloadBanner } from "../pos/LoadingScreen.js";

const ASCII_LOGO_TOP = [
  " ██████╗ ██████╗ ███████╗███╗  ██╗    ██████╗  ██████╗ ███████╗",
  "██╔═══██╗██╔══██╗██╔════╝████╗ ██║    ██╔══██╗██╔═══██╗██╔════╝",
  "██║   ██║██████╔╝█████╗  ██╔██╗██║    ██████╔╝██║   ██║███████╗",
];
const ASCII_LOGO_BOTTOM = [
  "██║   ██║██╔═══╝ ██╔══╝  ██║╚████║    ██╔═══╝ ██║   ██║╚════██║",
  " ██████╔╝██║     ███████╗██║ ╚███║    ██║      ██████╔╝███████║",
  " ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚══╝   ╚═╝      ╚═════╝ ╚══════╝",
];

type LoginSettingsProps = {
  onLogin: (user: { username: string; role: string }) => void;
  onCancel: () => void;
};

export function LoginSettings({ onLogin, onCancel }: LoginSettingsProps) {
  const layout = useLayout();
  const { cols, rows, widthTier, heightTier, loginPanelW, refresh } = layout;

  const [username, setUsername] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [attempts, setAttempts] = React.useState(0);
  const [focus, setFocus] = React.useState<"username" | "pin">("username");

  const [bannerLines, setBannerLines] = React.useState<string[] | null>(cachedBannerLines);

  React.useEffect(() => {
    if (cols > 0 && cols !== cachedBannerCols) {
      reloadBanner(cols).then(lines => {
        setBannerLines(lines);
      });
    }
  }, [cols]);

  useInput((input, key) => {
    if (error) setError("");

    if (key.escape) {
      onCancel();
      return;
    }

    if (key.tab) {
      setFocus(f => f === "username" ? "pin" : "username");
      return;
    }

    if (key.return) {
      if (!username || !pin) {
        setError("Usuario y PIN son requeridos");
        return;
      }

      const dbUsers = db.select().from(users).where(sql`active = 1`).all();
      const validUser = dbUsers.find(
        (u: any) => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin && u.active === 1
      );

      if (!validUser) {
        const next = attempts + 1;
        setAttempts(next);
        setUsername("");
        setPin("");
        setFocus("username");
        if (next >= 3) {
          setAttempts(0);
          setError("Demasiados intentos. Limpiando...");
        } else {
          setError(`Credenciales incorrectas (${next}/3)`);
        }
        return;
      }

      if (validUser.role !== "admin") {
        setError("Se requiere acceso de administrador");
        setUsername("");
        setPin("");
        setFocus("username");
        return;
      }

      onLogin({ username: validUser.username, role: validUser.role });
      return;
    }

    if (key.upArrow || key.downArrow) {
      setFocus(f => f === "username" ? "pin" : "username");
      return;
    }
  }, { isActive: true });

  if (layout.tooSmall) return <TooSmallOverlay layout={layout} />;

  const isCompact = widthTier === "compact";
  const isShort = heightTier === "short";
  const canSubmit = Boolean(username && pin);
  const fieldW = loginPanelW - 8;

  return (
    <Col width={cols} height={rows}>
      <BgBox variant="section">
        <Row justifyContent="space-between" alignItems="center">
          <Row gap={1} alignItems="center">
            <Text color={theme.green} bold>▸</Text>
            <Text color={theme.textMuted}>CONFIGURACIÓN</Text>
          </Row>
          {!isCompact && (
            <Text color={theme.textMuted}>Administrador</Text>
          )}
        </Row>
      </BgBox>

      <Col justifyContent="center" alignItems="center" flexGrow={1} gap={isShort ? 0 : 1}>
        {!isShort && bannerLines !== null && (
          <Col alignItems="center" gap={0}>
            {bannerLines.map((line, i) => (
              <Text key={i} color={theme.green}>{line}</Text>
            ))}
          </Col>
        )}

        {!isShort && (widthTier !== "compact" && cols >= 70) && (
          <Col alignItems="center" gap={0}>
            {ASCII_LOGO_TOP.map((line, i) => (
              <Text key={`t${i}`} color={theme.white}>{line}</Text>
            ))}
            {ASCII_LOGO_BOTTOM.map((line, i) => (
              <Text key={`b${i}`} color={theme.textMuted}>{line}</Text>
            ))}
          </Col>
        )}

        {isShort || (widthTier === "compact" || cols < 70) ? (
          <Col alignItems="center" gap={1}>
            <Text color={theme.green} bold>▸ CONFIGURACIÓN</Text>
          </Col>
        ) : null}

        <BgBox variant="panel" width={loginPanelW} paddingX={3} paddingY={1}>
          <Row justifyContent="center" paddingY={1}>
            <Text color={theme.green} bold>
              {isCompact ? "─  ACCESO  ─" : "━━  ACCESO ADMINISTRADOR  ━━"}
            </Text>
          </Row>

          <Col gap={isShort ? 0 : 0}>
            <Input
              value={username}
              onChange={setUsername}
              type="text"
              width={fieldW}
              variant="default"
              isFocused={focus === "username"}
              label="USUARIO"
            />

            <Input
              value={pin}
              onChange={setPin}
              type="password"
              width={fieldW}
              variant={error ? "error" : "default"}
              isFocused={focus === "pin"}
              label="CONTRASEÑA"
            />
          </Col>

          <Divider width={fieldW} />

          <Row justifyContent="center" marginTop={1}>
            {error ? (
              <Text color={theme.red} bold>{"✗  "}{error}</Text>
            ) : canSubmit ? (
              <Text color={theme.green} bold>{"[ ENTER ]  ACCEDER  →"}</Text>
            ) : (
              <Text color={theme.textMuted}>{"[ ENTER ]  ACCEDER"}</Text>
            )}
          </Row>

          {!isShort && (
            <Row justifyContent="center" gap={2}>
              <Row gap={1}>
                <Text color={theme.textMuted} bold>Tab</Text>
                <Text color={theme.textDim}>cambiar</Text>
              </Row>
              <Text color={theme.textDim}>·</Text>
              <Row gap={1}>
                <Text color={theme.textMuted} bold>Esc</Text>
                <Text color={theme.textDim}>salir</Text>
              </Row>
            </Row>
          )}
        </BgBox>
      </Col>

      <BgBox variant="section">
        <Row justifyContent="space-between" alignItems="center">
          <Text color={theme.textDim}>v1.0.0</Text>
          <Row gap={1}>
            <Text color={theme.textDim}>Developed by</Text>
            <Text color={theme.textMuted}>AvalonTM</Text>
          </Row>
        </Row>
      </BgBox>
    </Col>
  );
}