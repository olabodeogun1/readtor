import { createContext, useContext } from "react";

// ── Dark theme (default) ───────────────────────────────────────────────────
export const DARK = {
  bg:        "#07080f",
  surface:   "#0d0f1c",
  card:      "#111420",
  card2:     "#161926",
  border:    "#1e2235",
  border2:   "#262b3f",
  text:      "#e8e4d8",
  text2:     "#a8a49a",
  text3:     "#5a5870",
  amber:     "#e8a838",
  amber2:    "#f5c76a",
  amberGlow: "rgba(232,168,56,0.12)",
  teal:      "#3ecfb0",
  teal2:     "#5ee8cb",
  red:       "#e85555",
  serif:     "'Playfair Display', Georgia, serif",
  sans:      "'DM Sans', sans-serif",
  mono:      "'DM Mono', monospace",
};

// ── Light theme ────────────────────────────────────────────────────────────
export const LIGHT = {
  bg:        "#f7f5f0",
  surface:   "#ffffff",
  card:      "#f0ede6",
  card2:     "#e8e4db",
  border:    "#d4cfc4",
  border2:   "#c4bfb4",
  text:      "#1a1814",
  text2:     "#4a4640",
  text3:     "#8a8680",
  amber:     "#c47d10",
  amber2:    "#d4920a",
  amberGlow: "rgba(196,125,16,0.12)",
  teal:      "#1a9e88",
  teal2:     "#1db89e",
  red:       "#cc3333",
  serif:     "'Playfair Display', Georgia, serif",
  sans:      "'DM Sans', sans-serif",
  mono:      "'DM Mono', monospace",
};

// ── React context — every component reads T from here, so toggling always re-renders ──
export const ThemeCtx = createContext(DARK);
export function useTheme() { return useContext(ThemeCtx); }

// Module-level T still used by top-level non-component helpers (Btn, Tag, SVG, etc.)
// It is kept in sync by App before each render via Object.assign.
export let T = { ...DARK };
