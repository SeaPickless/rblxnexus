// src/lib/theme.ts
// Theme definitions and management utilities.
// All theme reads/writes go through these helpers — never access
// localStorage or data-theme directly from components.

export const THEMES = [
  {
    key:         "nexus-dark",
    label:       "Nexus Dark",
    description: "Default dark mode",
    base:        "#0B0C0D",
    surface:     "#16181A",
    accent:      "#A020F0",
    preview:     ["#0B0C0D", "#16181A", "#A020F0"],
  },
  {
    key:         "midnight-blue",
    label:       "Midnight Blue",
    description: "Deep ocean vibes",
    base:        "#070B14",
    surface:     "#0E1525",
    accent:      "#3B82F6",
    preview:     ["#070B14", "#0E1525", "#3B82F6"],
  },
  {
    key:         "cyber-green",
    label:       "Cyber Green",
    description: "Neon matrix",
    base:        "#001000",
    surface:     "#001A00",
    accent:      "#00FF41",
    preview:     ["#001000", "#001A00", "#00FF41"],
  },
  {
    key:         "sunset-red",
    label:       "Sunset Red",
    description: "Volcanic heat",
    base:        "#140808",
    surface:     "#201010",
    accent:      "#EF4444",
    preview:     ["#140808", "#201010", "#EF4444"],
  },
  {
    key:         "oled-black",
    label:       "OLED Black",
    description: "Pure black for OLED",
    base:        "#000000",
    surface:     "#0A0A0A",
    accent:      "#A020F0",
    preview:     ["#000000", "#0A0A0A", "#A020F0"],
  },
  {
    key:         "light-mode",
    label:       "Light Mode",
    description: "Clean and bright",
    base:        "#F5F5F5",
    surface:     "#FFFFFF",
    accent:      "#7C3AED",
    preview:     ["#F5F5F5", "#FFFFFF", "#7C3AED"],
  },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];
export type ThemeDefinition = (typeof THEMES)[number];

const VALID_KEYS = THEMES.map((t) => t.key) as string[];
const STORAGE_KEY = "rn_theme";
const DEFAULT: ThemeKey = "nexus-dark";

/**
 * Read the current theme key from localStorage.
 * Falls back to "nexus-dark" if nothing is stored or the value is invalid.
 * Safe to call on the server (returns default).
 */
export function getTheme(): ThemeKey {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved && VALID_KEYS.includes(saved) ? saved : DEFAULT) as ThemeKey;
  } catch {
    return DEFAULT;
  }
}

/**
 * Apply a theme: sets data-theme on <html> and persists to localStorage.
 * Call this from settings page or theme picker.
 */
export function applyTheme(key: ThemeKey): void {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", key);
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // localStorage unavailable — still applied in DOM
  }
}

/**
 * Returns the full theme definition object for a given key.
 */
export function getThemeDefinition(key: ThemeKey): ThemeDefinition {
  return THEMES.find((t) => t.key === key) ?? THEMES[0];
}
