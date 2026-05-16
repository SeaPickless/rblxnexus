// src/components/UserCard.tsx
// Displays a full Roblox user profile card.
// All data comes from /api/proxy/* — never calls roblox.com directly.

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Users, UserCheck, UserPlus, Calendar, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import LoadingBar from "@/components/LoadingBar";
import ErrorCard  from "@/components/ErrorCard";
import { getToggles } from "@/lib/toggles";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserData {
  id:          number;
  name:        string;
  displayName: string;
  description: string;
  created:     string;
  isBanned:    boolean;
}
interface PresenceData {
  userPresenceType: number; // 0=Offline 1=Online 2=InGame 3=InStudio
  lastLocation?:    string;
}
interface CountData {
  friends:   number | null;
  followers: number | null;
  following: number | null;
}

interface UserCardProps {
  userId: number;
}

// ── Presence badge ─────────────────────────────────────────────────────────────
function PresenceBadge({ type }: { type: number }) {
  if (type === 2 || type === 3) {
    return (
      <span className="flex items-center gap-1.5" style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-accent)" }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--color-accent)",
          boxShadow: "0 0 6px var(--color-accent)",
          display: "inline-block",
          animation: "presence-pulse 1.5s ease-in-out infinite",
        }} />
        {type === 3 ? "In Studio" : "In-Game"}
        <style>{`@keyframes presence-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
      </span>
    );
  }
  if (type === 1) {
    return (
      <span className="flex items-center gap-1.5" style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#22c55e" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
        Online
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5" style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555566" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#555566", display: "inline-block" }} />
      Offline
    </span>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon size={14} style={{ color: "var(--color-text-muted)" }} />
      <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "16px", fontWeight: 700, color: "var(--color-accent)" }}>
        {value === null ? "—" : value.toLocaleString()}
      </span>
      <span style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
        {label}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function UserCard({ userId }: UserCardProps) {
  const [user,     setUser]     = useState<UserData | null>(null);
  const [presence, setPresence] = useState<PresenceData | null>(null);
  const [counts,   setCounts]   = useState<CountData | null>(null);
  const [avatar,   setAvatar]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [bioOpen,  setBioOpen]  = useState(false);
  const [showId,   setShowId]   = useState(false);
  const [lowBw,    setLowBw]    = useState(false);
  const [hovered,  setHovered]  = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const t = getToggles();
      setShowId(t.showUserIds);
      setLowBw(t.lowBandwidth);

      const [userRes, presRes, countsRes, avatarRes] = await Promise.all([
        fetch(`/api/proxy/userinfo?userId=${userId}`),
        fetch(`/api/proxy/presence?userIds=${userId}`),
        fetch(`/api/proxy/counts?userId=${userId}`),
        t.lowBandwidth ? Promise.resolve(null) : fetch(`/api/proxy/thumbnail?userId=${userId}&size=420x420`),
      ]);

      const userData    = await userRes.json();
      const presData    = await presRes.json();
      const countsData  = await countsRes.json();
      const avatarData  = avatarRes ? await avatarRes.json() : null;

      if (userData.error)   throw new Error(userData.message);
      if (countsData.error) throw new Error(countsData.message);

      setUser(userData);
      setPresence(Array.isArray(presData) ? presData[0] : null);
      setCounts(countsData);
      setAvatar(avatarData?.imageUrl ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [userId]);

  const accountAge = user
    ? Math.floor((Date.now() - new Date(user.created).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // ── Loading ──
  if (loading) {
    return (
      <div className="rn-card" style={{ minHeight: 200 }}>
        <LoadingBar estimatedSeconds={2} />
      </div>
    );
  }

  // ── Error ──
  if (error || !user) {
    return <ErrorCard message={error ?? "User not found."} onRetry={load} />;
  }

  return (
    <div
      className="rn-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transition: "all 200ms ease",
        borderColor: hovered ? "rgba(var(--color-accent-rgb),0.5)" : undefined,
        boxShadow:   hovered ? "0 0 30px rgba(var(--color-accent-rgb),0.15)" : "0 0 20px rgba(var(--color-accent-rgb),0.08)",
        transform:   hovered ? "translateY(-2px)" : "none",
      }}
    >
      {/* ── Banned banner ── */}
      {user.isBanned && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={14} color="#EF4444" />
          <span style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#EF4444", fontFamily: "var(--font-orbitron)" }}>Account Banned</span>
        </div>
      )}

      {/* ── Avatar + name row ── */}
      <div className="flex items-start gap-4 mb-5">
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {avatar && !lowBw ? (
            <div style={{
              width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
              border: "2px solid rgba(var(--color-accent-rgb),0.6)",
              boxShadow: "0 0 12px rgba(var(--color-accent-rgb),0.4)",
              position: "relative",
            }}>
              <Image src={avatar} alt={user.displayName} fill sizes="72px" style={{ objectFit: "cover" }} />
            </div>
          ) : (
            /* Initials placeholder */
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              border: "2px solid rgba(var(--color-accent-rgb),0.6)",
              boxShadow: "0 0 12px rgba(var(--color-accent-rgb),0.4)",
              background: "var(--color-elevated)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-orbitron)", fontSize: "22px", fontWeight: 700,
              color: "var(--color-accent)",
            }}>
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + presence */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "0.06em" }}>
              {user.displayName}
            </span>
            {user.isBanned && (
              <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#EF4444", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "999px", padding: "1px 6px" }}>
                Banned
              </span>
            )}
          </div>
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "12px", color: "var(--color-text-secondary)" }}>
            @{user.name}
            {showId && <span style={{ color: "var(--color-text-muted)", marginLeft: 8 }}>#{user.id}</span>}
          </span>
          <PresenceBadge type={presence?.userPresenceType ?? 0} />
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="flex justify-around mb-5 py-3 px-2 rounded-md" style={{ background: "rgba(var(--color-accent-rgb),0.04)", border: "1px solid rgba(var(--color-accent-rgb),0.08)" }}>
        <StatPill icon={Users}     label="Friends"   value={counts?.friends   ?? null} />
        <StatPill icon={UserCheck} label="Followers"  value={counts?.followers ?? null} />
        <StatPill icon={UserPlus}  label="Following"  value={counts?.following ?? null} />
      </div>

      {/* ── Account info ── */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
          Joined <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color: "var(--color-accent)" }}>
            {new Date(user.created).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </span>
          <span style={{ color: "var(--color-text-muted)", marginLeft: 6 }}>({accountAge.toLocaleString()} days)</span>
        </span>
      </div>

      {/* ── Bio ── */}
      {user.description && (
        <div className="mb-4">
          <p style={{
            fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6,
            display: "-webkit-box", WebkitBoxOrient: "vertical",
            WebkitLineClamp: bioOpen ? "unset" : 3,
            overflow: bioOpen ? "visible" : "hidden",
          }}>
            {user.description}
          </p>
          {user.description.length > 120 && (
            <button
              onClick={() => setBioOpen(!bioOpen)}
              className="flex items-center gap-1 mt-1"
              style={{ fontSize: "11px", color: "var(--color-accent)", letterSpacing: "0.06em", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {bioOpen ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
            </button>
          )}
        </div>
      )}

      {/* ── View on Roblox ── */}
      <a
        href={`https://www.roblox.com/users/${user.id}/profile`}
        target="_blank"
        rel="noopener noreferrer"
        className="rn-btn-primary w-full flex items-center justify-center gap-2"
        style={{ textDecoration: "none", fontSize: "11px" }}
      >
        <ExternalLink size={13} />
        View on Roblox
      </a>
    </div>
  );
}
