import React from "react";
import { Text, useInput } from "ink";
import { Box, Row, Col, BgBox, theme, Text_, Input, Divider } from "@openpos/shared";
import { useAuth } from "../../shared/useAuth";
import { useLayout, TooSmallOverlay } from "../../shared/useLayout";
import { cachedBannerLines, cachedBannerCols, reloadBanner } from "./LoadingScreen.js";

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

type Props = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: Props) {
  const { login } = useAuth();
  const layout = useLayout();
  const { cols, rows, widthTier, heightTier, loginPanelW, refresh } = layout;

  const [username, setUsername] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [attempts, setAttempts] = React.useState(0);
  const [focus, setFocus] = React.useState<"username" | "pin">("username");

  // Local banner state: initialize from cache, re-generate if cols mismatch
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

    if (key.tab) {
      setFocus(f => f === "username" ? "pin" : "username");
      return;
    }

    if (key.escape) {
      setUsername("");
      setPin("");
      setError("");
      setAttempts(0);
      return;
    }

    if (key.return) {
      if (username && pin) {
        const success = login(username, pin);
        if (success) {
          onLogin();
        } else {
          const next = attempts + 1;
          setAttempts(next);
          setPin("");
          if (next >= 3) {
            setUsername("");
            setPin("");
            setAttempts(0);
            setError("Demasiados intentos. Limpiando...");
          } else {
            setError(`Incorrectas (${next}/3)`);
          }
        }
      }
      return;
    }
  });

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
            <Text color={theme.textMuted}>TIENDA POS</Text>
          </Row>
          {!isCompact && (
            <Text color={theme.textMuted}>Sistema de Punto de Venta</Text>
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
            <Text color={theme.green} bold>▸ OpenPOS</Text>
          </Col>
        ) : null}

        <BgBox variant="panel" width={loginPanelW} paddingX={3} paddingY={1}>
          <Row justifyContent="center" paddingY={1}>
            <Text color={theme.green} bold>
              {isCompact ? "─  ACCESO  ─" : "━━  ACCESO AL SISTEMA  ━━"}
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
              label="PIN"
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
                <Text color={theme.textDim}>limpiar</Text>
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