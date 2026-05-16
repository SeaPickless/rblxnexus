"use client";
// src/app/hub/social/page.tsx
// HUB 1 — SOCIAL COMMANDER
// Features: User Lookup · Friend Radar · Profile Compare

import { useState } from "react";
import Image from "next/image";
import {
  Search, Radar, GitCompare, Trophy, Users,
  ExternalLink, ChevronDown, ChevronUp, AlertTriangle,
  Calendar, UserCheck, UserPlus,
} from "lucide-react";
import LoadingBar   from "@/components/LoadingBar";
import ErrorCard    from "@/components/ErrorCard";
import UserCard     from "@/components/UserCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserSummary {
  id: number; name: string; displayName: string;
  description: string; created: string; isBanned: boolean;
}
interface CountSummary { friends: number|null; followers: number|null; following: number|null; }
interface MutualUser   { id: number; name: string; displayName: string; avatarUrl?: string; }

// ── Shared helpers ─────────────────────────────────────────────────────────────
function HubTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={22} style={{ color: "var(--color-accent)" }} />
        <h1 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "22px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", margin: 0, textShadow: "0 0 20px rgba(var(--color-accent-rgb),0.5)" }}>
          {title}
        </h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", letterSpacing: "0.06em", margin: 0 }}>{sub}</p>
      <div style={{ height: 1, background: "rgba(var(--color-accent-rgb),0.2)", marginTop: 16 }} />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 16 }}>
      {title}
    </h2>
  );
}

function SearchInput({ value, onChange, placeholder, onEnter }: { value: string; onChange: (v: string) => void; placeholder: string; onEnter?: () => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      placeholder={placeholder}
      style={{
        flex: 1, padding: "10px 14px", borderRadius: 6,
        background: "var(--color-elevated)",
        border: "1px solid rgba(var(--color-accent-rgb),0.3)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif",
        fontSize: "14px", outline: "none",
        transition: "all 200ms ease",
      }}
      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-accent)"; (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(var(--color-accent-rgb),0.15)"; }}
      onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
    />
  );
}

