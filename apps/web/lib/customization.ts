import { type CSSProperties } from "react";
import { type AuthUser } from "@/lib/auth-types";

export type CustomizationSettings = {
  boardTheme: "green" | "blue" | "wood" | "marble";
  pieceStyle: "classic" | "neon" | "pixel" | "premium";
  highlightColor: "#f0c040" | "#3b82f6" | "#81b64c" | "#cc3030";
  animations: boolean;
  sounds: boolean;
};

export const defaultCustomization: CustomizationSettings = {
  animations: true,
  boardTheme: "green",
  highlightColor: "#81b64c",
  pieceStyle: "classic",
  sounds: true
};

export const boardThemes: Record<
  CustomizationSettings["boardTheme"],
  { dark: string; label: string; light: string; premium: boolean }
> = {
  blue: { dark: "#4f6f9f", label: "Синяя", light: "#dbeafe", premium: false },
  green: { dark: "#769656", label: "Зелёная", light: "#eeeed2", premium: false },
  marble: { dark: "#64748b", label: "Мрамор", light: "#f8fafc", premium: true },
  wood: { dark: "#9a6735", label: "Дерево", light: "#f0d9b5", premium: false }
};

export const pieceStyles: Record<CustomizationSettings["pieceStyle"], { label: string; premium: boolean }> = {
  classic: { label: "Классик", premium: false },
  neon: { label: "Неон", premium: false },
  pixel: { label: "Пиксель", premium: false },
  premium: { label: "Premium", premium: true }
};

export const highlightColors: Array<{
  label: string;
  premium: boolean;
  value: CustomizationSettings["highlightColor"];
}> = [
  { label: "Жёлтый", premium: false, value: "#f0c040" },
  { label: "Синий", premium: false, value: "#3b82f6" },
  { label: "Зелёный", premium: false, value: "#81b64c" },
  { label: "Красный", premium: true, value: "#cc3030" }
];

export function getBoardThemeStyle(settings: CustomizationSettings): CSSProperties {
  const theme = boardThemes[settings.boardTheme];

  return {
    "--color-square-dark": theme.dark,
    "--color-square-light": theme.light,
    "--color-highlight": toAlpha(settings.highlightColor, 0.45)
  } as CSSProperties;
}

export function readCustomization(): CustomizationSettings {
  if (typeof window === "undefined") {
    return defaultCustomization;
  }

  return {
    animations: window.localStorage.getItem("chessAnimations") !== "false",
    boardTheme: readEnum("chessBoardTheme", defaultCustomization.boardTheme, boardThemes),
    highlightColor: readHighlightColor(),
    pieceStyle: readEnum("chessPieceStyle", defaultCustomization.pieceStyle, pieceStyles),
    sounds: window.localStorage.getItem("chessSounds") !== "false"
  };
}

export function persistCustomization(settings: CustomizationSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("chessBoardTheme", settings.boardTheme);
  window.localStorage.setItem("chessPieceStyle", settings.pieceStyle);
  window.localStorage.setItem("chessHighlightColor", settings.highlightColor);
  window.localStorage.setItem("chessAnimations", String(settings.animations));
  window.localStorage.setItem("chessSounds", String(settings.sounds));
}

export function toCustomizationSettings(preferences: NonNullable<AuthUser["preferences"]>): CustomizationSettings {
  return {
    animations: preferences.animations,
    boardTheme: isBoardTheme(preferences.boardTheme) ? preferences.boardTheme : defaultCustomization.boardTheme,
    highlightColor: isHighlightColor(preferences.highlightColor) ? preferences.highlightColor : defaultCustomization.highlightColor,
    pieceStyle: isPieceStyle(preferences.pieceStyle) ? preferences.pieceStyle : defaultCustomization.pieceStyle,
    sounds: preferences.sounds
  };
}

function readEnum<T extends string>(key: string, fallback: T, options: Record<T, unknown>): T {
  const value = window.localStorage.getItem(key);

  return value && value in options ? (value as T) : fallback;
}

function readHighlightColor(): CustomizationSettings["highlightColor"] {
  const value = window.localStorage.getItem("chessHighlightColor");

  if (isHighlightColor(value)) {
    return value;
  }

  return defaultCustomization.highlightColor;
}

function isHighlightColor(value: string | null): value is CustomizationSettings["highlightColor"] {
  return value === "#f0c040" || value === "#3b82f6" || value === "#81b64c" || value === "#cc3030";
}

function isBoardTheme(value: string): value is CustomizationSettings["boardTheme"] {
  return value in boardThemes;
}

function isPieceStyle(value: string): value is CustomizationSettings["pieceStyle"] {
  return value in pieceStyles;
}

function toAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
}
