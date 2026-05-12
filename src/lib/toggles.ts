// src/lib/toggles.ts
// Performance toggle system for RblxNexus.
//
// Toggles are stored in localStorage under key "rn_toggles".
// Body classes + CSS variables are applied immediately at boot via ThemeScript.
// At runtime, call setToggle() to flip a toggle on/off.
//
// Available toggles (all default OFF):
//   disableAnimations — adds class no-animations to body
//   compactSidebar    — adds class compact-sidebar to body (48px wide sidebar)
//   autoRefresh       — enables 60s auto-ping in API Health Monitor hub
//   showUserIds       — show numeric Roblox IDs next to usernames app-wide
//   lowBandwidth      — skip avatar/thumb images, show initials fallbacks

const LS_KEY = "rn_toggles";

export interface Toggles {
  disableAnimations: boolean;
  compactSidebar:    boolean;
  autoRefresh:       boolean;
  showUserIds:       boolean;
  lowBandwidth:      boolean;
}

const DEFAULTS: Toggles = {
  disableAnimations: false,
  compactSidebar:    false,
  autoRefresh:       false,
  showUserIds:       false,
  lowBandwidth:      false,
};

// Map toggle key → body CSS class (only for toggles that need one)
const BODY_CLASSES: Partial<Record<keyof Toggles, string>> = {
  disableAnimations: "no-animations",
  compactSidebar:    "compact-sidebar",
  lowBandwidth:      "low-bandwidth",
};

/** Read toggles from localStorage, merging with defaults for any missing keys. */
export function getToggles(): Toggles {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Toggles>;
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULTS };
}

/** Persist the full toggles object to localStorage. */
function saveToggles(t: Toggles): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(t));
  } catch {
    // ignore
  }
}

/**
 * Set a single toggle on or off.
 * Persists to localStorage and immediately applies/removes the body class.
 * Dispatches a "rblx:togglechange" CustomEvent so React components can react.
 */
export function setToggle(key: keyof Toggles, value: boolean): void {
  const current = getToggles();
  const next    = { ...current, [key]: value };
  saveToggles(next);

  // Apply body class side-effect
  const cls = BODY_CLASSES[key];
  if (cls) {
    document.body.classList.toggle(cls, value);
  }

  // Notify listeners (Sidebar, etc.)
  window.dispatchEvent(
    new CustomEvent("rblx:togglechange", { detail: { key, value, toggles: next } })
  );
}

/**
 * Flip a toggle (on → off, off → on).
 * Convenience wrapper around setToggle.
 */
export function flipToggle(key: keyof Toggles): boolean {
  const current = getToggles();
  const next    = !current[key];
  setToggle(key, next);
  return next;
}

/**
 * React hook — subscribe to toggle state with live updates.
 *
 * Usage:
 *   import { useToggle } from "@/lib/toggles";
 *   const showIds = useToggle("showUserIds");
 */
export function useToggle(key: keyof Toggles): boolean {
  // Lazy import React so this file stays importable in non-React contexts
  // (e.g. middleware, API routes).
  const { useState, useEffect } = require("react") as typeof import("react");

  const [value, setValue] = useState<boolean>(() => {
    if (typeof window === "undefined") return DEFAULTS[key];
    return getToggles()[key];
  });

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ key: keyof Toggles; value: boolean }>).detail;
      if (detail.key === key) setValue(detail.value);
    }
    // Also handle the Sidebar collapse event emitted as "rblx:toggle"
    function legacyHandler(e: Event) {
      const toggleKey = (e as CustomEvent<keyof Toggles>).detail;
      if (toggleKey === key) setValue(getToggles()[key]);
    }
    window.addEventListener("rblx:togglechange", handler);
    window.addEventListener("rblx:toggle", legacyHandler);
    return () => {
      window.removeEventListener("rblx:togglechange", handler);
      window.removeEventListener("rblx:toggle", legacyHandler);
    };
  }, [key]);

  return value;
}

/**
 * React hook — get and set a toggle as a pair [value, setter].
 *
 * Usage:
 *   const [compact, setCompact] = useToggleState("compactSidebar");
 */
export function useToggleState(
  key: keyof Toggles
): [boolean, (v: boolean) => void] {
  const value = useToggle(key);
  return [value, (v: boolean) => setToggle(key, v)];
}
