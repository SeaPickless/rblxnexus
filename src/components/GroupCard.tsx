// src/components/GroupCard.tsx
// Full group profile card with icon, stats, shout, expandable description.

"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Users, Lock, Globe, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { getToggles } from "@/lib/toggles";

interface GroupCardProps {
  groupId:      number;
  name:         string;
  description?: string;
  memberCount:  number;
  ownerName?:   string;
  ownerAvatarUrl?: string | null;
  isPublic:     boolean;
  shout?:       { body: string; poster: { username: string }; updated: string } | null;
  iconUrl?:     string | null;
}

export default function GroupCard({
  groupId, name, description, memberCount,
  ownerName, ownerAvatarUrl, isPublic, shout, iconUrl,
}: GroupCardProps) {
  const [hovered,  setHovered]  = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const { lowBandwidth } = getToggles();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   "var(--color-surface)",
        border:       `1px solid ${hovered ? "rgba(var(--color-accent-rgb),0.5)" : "rgba(var(--color-accent-rgb),0.2)"}`,
        borderRadius: "8px",
        boxShadow:    hovered ? "0 0 30px rgba(var(--color-accent-rgb),0.15)" : "0 0 20px rgba(var(--color-accent-rgb),0.08)",
        transform:    hovered ? "translateY(-2px)" : "none",
        transition:   "all 200ms ease",
        padding:      "20px",
        display:      "flex",
        flexDirection:"column",
        gap:          14,
      }}
    >
      {/* ── Header: icon + name + badges ── */}
      <div className="flex items-start gap-4">
        {/* Group icon */}
        <div style={{
          width: 60, height: 60, flexShrink: 0, position: "relative",
          borderRadius: "8px", overflow: "hidden",
          border: "1.5px solid rgba(var(--color-accent-rgb),0.5)",
          boxShadow: "0 0 10px rgba(var(--color-accent-rgb),0.3)",
          background: "var(--color-elevated)",
        }}>
          {iconUrl && !lowBandwidth ? (
            <Image src={iconUrl} alt={name} fill sizes="60px" style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} style={{ color: "rgba(var(--color-accent-rgb),0.4)" }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <p style={{
            fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
            fontSize: "15px", fontWeight: 700,
            color: "var(--color-text-primary)",
            letterSpacing: "0.05em", margin: 0, marginBottom: 4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {name}
          </p>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Public/Private chip */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "2px 8px", borderRadius: "999px",
              border: `1px solid ${isPublic ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
              color: isPublic ? "#22c55e" : "#ef4444",
            }}>
              {isPublic ? <Globe size={9} /> : <Lock size={9} />}
              {isPublic ? "Public" : "Private"}
            </span>

            {/* Member count */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "11px", color: "var(--color-text-muted)" }}>
              <Users size={11} />
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color: "var(--color-accent)", fontWeight: 600 }}>
                {memberCount.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Owner row ── */}
      {ownerName && (
        <div className="flex items-center gap-2">
          {ownerAvatarUrl && !lowBandwidth ? (
            <div style={{ width: 20, height: 20, borderRadius: "50%", overflow: "hidden", position: "relative", border: "1px solid rgba(var(--color-accent-rgb),0.3)", flexShrink: 0 }}>
              <Image src={ownerAvatarUrl} alt={ownerName} fill sizes="20px" style={{ objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "8px", color: "var(--color-accent)", fontWeight: 700 }}>{ownerName.charAt(0)}</span>
            </div>
          )}
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", letterSpacing: "0.03em" }}>
            Owner: <span style={{ color: "var(--color-text-secondary)" }}>{ownerName}</span>
          </span>
        </div>
      )}

      {/* ── Description ── */}
      {description && (
        <div>
          <p style={{
            fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0,
            display: "-webkit-box", WebkitBoxOrient: "vertical",
            WebkitLineClamp: descOpen ? "unset" : 3,
            overflow: descOpen ? "visible" : "hidden",
          }}>
            {description}
          </p>
          {description.length > 140 && (
            <button
              onClick={() => setDescOpen(!descOpen)}
              style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: "11px", color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: 0, letterSpacing: "0.05em" }}
            >
              {descOpen ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
            </button>
          )}
        </div>
      )}

      {/* ── Shout ── */}
      {shout?.body && (
        <div style={{
          padding: "10px 12px", borderRadius: 6,
          background: "rgba(var(--color-accent-rgb),0.04)",
          border: "1px solid rgba(var(--color-accent-rgb),0.12)",
        }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare size={11} style={{ color: "var(--color-text-muted)" }} />
            <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Shout · {shout.poster.username} · {new Date(shout.updated).toLocaleDateString()}
            </span>
          </div>
          <p style={{ fontStyle: "italic", fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: 0 }}>
            "{shout.body}"
          </p>
        </div>
      )}

      {/* ── View on Roblox ── */}
      <a
        href={`https://www.roblox.com/groups/${groupId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rn-btn-primary flex items-center justify-center gap-2"
        style={{ textDecoration: "none", fontSize: "11px" }}
      >
        <ExternalLink size={13} />
        View Group
      </a>
    </div>
  );
}
