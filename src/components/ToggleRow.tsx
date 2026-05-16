// src/components/ToggleRow.tsx
// Toggle switch row for the Settings hub. Saves state to localStorage rn_toggles.

"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { setToggle, type Toggles } from "@/lib/toggles";

interface ToggleRowProps {
  icon:        LucideIcon;
  name:        string;
  description: string;
  toggleKey:   keyof Toggles;
  value:       boolean;
  onChange?:   (key: keyof Toggles, value: boolean) => void;
}

export default function ToggleRow({
  icon: Icon, name, description, toggleKey, value, onChange,
}: ToggleRowProps) {
  const [on, setOn] = useState(value);
  const [hovered, setHovered] = useState(false);

  function handleToggle() {
    const next = !on;
    setOn(next);
    setToggle(toggleKey, next);
    onChange?.(toggleKey, next);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          16,
        padding:      "16px 20px",
        borderRadius: "8px",
        background:   hovered ? "rgba(var(--color-accent-rgb),0.04)" : "var(--color-surface)",
        border:       `1px solid ${hovered ? "rgba(var(--color-accent-rgb),0.25)" : "rgba(var(--color-accent-rgb),0.12)"}`,
        transition:   "all 200ms ease",
        cursor:       "pointer",
      }}
      onClick={handleToggle}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        borderRadius: "8px",
        background: on ? "rgba(var(--color-accent-rgb),0.12)" : "var(--color-elevated)",
        border: `1px solid ${on ? "rgba(var(--color-accent-rgb),0.4)" : "rgba(var(--color-accent-rgb),0.1)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 200ms ease",
        boxShadow: on ? "0 0 10px rgba(var(--color-accent-rgb),0.2)" : "none",
      }}>
        <Icon size={16} style={{ color: on ? "var(--color-accent)" : "var(--color-text-muted)", transition: "color 200ms ease" }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif",
          fontSize: "14px", fontWeight: 600,
          color: on ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          letterSpacing: "0.04em",
          margin: 0, marginBottom: 2,
          transition: "color 200ms ease",
        }}>
          {name}
        </p>
        <p style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
          margin: 0,
          lineHeight: 1.4,
        }}>
          {description}
        </p>
      </div>

      {/* Toggle switch */}
      <div
        style={{
          width: 44, height: 24, flexShrink: 0,
          borderRadius: "999px",
          background: on
            ? "var(--color-accent)"
            : "rgba(var(--color-accent-rgb),0.15)",
          boxShadow: on
            ? "0 0 12px rgba(var(--color-accent-rgb),0.5), 0 0 24px rgba(var(--color-accent-rgb),0.2)"
            : "none",
          position: "relative",
          transition: "all 250ms ease",
          border: `1px solid ${on ? "var(--color-accent)" : "rgba(var(--color-accent-rgb),0.2)"}`,
        }}
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
      >
        {/* Thumb */}
        <div style={{
          position: "absolute",
          top: 2,
          left: on ? "calc(100% - 20px - 2px)" : "2px",
          width: 18, height: 18,
          borderRadius: "50%",
          background: on ? "#fff" : "rgba(var(--color-accent-rgb),0.5)",
          boxShadow: on ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
          transition: "left 250ms ease, background 250ms ease",
        }} />
      </div>
    </div>
  );
}
