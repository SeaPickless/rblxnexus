// src/components/ThemeCard.tsx
// Clickable theme selector card. Updates data-theme on <html> and saves to localStorage.

"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { applyTheme, type ThemeKey } from "@/lib/theme";

interface ThemeCardProps {
  themeKey:    ThemeKey;
  label:       string;
  description: string;
  base:        string;
  surface:     string;
  accent:      string;
}

export default function ThemeCard({
  themeKey, label, description, base, surface, accent,
}: ThemeCardProps) {
  const [active,  setActive]  = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const check = () => {
      const current = document.documentElement.getAttribute("data-theme") ?? "nexus-dark";
      setActive(current === themeKey);
    };
    check();
    // Re-check when theme changes elsewhere
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [themeKey]);

  function handleSelect() {
    applyTheme(themeKey);
    setActive(true);
  }

  return (
    <div
      onClick={handleSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   surface,
        border:       active
          ? `2px solid ${accent}`
          : hovered
            ? `1px solid ${accent}80`
            : `1px solid ${accent}33`,
        borderRadius: "8px",
        padding:      active ? "19px" : "20px", // compensate for 2px border
        cursor:       "pointer",
        transition:   "all 200ms ease",
        boxShadow:    active
          ? `0 0 24px ${accent}40, 0 0 48px ${accent}15`
          : hovered
            ? `0 0 20px ${accent}20`
            : `0 0 12px ${accent}0a`,
        transform:    hovered && !active ? "translateY(-1px)" : "none",
        position:     "relative",
        overflow:     "hidden",
      }}
    >
      {/* Active checkmark */}
      {active && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 20, height: 20, borderRadius: "50%",
          background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 8px ${accent}`,
        }}>
          <Check size={12} color="#000" strokeWidth={3} />
        </div>
      )}

      {/* Base color preview bar */}
      <div style={{
        width: "100%", height: 28, borderRadius: 5,
        background: base,
        border: `1px solid ${accent}22`,
        marginBottom: 12,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Color swatches */}
        <div style={{ display: "flex", height: "100%", gap: 0 }}>
          <div style={{ flex: 1, background: base }} />
          <div style={{ flex: 1, background: surface }} />
          <div style={{ flex: 1, background: accent, boxShadow: `0 0 8px ${accent}` }} />
        </div>
      </div>

      {/* 3 swatches below */}
      <div className="flex items-center gap-2 mb-3">
        {[base, surface, accent].map((color, i) => (
          <div
            key={i}
            style={{
              width: 16, height: 16, borderRadius: "50%",
              background: color,
              border: i === 2 ? `2px solid ${accent}` : `1px solid ${accent}33`,
              boxShadow: i === 2 ? `0 0 6px ${accent}` : "none",
              flexShrink: 0,
            }}
          />
        ))}
        <span style={{ fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: accent, marginLeft: "auto", fontFamily: "var(--font-mono,'JetBrains Mono'),monospace" }}>
          {accent.toUpperCase()}
        </span>
      </div>

      {/* Theme name */}
      <p style={{
        fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
        fontSize: "12px", fontWeight: 700,
        color: active ? accent : "#E8E8F0",
        letterSpacing: "0.06em",
        margin: 0, marginBottom: 3,
        textShadow: active ? `0 0 8px ${accent}` : "none",
        transition: "all 200ms ease",
      }}>
        {label}
      </p>

      {/* Description */}
      <p style={{
        fontSize: "11px",
        color: "#666677",
        margin: 0,
        letterSpacing: "0.03em",
      }}>
        {description}
      </p>
    </div>
  );
}
