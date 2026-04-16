export {};
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
declare module "bun:sqlite" {
  class SQLite {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): Statement;
  }

  interface Statement {
    run(...params: unknown[]): void;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export { SQLite as Database };
}

declare module "pngjs" {
  export class PNG {
    width: number;
    height: number;
    data: Buffer;
    filter(Filter?: number): void;
    sync: boolean;
  }
  export function parse(buffer: Buffer): PNG;
}

declare module "node-thermal-printer" {
  export type PrinterTypes = "epson" | "star" | "fit" | "citoh" | "ideal" | "laurel" | "p8227" | "raw" | (string & {});
  export type CharacterSet = 
    | "PC437" | "PC850" | "PC860" | "PC863" | "PC865" | "PC866" | "PC851" | "PC853"
    | "PC857" | "PC858" | "PC737" | "ISO8859-7" | "WIN1251" | "WIN1252" | "WIN1255"
    | "UTF8" | (string & {});

  interface PrinterConfig {
    type?: PrinterTypes;
    interface?: string;
    characterSet?: CharacterSet;
    width?: number;
    timeout?: number;
  }

  class Printer {
    constructor(config: PrinterConfig);
    isPrinterConnected(): Promise<boolean>;
    printImage(options: { alpha?: number; width?: number; height?: number }): Promise<void>;
    println(text: string): void;
    raw(data: Buffer | number[]): void;
    execute(): Promise<void>;
  }

  const printer: {
    (config: PrinterConfig): Printer;
    default: typeof Printer;
  };
  export default printer;
}

declare module "ink-text-input" {
  import * as React from "react";

  interface Props {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: () => void;
    placeholder?: string;
    disabled?: boolean;
  }

  const TextInput: React.FC<Props>;
  export default TextInput;
}

declare module "terminal-image" {
  export default function terminalImage(
    buffer: Buffer | string,
    options?: { width?: number; height?: number; preserveAspectRatio?: boolean }
  ): Promise<string>;
}

import React from "react";
import "ink";

declare module "ink" {
  interface BoxProps {
    color?: string;
    size?: string;
    onPress?: () => void;
    zIndex?: number;
    onClick?: () => void;
    onMouseEnter?: () => void | boolean;
    onMouseLeave?: () => void | boolean;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
    opacity?: number | string;
    style?: React.CSSProperties;
    borderRadius?: number;
    borderTop?: boolean | string;
    borderBottom?: boolean | string;
    borderLeft?: boolean | string;
    borderRight?: boolean | string;
    dim?: boolean;
  }

  interface TextProps {
    bold?: boolean;
    dim?: boolean;
    dimColor?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void | boolean;
    onMouseLeave?: () => void | boolean;
  }

  interface SpacerProps {
    visibility?: "visible" | "hidden" | "auto";
  }
}
