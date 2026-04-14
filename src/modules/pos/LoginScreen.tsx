import React from "react";
import { Box, Text, useInput } from "ink";
import { useAuth } from "../../store/auth.js";
import { BgBox } from "../../shared/components/BgBox.js";
import { theme } from "../../shared/theme.js";
import { useLayout, TooSmallOverlay } from "../../shared/useLayout.js";
import { cachedBannerLines } from "./LoadingScreen.js";

// ── Fallback ASCII logo ────────────────────────────────────────────────────────
// Used when banner.png is missing or terminal-image is not installed.
// Two halves so we can dim the bottom rows to simulate depth.
const LOGO_TOP = [
  " ██████╗ ██████╗ ███████╗███╗  ██╗    ██████╗  ██████╗ ███████╗",
  "██╔═══██╗██╔══██╗██╔════╝████╗ ██║    ██╔══██╗██╔═══██╗██╔════╝",
  "██║   ██║██████╔╝█████╗  ██╔██╗██║    ██████╔╝██║   ██║███████╗",
];
const LOGO_BOTTOM = [
  "██║   ██║██╔═══╝ ██╔══╝  ██║╚████║    ██╔═══╝ ██║   ██║╚════██║",
  " ██████╔╝██║     ███████╗██║ ╚███║    ██║      ██████╔╝███████║",
  " ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚══╝   ╚═╝      ╚═════╝ ╚══════╝",
];
// Width of the ASCII art in characters
const ASCII_LOGO_W = 65;

// ── Logo sub-component ────────────────────────────────────────────────────────
function Logo({ widthTier, heightTier, cols }: {
  widthTier:  ReturnType<typeof useLayout>["widthTier"];
  heightTier: ReturnType<typeof useLayout>["heightTier"];
  cols:       number;
}) {
  // On short terminals skip the logo entirely to save vertical space
  if (heightTier === "short") return null;

  // Image cached from the loading phase — render it directly
  if (cachedBannerLines !== null) {
    return (
      <Box flexDirection="column" alignItems="center">
        {cachedBannerLines.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
        <Box justifyContent="center">
          <Text color={theme.textDim}>v1.0.0</Text>
        </Box>
      </Box>
    );
  }

  // Compact terminal: ASCII logo is wider than the terminal — show text fallback
  if (widthTier === "compact" || cols < ASCII_LOGO_W + 4) {
    return (
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text color={theme.green} bold>▸ OpenPos</Text>
        <Text color={theme.textDim}>v1.0.0</Text>
      </Box>
    );
  }

  // Full ASCII logo
  return (
    <Box flexDirection="column" alignItems="center">
      {LOGO_TOP.map((line, i) => (
        <Text key={`t${i}`} color={theme.white}>{line}</Text>
      ))}
      {LOGO_BOTTOM.map((line, i) => (
        <Text key={`b${i}`} color={theme.textMuted}>{line}</Text>
      ))}
      <Box width={ASCII_LOGO_W} justifyContent="flex-end">
        <Text color={theme.textDim}>v1.0.0</Text>
      </Box>
    </Box>
  );
}

// ── Field sub-component ───────────────────────────────────────────────────────
function Field({
  label,
  value,
  focused,
  focusColor,
  placeholder,
  masked = false,
  fieldW,
}: {
  label:       string;
  value:       string;
  focused:     boolean;
  focusColor:  string;
  placeholder: string;
  masked?:     boolean;
  fieldW:      number;
}) {
  const displayValue = masked ? "●".repeat(value.length) : value;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1}>
        <Text color={focused ? focusColor : theme.textMuted}>
          {focused ? "◉" : "○"}
        </Text>
        <Text color={focused ? theme.white : theme.textMuted} bold>
          {label}
        </Text>
      </Box>
      <Box
        borderStyle={focused ? "single" : undefined}
        borderColor={focusColor}
        paddingX={focused ? 1 : 0}
        marginLeft={focused ? 0 : 2}
        width={fieldW}
      >
        <Text color={focused ? focusColor : theme.textSec}>
          {value
            ? displayValue + (focused ? "▌" : "")
            : focused
              ? "▌"
              : <Text color={theme.textDim}>{placeholder}</Text>
          }
        </Text>
      </Box>
    </Box>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  onLogin: () => void;
};

