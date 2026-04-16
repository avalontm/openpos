import React from "react";
import { Text, useInput } from "ink";
import { Box, Row, Col, BgBox, theme, Divider, Input } from "@openpos/shared";
import { useLayout, TooSmallOverlay } from "../../shared/useLayout";
import { getConfig, setConfig, CONFIG_KEYS } from "@openpos/shared";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

function getTermsPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const basePath = path.resolve(__dirname, "..", "..", "..");
  if (existsSync(path.join(basePath, "assets", "readme.txt"))) {
    return path.join(basePath, "assets", "readme.txt");
  }
  return path.join(basePath, "cli", "assets", "readme.txt");
}

const TERMS_PATH = getTermsPath();

const DEFAULT_TERMS = `===============================================
        TERMINOS Y CONDICIONES
===============================================

AVISO IMPORTANTE:

OpenPOS es un software de Punto de Venta de codigo 
abierto (Open Source) publicado bajo licencia 
GPLv2.

Este software es gratuito. Si pagaste por el, 
consulte al vendedor para resolver esa situacion.

OpenPOS esta disponible gratuitamente en GitHub 
y puede ser utilizado, modificado y distribuido 
bajo los terminos de la licencia GPLv2.

El autor no se hace responsable del uso 
indebido del software ni de posibles perdidas 
de datos.

Al usar este software, acepta estos terminos.

===============================================
GitHub: https://github.com/avalontm/openpos
Autor: AvalonTM
Licencia: GPLv2
===============================================`;

type Props = {
  onAccept: () => void;
};

export function TermsScreen({ onAccept }: Props) {
  const layout = useLayout();
  const { cols, rows, widthTier, heightTier, loginPanelW, loadPanelW } = layout;

  const [terms, setTerms] = React.useState("");
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [accepted, setAccepted] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (existsSync(TERMS_PATH)) {
      try {
        const content = readFileSync(TERMS_PATH, "utf-8");
        setTerms(content);
      } catch {
        setTerms(DEFAULT_TERMS);
      }
    } else {
      setTerms(DEFAULT_TERMS);
    }
  }, []);

  const lines = terms.split("\n");
  const maxScroll = Math.max(0, lines.length - (rows - 15));
  const visibleLines = lines.slice(scrollOffset, scrollOffset + (rows - 15));

  useInput((input, key) => {
    if (key.escape) {
      setError("");
      return;
    }

    if (key.upArrow) {
      setScrollOffset((o) => Math.max(0, o - 1));
      return;
    }

    if (key.downArrow) {
      setScrollOffset((o) => Math.min(maxScroll, o + 1));
      return;
    }

    if (key.pageUp) {
      setScrollOffset((o) => Math.max(0, o - 10));
      return;
    }

    if (key.pageDown) {
      setScrollOffset((o) => Math.min(maxScroll, o + 10));
      return;
    }

    if (input === " ") {
      setAccepted((a) => !a);
      return;
    }

    if (key.return && accepted) {
      setConfig(CONFIG_KEYS.TERMS_ACCEPTED, "true");
      onAccept();
      return;
    }
  });

  if (layout.tooSmall) return <TooSmallOverlay layout={layout} />;

  const panelW = loadPanelW + 8;
  const isCompact = widthTier === "compact";

  return (
    <Col width={cols} height={rows}>
      <BgBox variant="section">
        <Row justifyContent="space-between" alignItems="center">
          <Row gap={1} alignItems="center">
            <Text color={theme.green} bold>▸</Text>
            <Text color={theme.textMuted}>TERMINOS Y CONDICIONES</Text>
          </Row>
          {!isCompact && (
            <Text color={theme.textMuted}>OpenPOS v1.0</Text>
          )}
        </Row>
      </BgBox>

      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <BgBox variant="panel" width={panelW} paddingX={2} paddingY={1}>
          <Box flexDirection="column" height={rows - 15}>
            {visibleLines.map((line, i) => (
              <Text key={i} color={theme.textSec} bold={false}>
                {line.padEnd(panelW - 4)}
              </Text>
            ))}
          </Box>

          {maxScroll > 0 && (
            <Row justifyContent="center" gap={2}>
              <Text color={theme.textDim} bold>↑↓</Text>
              <Text color={theme.textMuted}>Scroll</Text>
            </Row>
          )}

          <Divider width={panelW - 4} />

          <Col alignItems="center" gap={0}>
            <Row gap={1}>
              <Text color={accepted ? theme.green : theme.textMuted}>
                {accepted ? "◉" : "○"}
              </Text>
              <Text color={accepted ? theme.green : theme.textMuted}>
                Acepto los terminos y condiciones
              </Text>
            </Row>

            <Divider width={panelW - 4} />

            {error && (
              <Row justifyContent="center">
                <Text color={theme.red} bold>{error}</Text>
              </Row>
            )}

            <Row justifyContent="center" marginTop={1}>
              {accepted ? (
                <Text color={theme.green} bold>
                  {"[ ENTER ]  ACEPTAR Y CONTINUAR  →"}
                </Text>
              ) : (
                <Text color={theme.textMuted}>
                  Presiona ESPACIO para aceptar
                </Text>
              )}
            </Row>

            <Row justifyContent="center" gap={2} marginTop={0}>
              <Row gap={1}>
                <Text color={theme.textMuted} bold>Espacio</Text>
                <Text color={theme.textDim}>aceptar</Text>
              </Row>
              <Text color={theme.textDim}>·</Text>
              <Row gap={1}>
                <Text color={theme.textMuted} bold>Esc</Text>
                <Text color={theme.textDim}>cancelar</Text>
              </Row>
            </Row>
          </Col>
        </BgBox>
      </Box>

      <BgBox variant="section">
        <Row justifyContent="space-between" alignItems="center">
          <Text color={theme.textDim}>OpenPOS - Open Source (GPLv2)</Text>
          <Text color={theme.textMuted}>https://github.com/avalontm/openpos</Text>
        </Row>
      </BgBox>
    </Col>
  );
}