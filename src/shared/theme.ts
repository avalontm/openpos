const ESC = String.fromCharCode(27);

function hexToAnsiBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${ESC}[48;2;${r};${g};${b}m`;
}

function hexToAnsiFg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${ESC}[38;2;${r};${g};${b}m`;
}

const DEFAULT_COLORS = {
  bg:        "#0d1117",
  bgPanel:   "#161b22",
  bgSection: "#1c2128",
  bgActive:  "#21262d",
  bgInput:   "#0d1117",
  white:     "#e6edf3",
  textPri:   "#c9d1d9",
  textSec:   "#8b949e",
  textMuted: "#484f58",
  textDim:   "#30363d",
  bgDim:     "#21262d",
  green:     "#3fb950",
  greenBr:   "#56d364",
  amber:     "#e3b341",
  amberBr:   "#f0c060",
  blue:      "#58a6ff",
  cyan:      "#39c5cf",
  red:       "#f85149",
  purple:    "#bc8cff",
  orange:    "#ffa657",
} as const;

type ThemeColors = typeof DEFAULT_COLORS;

function buildAnsi(colors: ThemeColors) {
  return {
    bg: hexToAnsiBg,
    fg: hexToAnsiFg,
    reset: `${ESC}[0m`,
    bgDefault:  hexToAnsiBg(colors.bg),
    bgPanel:    hexToAnsiBg(colors.bgPanel),
    bgSection:  hexToAnsiBg(colors.bgSection),
    bgActive:   hexToAnsiBg(colors.bgActive),
    bgHeader:   hexToAnsiBg(colors.green),
    fgWhite:    hexToAnsiFg(colors.white),
    fgPrimary:  hexToAnsiFg(colors.textPri),
    fgSecondary:hexToAnsiFg(colors.textSec),
    fgMuted:    hexToAnsiFg(colors.textMuted),
    fgGreen:    hexToAnsiFg(colors.green),
  };
}

let currentColors: ThemeColors = { ...DEFAULT_COLORS };

export const theme = {
  get bg()        { return currentColors.bg; },
  get bgPanel()   { return currentColors.bgPanel; },
  get bgSection(){ return currentColors.bgSection; },
  get bgActive() { return currentColors.bgActive; },
  get bgInput()  { return currentColors.bgInput; },
  get white()    { return currentColors.white; },
  get textPri()  { return currentColors.textPri; },
  get textSec()  { return currentColors.textSec; },
  get textMuted(){ return currentColors.textMuted; },
  get textDim() { return currentColors.textDim; },
  get bgDim()   { return currentColors.bgDim; },
  get green()   { return currentColors.green; },
  get greenBr(){ return currentColors.greenBr; },
  get amber()  { return currentColors.amber; },
  get amberBr(){ return currentColors.amberBr; },
  get blue()   { return currentColors.blue; },
  get cyan()   { return currentColors.cyan; },
  get red()    { return currentColors.red; },
  get purple(){ return currentColors.purple; },
  get orange() { return currentColors.orange; },

  get ansi() { return buildAnsi(currentColors); },

  get sym()  { return DEFAULT_SYM; },
} as const;

const DEFAULT_SYM = {
  dot:      "●",
  dotEmpty: "○",
  arrow:    "›",
  bullet:   "·",
  vbar:     "│",
  tick:     "✓",
  selected: "▌",
  prompt:   "❯",
} as const;

export const fmt = {
  money:  (n: number | undefined | null) => "$" + (n ?? 0).toFixed(2),
  ticket: (n: number) => "#" + String(n).padStart(4, "0"),
  trunc:  (s: string, len: number) => s.length > len ? s.slice(0, len - 1) + "…" : s,
  pad:    (s: string, len: number) => s.slice(0, len).padEnd(len),
};

export async function initTheme(): Promise<void> {
  try {
    const globalAny = globalThis as any;
    const Bun = globalAny.Bun;
    if (!Bun?.file) {
      console.log("[theme] Bun no disponible, usando colores por defecto");
      return;
    }
    const file = Bun.file("assets/theme-colors.json");
    const exists = await file.exists();
    if (!exists) {
      console.log("[theme] archivo no encontrado, usando colores por defecto");
      return;
    }
    const json = await file.json() as Partial<ThemeColors>;
    currentColors = { ...DEFAULT_COLORS, ...json };
    console.log("[theme] colores cargados desde assets/theme-colors.json");
  } catch (e) {
    console.log("[theme] error al cargar, usando colores por defecto:", e);
  }
}