// ── Main component ────────────────────────────────────────────────────────────
export function LoginScreen({ onLogin }: Props) {
  const { login }  = useAuth();
  const layout     = useLayout();
  const { cols, rows, widthTier, heightTier, loginPanelW, refresh } = layout;

  const [username, setUsername] = React.useState("");
  const [pin,      setPin]      = React.useState("");
  const [focus,    setFocus]    = React.useState<"username" | "pin">("username");
  const [error,    setError]    = React.useState("");
  const [attempts, setAttempts] = React.useState(0);

  // Refresh layout dimensions after mount (quick)
  React.useEffect(() => {
    const t = setTimeout(refresh, 16);
    return () => clearTimeout(t);
  }, [refresh]);

  useInput((input, key) => {
    if (error) setError("");

    if (key.tab) {
      setFocus(f => f === "username" ? "pin" : "username");
      return;
    }

    if (key.backspace) {
      if (focus === "username") setUsername(s => s.slice(0, -1));
      if (focus === "pin")      setPin(s => s.slice(0, -1));
      return;
    }

    if (focus === "username" && /^[a-zA-Z0-9]$/.test(input)) {
      if (username.length < 20) setUsername(s => s + input);
      return;
    }

    if (focus === "pin" && /^[0-9]$/.test(input)) {
      if (pin.length < 6) setPin(s => s + input);
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
            setError(`Credenciales incorrectas (${next}/3)`);
          }
        }
      }
      return;
    }

    if (key.escape) {
      if (focus === "username") setUsername("");
      if (focus === "pin")      setPin("");
      return;
    }
  });

  // ── Too small guard ────────────────────────────────────────────────────────
  if (layout.tooSmall) return <TooSmallOverlay layout={layout} />;

  // ── Derived sizing ─────────────────────────────────────────────────────────
  // Field width = panel inner width minus padding and border
  const fieldW    = loginPanelW - 10;
  // Divider inside the panel
  const dividerW  = loginPanelW - 8;
  // Header/footer label visibility
  const showSubtitle = widthTier !== "compact";

  return (
    <Box flexDirection="column" width={cols} height={rows}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <BgBox variant="section" width={cols} paddingX={2}>
        <Box width={cols - 4} justifyContent="space-between">
          <Text color={theme.textMuted}>
            <Text color={theme.green} bold>▸</Text>
            {"  TIENDA POS"}
          </Text>
          {showSubtitle && (
            <Text color={theme.textMuted}>Sistema de Punto de Venta</Text>
          )}
        </Box>
      </BgBox>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        flexGrow={1}
        gap={heightTier === "short" ? 0 : 1}
      >
        {/* Logo — hidden on short terminals */}
        <Logo widthTier={widthTier} heightTier={heightTier} cols={cols} />

        {/* ── Login panel ─────────────────────────────────────────────── */}
        <BgBox variant="panel" width={loginPanelW} paddingX={3} paddingY={1}>

          {/* Panel title */}
          <Box justifyContent="center" marginBottom={1}>
            <Text color={theme.green} bold>
              {widthTier === "compact"
                ? "─  ACCESO  ─"
                : "━━  ACCESO AL SISTEMA  ━━"
              }
            </Text>
          </Box>

          {/* Username */}
          <Field
            label="USUARIO"
            value={username}
            focused={focus === "username"}
            focusColor={theme.amber}
            placeholder="sin usuario"
            fieldW={fieldW}
          />

          {/* Password */}
          <Field
            label="CONTRASENA"
            value={pin}
            focused={focus === "pin"}
            focusColor={theme.green}
            placeholder="sin contrasena"
            masked
            fieldW={fieldW}
          />

          <Text color={theme.textDim}>{"─".repeat(dividerW)}</Text>

          {/* Error or submit prompt */}
          {error ? (
            <Box justifyContent="center" marginTop={1}>
              <Text color={theme.red} bold>{"!  "}{error}</Text>
            </Box>
          ) : (
            <Box justifyContent="center" marginTop={1}>
              {username && pin ? (
                <Text color={theme.green} bold>{"[ ENTER ]  ACCEDER  ->"}</Text>
              ) : (
                <Text color={theme.textMuted}>{"[ ENTER ]  ACCEDER"}</Text>
              )}
            </Box>
          )}

          {/* Keyboard hints — hidden on very short terminals */}
          {heightTier !== "short" && (
            <Box justifyContent="center" marginTop={1} gap={2}>
              <Text color={theme.textDim}>
                <Text color={theme.textMuted} bold>Tab</Text>
                {" cambiar"}
              </Text>
              <Text color={theme.textDim}>{"·"}</Text>
              <Text color={theme.textDim}>
                <Text color={theme.textMuted} bold>Esc</Text>
                {" limpiar"}
              </Text>
            </Box>
          )}

        </BgBox>
      </Box>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <BgBox variant="section" width={cols} paddingX={2}>
        <Box width={cols - 4} justifyContent="space-between">
          <Text color={theme.textDim}>v1.0.0</Text>
          <Text color={theme.textDim}>
            {"Developed by "}
            <Text color={theme.textMuted}>AvalonTM</Text>
          </Text>
        </Box>
      </BgBox>

    </Box>
  );
}