// src/components/GameCard.tsx
// Grid card for a Roblox game. Fetches thumbnail + votes server-side via proxy.
// Never calls roblox.com from the browser.

"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, Star, ExternalLink } from "lucide-react";
import { getToggles } from "@/lib/toggles";

interface GameCardProps {
  universeId:   number;
  name:         string;
  creatorName:  string;
  playing:      number;
  visits:       number;
  upVotes:      number;
  downVotes:    number;
  thumbnailUrl?: string | null;
  onClick?:     (universeId: number) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function GameCard({
  universeId, name, creatorName, playing, visits,
  upVotes, downVotes, thumbnailUrl, onClick,
}: GameCardProps) {
  const [hovered, setHovered] = useState(false);
  const { lowBandwidth } = getToggles();

  const totalVotes = upVotes + downVotes;
  const likeRatio  = totalVotes > 0 ? upVotes / totalVotes : 0;
  const likePercent = Math.round(likeRatio * 100);

  // Like ratio bar color
  const ratioColor = likeRatio >= 0.8 ? "#22c55e" : likeRatio >= 0.5 ? "#eab308" : "#ef4444";

  return (
    <div
      onClick={() => onClick?.(universeId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   "var(--color-surface)",
        border:       `1px solid ${hovered ? "rgba(var(--color-accent-rgb),0.5)" : "rgba(var(--color-accent-rgb),0.2)"}`,
        borderRadius: "8px",
        boxShadow:    hovered ? "0 0 30px rgba(var(--color-accent-rgb),0.15)" : "0 0 20px rgba(var(--color-accent-rgb),0.08)",
        transform:    hovered ? "translateY(-2px)" : "none",
        transition:   "all 200ms ease",
        cursor:       onClick ? "pointer" : "default",
        overflow:     "hidden",
        display:      "flex",
        flexDirection:"column",
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "var(--color-elevated)", flexShrink: 0 }}>
        {thumbnailUrl && !lowBandwidth ? (
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            style={{ objectFit: "cover", borderRadius: "8px 8px 0 0" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={32} style={{ color: "rgba(var(--color-accent-rgb),0.25)" }} />
          </div>
        )}
        {/* Playing count overlay */}
        <div style={{
          position: "absolute", bottom: 8, left: 8,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          borderRadius: "4px", padding: "2px 8px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Users size={11} style={{ color: "var(--color-accent)" }} />
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "11px", color: "var(--color-accent)", fontWeight: 600 }}>
            {formatCount(playing)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {/* Game name */}
        <span style={{
          fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
          fontSize: "13px", fontWeight: 700,
          color: "var(--color-text-primary)",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          display: "block",
        }}>
          {name}
        </span>

        {/* Creator */}
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)", letterSpacing: "0.04em" }}>
          by {creatorName}
        </span>

        {/* Visits */}
        <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "11px", color: "var(--color-text-secondary)" }}>
          {formatCount(visits)} visits
        </span>

        {/* Like ratio bar */}
        <div style={{ marginTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Like ratio</span>
            <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "10px", color: ratioColor }}>{likePercent}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(var(--color-accent-rgb),0.1)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${likePercent}%`,
              background: ratioColor,
              boxShadow: `0 0 6px ${ratioColor}`,
              transition: "width 600ms ease",
            }} />
          </div>
        </div>

        {/* View link */}
        <a
          href={`https://www.roblox.com/games/${universeId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px 12px", borderRadius: 6,
            border: "1px solid rgba(var(--color-accent-rgb),0.3)",
            color: "var(--color-accent)", fontSize: "10px",
            fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
            letterSpacing: "0.1em", textTransform: "uppercase",
            textDecoration: "none", background: "transparent",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(var(--color-accent-rgb),0.25)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
        >
          <ExternalLink size={11} />
          View Game
        </a>
      </div>
    </div>
  );
}
