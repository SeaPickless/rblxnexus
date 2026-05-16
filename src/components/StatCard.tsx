// src/components/StatCard.tsx
// Generic stat display. Used in dashboards, hub summary rows, etc.

"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label:        string;
  value:        string | number;
  icon?:        LucideIcon;
  accentColor?: string; // override var(--color-accent)
  className?:   string;
  sublabel?:    string; // optional secondary line below value
}

export default function StatCard({
  label, value, icon: Icon, accentColor, className = "", sublabel,
}: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  const accent = accentColor ?? "var(--color-accent)";
  const accentRgb = accentColor ? undefined : "var(--color-accent-rgb)";

  return (
    <div
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   "var(--color-surface)",
        border:       `1px solid ${hovered ? (accentRgb ? `rgba(var(--color-accent-rgb),0.5)` : accentColor + "80") : (accentRgb ? `rgba(var(--color-accent-rgb),0.2)` : accentColor + "33")}`,
        borderRadius: "8px",
        boxShadow:    hovered
          ? `0 0 30px ${accentRgb ? `rgba(var(--color-accent-rgb),0.15)` : accentColor + "26"}`
          : `0 0 20px ${accentRgb ? `rgba(var(--color-accent-rgb),0.08)` : accentColor + "14"}`,
        transform:    hovered ? "translateY(-2px)" : "none",
        transition:   "all 200ms ease",
        padding:      "20px",
        display:      "flex",
        flexDirection:"column",
        gap:          8,
        position:     "relative",
        overflow:     "hidden",
      }}
    >
      {/* Icon top-left */}
      {Icon && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          opacity: hovered ? 0.25 : 0.12,
          transition: "opacity 200ms ease",
        }}>
          <Icon size={32} style={{ color: accent }} />
        </div>
      )}

      {/* Label */}
      <span style={{
        fontSize: "10px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif",
        fontWeight: 600,
      }}>
        {label}
      </span>

      {/* Value */}
      <span style={{
        fontFamily: "var(--font-mono,'JetBrains Mono'),monospace",
        fontSize: typeof value === "number" && value > 999999 ? "22px" : "28px",
        fontWeight: 700,
        color: accent,
        lineHeight: 1,
        filter: `drop-shadow(0 0 8px ${accent}60)`,
        letterSpacing: "-0.02em",
      }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>

      {/* Sublabel */}
      {sublabel && (
        <span style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono,'JetBrains Mono'),monospace",
          letterSpacing: "0.03em",
        }}>
          {sublabel}
        </span>
      )}

      {/* Bottom accent line */}
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        height: "2px", width: hovered ? "100%" : "30%",
        background: `linear-gradient(90deg, ${accent}, transparent)`,
        transition: "width 300ms ease",
      }} />
    </div>
  );
}