function ActionBtn({ onClick, loading, children }: { onClick: () => void; loading?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading} className="rn-btn-primary" style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <Icon size={48} style={{ color: "rgba(var(--color-accent-rgb),0.3)", margin: "0 auto 16px" }} />
      <p style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{desc}</p>
    </div>
  );
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function resolveUser(username: string): Promise<{ id: number; name: string; displayName: string }> {
  const res = await fetch(`/api/proxy/user?username=${encodeURIComponent(username)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.message);
  return data;
}

async function fetchUserFull(userId: number) {
  const [infoRes, countsRes, thumbRes, presRes] = await Promise.all([
    fetch(`/api/proxy/userinfo?userId=${userId}`),
    fetch(`/api/proxy/counts?userId=${userId}`),
    fetch(`/api/proxy/thumbnail?userId=${userId}&size=420x420`),
    fetch(`/api/proxy/presence?userIds=${userId}`),
  ]);
  const [info, counts, thumb, pres] = await Promise.all([
    infoRes.json(), countsRes.json(), thumbRes.json(), presRes.json(),
  ]);
  if (info.error) throw new Error(info.message);
  return { info, counts, thumb, presence: Array.isArray(pres) ? pres[0] : null };
}

// ── FEATURE 1: User Lookup ────────────────────────────────────────────────────
function UserLookup() {
  const [query,   setQuery]   = useState("");
  const [userId,  setUserId]  = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setUserId(null);
    try {
      const u = await resolveUser(query.trim());
      setUserId(u.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "User not found.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rn-card mb-6">
      <SectionTitle title="User Lookup" />
      <div className="flex gap-3 mb-4 flex-wrap">
        <SearchInput value={query} onChange={setQuery} placeholder="Enter Roblox username…" onEnter={handleSearch} />
        <ActionBtn onClick={handleSearch} loading={loading}><Search size={14} /> Search</ActionBtn>
      </div>
      {loading && <LoadingBar estimatedSeconds={2} />}
      {error   && <ErrorCard message={error} onRetry={handleSearch} />}
      {userId !== null && !loading && <UserCard userId={userId} />}
      {!userId && !loading && !error && <EmptyState icon={Search} title="Search a player" desc="Enter a Roblox username to pull their full profile." />}
    </div>
  );
}

// ── FEATURE 2: Friend Radar ───────────────────────────────────────────────────
function FriendRadar() {
  const [query,    setQuery]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [mutuals,  setMutuals]  = useState<MutualUser[] | null>(null);
  const [hop,      setHop]      = useState<number | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [lookupId, setLookupId] = useState<number | null>(null);

  async function handleScan() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setMutuals(null); setHop(null);
    try {
      // Resolve target
      const target = await resolveUser(query.trim());
      setTargetId(target.id);

      // Get signed-in user's Roblox session
      const meRes  = await fetch("/api/auth/roblox/userinfo");
      const meData = await meRes.json();
      if (!meData.connected) throw new Error("Connect your Roblox account first.");

      const myId = Number(meData.robloxId);

      // Fetch mutuals server-side
      const mutRes  = await fetch(`/api/proxy/mutuals?myId=${myId}&targetId=${target.id}`);
      const mutData = await mutRes.json();
      if (mutData.error) throw new Error(mutData.message);

      // Determine hop distance
      const isFriend = mutData.mutuals?.some((m: { id: number }) => m.id === target.id);
      setHop(isFriend ? 1 : mutData.count > 0 ? 2 : 3);

      // Fetch avatars for mutuals (up to 20)
      const top20: MutualUser[] = (mutData.mutuals ?? []).slice(0, 20);
      const thumbPromises = top20.map(async (m: MutualUser) => {
        try {
          const r = await fetch(`/api/proxy/thumbnail?userId=${m.id}&size=100x100`);
          const d = await r.json();
          return { ...m, avatarUrl: d.imageUrl ?? null };
        } catch { return m; }
      });
      setMutuals(await Promise.all(thumbPromises));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  const hopLabel = hop === 1 ? "Direct Friend" : hop === 2 ? "Friend-of-Friend" : "Extended Network";
  const hopColor = hop === 1 ? "#22c55e" : hop === 2 ? "var(--color-accent)" : "var(--color-text-muted)";

  return (
    <div className="rn-card mb-6">
      <SectionTitle title="Friend Radar" />
      <div className="flex gap-3 mb-4 flex-wrap">
        <SearchInput value={query} onChange={setQuery} placeholder="Target Roblox username…" onEnter={handleScan} />
        <ActionBtn onClick={handleScan} loading={loading}><Radar size={14} /> Scan</ActionBtn>
      </div>
      {loading  && <LoadingBar estimatedSeconds={4} />}
      {error    && <ErrorCard message={error} onRetry={handleScan} />}
      {!loading && mutuals !== null && (
        <div>
          {/* Hop badge */}
          {hop !== null && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-md" style={{ background: "rgba(var(--color-accent-rgb),0.04)", border: "1px solid rgba(var(--color-accent-rgb),0.12)" }}>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "28px", fontWeight: 700, color: hopColor }}>{hop}</span>
              <div>
                <p style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "12px", color: hopColor, margin: 0, letterSpacing: "0.08em" }}>{hopLabel}</p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>{mutuals.length} mutual friend{mutuals.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}
          {/* Mutuals grid */}
          {mutuals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {mutuals.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLookupId(m.id)}
                  title={m.displayName}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(var(--color-accent-rgb),0.4)", boxShadow: "0 0 6px rgba(var(--color-accent-rgb),0.3)", background: "var(--color-elevated)", position: "relative" }}>
                    {m.avatarUrl
                      ? <Image src={m.avatarUrl} alt={m.displayName} fill sizes="40px" style={{ objectFit: "cover" }} />
                      : <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)" }}>{m.displayName.charAt(0)}</span>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No mutual friends" desc="You and this user share no mutual friends." />
          )}
          {/* Inline user lookup on click */}
          {lookupId && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>QUICK PROFILE</span>
                <button onClick={() => setLookupId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "11px" }}>✕ Close</button>
              </div>
              <UserCard userId={lookupId} />
            </div>
          )}
        </div>
      )}
      {!loading && mutuals === null && !error && <EmptyState icon={Radar} title="Scan a player's network" desc="See how closely connected you are to any Roblox user." />}
    </div>
  );
}

// ── FEATURE 3: Profile Compare ────────────────────────────────────────────────
interface CompareUser { info: UserSummary; counts: CountSummary; avatarUrl: string | null; }

function ProfileCompare() {
  const [usernameA, setUsernameA] = useState("");
  const [usernameB, setUsernameB] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [userA,     setUserA]     = useState<CompareUser | null>(null);
  const [userB,     setUserB]     = useState<CompareUser | null>(null);

  async function handleCompare() {
    if (!usernameA.trim() || !usernameB.trim()) return;
    setLoading(true); setError(null); setUserA(null); setUserB(null);
    try {
      const [a, b] = await Promise.all([
        resolveUser(usernameA.trim()),
        resolveUser(usernameB.trim()),
      ]);
      const [dataA, dataB] = await Promise.all([
        fetchUserFull(a.id),
        fetchUserFull(b.id),
      ]);
      setUserA({ info: dataA.info, counts: dataA.counts, avatarUrl: dataA.thumb?.imageUrl ?? null });
      setUserB({ info: dataB.info, counts: dataB.counts, avatarUrl: dataB.thumb?.imageUrl ?? null });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Compare failed.");
    } finally {
      setLoading(false);
    }
  }

  function Winner({ valA, valB, label }: { valA: number | null; valB: number | null; label: string }) {
    const winA = valA !== null && valB !== null && valA > valB;
    const winB = valA !== null && valB !== null && valB > valA;
    return (
      <div className="flex items-center" style={{ borderBottom: "1px solid rgba(var(--color-accent-rgb),0.08)", padding: "10px 0" }}>
        <div style={{ flex: 1, textAlign: "right" }}>
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "15px", color: winA ? "var(--color-accent)" : "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
            {winA && <Trophy size={12} style={{ color: "var(--color-accent)" }} />}
            {valA?.toLocaleString() ?? "—"}
          </span>
        </div>
        <div style={{ width: 100, textAlign: "center", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>{label}</div>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "15px", color: winB ? "var(--color-accent)" : "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
            {valB?.toLocaleString() ?? "—"}
            {winB && <Trophy size={12} style={{ color: "var(--color-accent)" }} />}
          </span>
        </div>
      </div>
    );
  }

  const ageA = userA ? Math.floor((Date.now() - new Date(userA.info.created).getTime()) / 86400000) : null;
  const ageB = userB ? Math.floor((Date.now() - new Date(userB.info.created).getTime()) / 86400000) : null;

  return (
    <div className="rn-card">
      <SectionTitle title="Profile Compare" />
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <SearchInput value={usernameA} onChange={setUsernameA} placeholder="Username A…" onEnter={handleCompare} />
        <span style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "13px", fontWeight: 900, color: "var(--color-accent)", textShadow: "0 0 12px rgba(var(--color-accent-rgb),0.6)", flexShrink: 0 }}>VS</span>
        <SearchInput value={usernameB} onChange={setUsernameB} placeholder="Username B…" onEnter={handleCompare} />
        <ActionBtn onClick={handleCompare} loading={loading}><GitCompare size={14} /> Compare</ActionBtn>
      </div>
      {loading && <LoadingBar estimatedSeconds={3} />}
      {error   && <ErrorCard message={error} onRetry={handleCompare} />}
      {userA && userB && !loading && (
        <div className="mt-4">
          {/* Side-by-side user cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <UserCard userId={userA.info.id} />
            <UserCard userId={userB.info.id} />
          </div>
          {/* Comparison rows */}
          <div style={{ background: "rgba(var(--color-accent-rgb),0.03)", border: "1px solid rgba(var(--color-accent-rgb),0.1)", borderRadius: 8, padding: "8px 16px" }}>
            <Winner valA={userA.counts.friends}   valB={userB.counts.friends}   label="Friends" />
            <Winner valA={userA.counts.followers} valB={userB.counts.followers} label="Followers" />
            <Winner valA={userA.counts.following} valB={userB.counts.following} label="Following" />
            <Winner valA={ageA}                   valB={ageB}                   label="Acct Age (days)" />
          </div>
        </div>
      )}
      {!userA && !loading && !error && <EmptyState icon={GitCompare} title="Compare two players" desc="Enter two usernames to compare their stats side by side." />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SocialCommanderPage() {
  return (
    <div className="hub-enter p-6 max-w-4xl mx-auto">
      <HubTitle icon={Users} title="Social Commander" sub="Look up players, scan friend networks, and compare profiles." />
      <UserLookup />
      <FriendRadar />
      <ProfileCompare />
    </div>
  );
}
