// src/lib/theme.ts
// Theme system for RblxNexus.
//
// Two exports:
//   ThemeScript  — React component; inject once in <head> in layout.tsx.
//                  It runs before first paint so there is zero theme flash.
//   setTheme     — call from Settings hub to switch themes at runtime.

export const THEMES = [
  {
    key:         "nexus-dark",
    label:       "Nexus Dark",
    description: "Default dark mode",
    accent:      "#A020F0",
    base:        "#0B0C0D",
  },
  {
    key:         "midnight-blue",
    label:       "Midnight Blue",
    description: "Deep ocean vibes",
    accent:      "#3B82F6",
    base:        "#070B14",
  },
  {
    key:         "cyber-green",
    label:       "Cyber Green",
    description: "Neon matrix",
    accent:      "#00FF41",
    base:        "#001000",
  },
  {
    key:         "sunset-red",
    label:       "Sunset Red",
    description: "Volcanic heat",
    accent:      "#EF4444",
    base:        "#140808",
  },
  {
    key:         "oled-black",
    label:       "OLED Black",
    description: "Pure black for OLED",
    accent:      "#A020F0",
    base:        "#000000",
  },
  {
    key:         "light-mode",
    label:       "Light Mode",
    description: "Clean and bright",
    accent:      "#7C3AED",
    base:        "#F5F5F5",
  },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];

export const DEFAULT_THEME: ThemeKey = "nexus-dark";
const LS_KEY = "rn_theme";

/** Apply a theme key to the <html> element and save it to localStorage. */
export function setTheme(key: ThemeKey): void {
  document.documentElement.setAttribute("data-theme", key);
  try {
    localStorage.setItem(LS_KEY, key);
  } catch {
    // Private browsing / storage blocked — silently ignore
  }
}

/** Read the stored theme from localStorage. Returns default if missing/invalid. */
export function getStoredTheme(): ThemeKey {
  try {
    const stored = localStorage.getItem(LS_KEY) as ThemeKey | null;
    if (stored && THEMES.some((t) => t.key === stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_THEME;
}

/**
 * ThemeScript
 * A React Server Component that injects an inline <script> into <head>.
 * The script runs synchronously before the browser paints anything, so
 * the correct data-theme is always applied on first render — no flash.
 *
 * Also bootstraps performance toggles from rn_toggles so body classes
 * (no-animations, compact-sidebar, low-bandwidth) are ready immediately.
 */
export function ThemeScript() {
  // This script is stringified and injected verbatim — keep it small.
  const script = `
(function () {
  var LS_THEME   = "rn_theme";
  var LS_TOGGLES = "rn_toggles";
  var DEFAULT    = "nexus-dark";
  var VALID      = ["nexus-dark","midnight-blue","cyber-green","sunset-red","oled-black","light-mode"];

  // --- Theme ---
  var theme = DEFAULT;
  try {
    var stored = localStorage.getItem(LS_THEME);
    if (stored && VALID.indexOf(stored) !== -1) theme = stored;
  } catch(e) {}
  document.documentElement.setAttribute("data-theme", theme);

  // --- Toggles → body classes ---
  try {
    var raw = localStorage.getItem(LS_TOGGLES);
    if (raw) {
      var t = JSON.parse(raw);
      if (t.disableAnimations) document.body.classList.add("no-animations");
      if (t.compactSidebar)    document.body.classList.add("compact-sidebar");
      if (t.lowBandwidth)      document.body.classList.add("low-bandwidth");
    }
  } catch(e) {}
})();
`.trim();

  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
