// src/components/LoadingBar.tsx
// Used by EVERY component that fetches from /api/proxy/*.
// Props:
//   progress       — 0-100 for determinate, null for indeterminate shimmer
//   estimatedSeconds — shown below bar as "est. Xs"
//   label          — override "Loading..." text (optional)

"use client";

import { useEffect, useState } from "react";

interface LoadingBarProps {
  progress?:        number | null; // null = indeterminate
  estimatedSeconds?: number;
  label?:           string;
  className?:       string;
}

// Detect if animations are disabled (disableAnimations toggle)
function useAnimationsDisabled() {
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    const check = () =>
      setDisabled(document.body.classList.contains("no-animations"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return disabled;
}

export default function LoadingBar({
  progress         = null,
  estimatedSeconds = 2,
  label            = "Loading...",
  className        = "",
}: LoadingBarProps) {
  const noAnim      = useAnimationsDisabled();
  const indeterminate = progress === null || progress === undefined;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {/* "Loading..." label */}
      <p
        style={{
          fontFamily:    "var(--font-rajdhani, 'Rajdhani'), sans-serif",
          fontSize:      "12px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color:         "rgba(var(--color-accent-rgb, 160,32,240), 0.8)",
          margin:        0,
        }}
      >
        {label}
      </p>

      {/* Bar track */}
      <div
        style={{
          width:        "100%",
          height:       "4px",
          borderRadius: "2px",
          background:   "rgba(var(--color-accent-rgb, 160,32,240), 0.15)",
          overflow:     "hidden",
          position:     "relative",
        }}
      >
        {/* Bar fill */}
        <div
          style={{
            position:     "absolute",
            top:          0,
            left:         0,
            height:       "100%",
            borderRadius: "2px",
            background:   "var(--color-accent, #A020F0)",
            filter:       "drop-shadow(0 0 4px rgba(var(--color-accent-rgb, 160,32,240), 0.9))",
            /* Determinate width */
            width:        indeterminate ? "40%" : `${Math.min(100, Math.max(0, progress!))}%`,
            transition:   noAnim || indeterminate ? "none" : "width 500ms ease",
            /* Indeterminate shimmer */
            animation:    indeterminate && !noAnim
              ? "lb-shimmer 1.4s ease-in-out infinite"
              : "none",
          }}
        />
      </div>

      {/* "est. Xs" label */}
      <p
        style={{
          fontFamily:    "var(--font-mono, 'JetBrains Mono'), monospace",
          fontSize:      "11px",
          letterSpacing: "0.04em",
          color:         "var(--color-text-muted, #555566)",
          margin:        0,
        }}
      >
        est. {estimatedSeconds}s
      </p>

      {/* Keyframes injected once via a style tag */}
      <style>{`
        @keyframes lb-shimmer {
          0%   { transform: translateX(-250%); }
          100% { transform: translateX(450%); }
        }
      `}</style>
    </div>
  );
}
