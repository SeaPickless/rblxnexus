// src/lib/toggles.ts
// Performance toggle state management.
// Reads/writes the rn_toggles localStorage key.
// All toggle access in components must go through these helpers.

const STORAGE_KEY = "rn_toggles";

export interface Toggles {
  /** Adds .no-animations to body — kills all CSS animations/transitions */
  disableAnimations: boolean;
  /** Collapses sidebar to 48px icon-only mode */
  compactSidebar: boolean;
  /** Auto-pings all API Health endpoints every 60s while hub is active */
  autoRefresh: boolean;
  /** Shows numeric Roblox user IDs alongside usernames everywhere */
  showUserIds: boolean;
  /** Skips avatar/thumbnail images — shows initials placeholders instead */
  lowBandwidth: boolean;
}

export const DEFAULT_TOGGLES: Toggles = {
  disableAnimations: false,
  compactSidebar:    false,
  autoRefresh:       false,
  showUserIds:       false,
  lowBandwidth:      false,
};

export const TOGGLE_META: Record<
  keyof Toggles,
  { label: string; description: string }
> = {
  disableAnimations: {
    label:       "Disable Animations",
    description: "Turns off all CSS animations and transitions for maximum performance.",
  },
  compactSidebar: {
    label:       "Compact Sidebar",
    description: "Collapses the sidebar to icon-only mode (48px). Labels appear as tooltips on hover.",
  },
  autoRefresh: {
    label:       "Auto Refresh",
    description: "API Health Monitor auto-pings all endpoints every 60 seconds while active.",
  },
  showUserIds: {
    label:       "Show User IDs",
    description: "Displays numeric Roblox user IDs alongside usernames throughout the app.",
  },
  lowBandwidth: {
    label:       "Low Bandwidth Mode",
    description: "Skips loading avatar and thumbnail images. Initials-based placeholders shown instead.",
  },
};

/**
 * Read all toggle states from localStorage.
 * Merges with defaults so new toggles are always defined.
 * Safe to call on server (returns defaults).
 */
export function getToggles(): Toggles {
  if (typeof window === "undefined") return { ...DEFAULT_TOGGLES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TOGGLES };
    return { ...DEFAULT_TOGGLES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_TOGGLES };
  }
}

/**
 * Set a single toggle and persist to localStorage.
 * Also applies side-effects (body class mutations) immediately.
 */
export function setToggle<K extends keyof Toggles>(key: K, value: Toggles[K]): void {
  if (typeof window === "undefined") return;
  const current = getToggles();
  const next = { ...current, [key]: value };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore write failures
  }
  applySideEffects(key, value as boolean);
}

/**
 * Replace the entire toggle state object.
 * Useful when saving from the settings page.
 */
export function saveToggles(toggles: Toggles): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
  } catch {
    // ignore
  }
  // Re-apply all side effects
  (Object.keys(toggles) as (keyof Toggles)[]).forEach((key) =>
    applySideEffects(key, toggles[key] as boolean)
  );
}

/**
 * Apply DOM side effects for a toggle change.
 * Called automatically by setToggle and saveToggles.
 */
function applySideEffects(key: keyof Toggles, value: boolean): void {
  switch (key) {
    case "disableAnimations":
      if (value) document.body.classList.add("no-animations");
      else        document.body.classList.remove("no-animations");
      break;
    case "compactSidebar":
      if (value) document.body.classList.add("compact-sidebar");
      else        document.body.classList.remove("compact-sidebar");
      break;
    // autoRefresh, showUserIds, lowBandwidth have no immediate DOM side effects —
    // they are read by the relevant hub/component at render time.
    default:
      break;
  }
}
