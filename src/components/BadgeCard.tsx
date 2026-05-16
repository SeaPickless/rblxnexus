// src/components/BadgeCard.tsx
// Compact card for a Roblox badge. Shows icon, name, game, awarded date.
// Description revealed on hover/tap.

"use client";

import { useState } from "react";
import Image from "next/image";
import { Award } from "lucide-react";
import { getToggles } from "@/lib/toggles";

interface BadgeCardProps {
  badgeId:      number;
  name:         string;
  description?: string;
  gameName?:    string;
  awardedDate?: string; // ISO string
  iconUrl?:     string | null;
}

export default function BadgeCard({
  badgeId, name, description, gameName, awardedDate, iconUrl,
}: BadgeCardProps) {
  const [hovered,   setHovered]   = useState(false);
  const [showDesc,  setShowDesc]  = useState(false);
  const { lowBandwidth } = getToggles();

  const formattedDate = awardedDate
    ? new Date(awardedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <div
      onMouseEnter={() => { setHovered(true); setShowDesc(true); }}
      onMouseLeave={() => { setHovered(false); setShowDesc(false); }}
      onClick={() => setShowDesc(!showDesc)}
      style={{
        background:    "var(--color-surface)",
        border:        `1px solid ${hovered ? "rgba(var(--color-accent-rgb),0.5)" : "rgba(var(--color-accent-rgb),0.2)"}`,
        borderRadius:  "8px",
        boxShadow:     hovered ? "0 0 30px rgba(var(--color-accent-rgb),0.15)" : "0 0 20px rgba(var(--color-accent-rgb),0.08)",
        transform:     hovered ? "translateY(-2px)" : "none",
        transition:    "all 200ms ease",
        padding:       "16px",
        cursor:        "pointer",
        position:      "relative",
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
        gap:           10,
      }}
    >
      {/* Icon + name row */}
      <div className="flex items-start gap-3">
        {/* Badge icon */}
        <div style={{
          width: 52, height: 52, flexShrink: 0,
          borderRadius: "8px", overflow: "hidden",
          border: "1.5px solid rgba(var(--color-accent-rgb),0.5)",
          boxShadow: "0 0 10px rgba(var(--color-accent-rgb),0.3)",
          background: "var(--color-elevated)",
          position: "relative",
        }}>
          {iconUrl && !lowBandwidth ? (
            <Image src={iconUrl} alt={name} fill sizes="52px" style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={22} style={{ color: "rgba(var(--color-accent-rgb),0.5)" }} />
            </div>
          )}
        </div>

        {/* Name + game */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
            fontSize: "12px", fontWeight: 700,
            color: "var(--color-text-primary)",
            letterSpacing: "0.04em",
            margin: 0, marginBottom: 3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {name}
          </p>
          {gameName && (
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0, letterSpacing: "0.03em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {gameName}
            </p>
          )}
          {formattedDate && (
            <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "10px", color: "var(--color-accent)", margin: 0, marginTop: 3 }}>
              Awarded {formattedDate}
            </p>
          )}
        </div>
      </div>

      {/* Description tooltip — shown on hover/tap */}
      {description && (
        <div style={{
          maxHeight: showDesc ? "120px" : 0,
          overflow: "hidden",
          transition: "max-height 250ms ease",
        }}>
          <p style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
            margin: 0,
            padding: "8px 10px",
            background: "rgba(var(--color-accent-rgb),0.05)",
            borderRadius: "6px",
            border: "1px solid rgba(var(--color-accent-rgb),0.1)",
          }}>
            {description}
          </p>
        </div>
      )}
    </div>
  );
}
