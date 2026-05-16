"use client";
// src/app/hub/badgevault/page.tsx
// HUB 4 — BADGE VAULT
// Features: User Badge Collection · Badge Stats Summary · Badge Comparison

import { useState, useMemo } from "react";
import Image from "next/image";
import { Award, Search, GitCompare, Trophy, Filter } from "lucide-react";
import LoadingBar from "@/components/LoadingBar";
import ErrorCard  from "@/components/ErrorCard";
import BadgeCard  from "@/components/BadgeCard";
import StatCard   from "@/components/StatCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Badge {
  id: number; name: string; description?: string;
  awarder?: { name: string };
  awardedDate?: string;
  statistics?: { winRatePercentage: number };
  imageUrl?: string | null;
}
interface UserInfo { id: number; name: string; displayName: string; avatarUrl?: string | null; }

// ── Shared UI ─────────────────────────────────────────────────────────────────
function HubTitle() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <Award size={22} style={{ color: "var(--color-accent)" }} />
        <h1 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "22px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", margin: 0, textShadow: "0 0 20px rgba(var(--color-accent-rgb),0.5)" }}>Badge Vault</h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", letterSpacing: "0.06em", margin: 0 }}>Explore, sort, and compare Roblox badge collections.</p>
      <div style={{ height: 1, background: "rgba(var(--color-accent-rgb),0.2)", marginTop: 16 }} />
    </div>
  );
}
function SectionTitle({ title }: { title: string }) {
  return <h2 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 16 }}>{title}</h2>;
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
async function fetchUserWithBadges(username: string): Promise<{ user: UserInfo; badges: Badge[] }> {
  const userRes  = await fetch(`/api/proxy/user?username=${encodeURIComponent(username)}`);
  const userData = await userRes.json();
  if (userData.error) throw new Error(userData.message);

  const [badgeRes, thumbRes] = await Promise.all([
    fetch(`/api/proxy/badges?userId=${userData.id}`),
    fetch(`/api/proxy/thumbnail?userId=${userData.id}&size=150x150`),
  ]);
  const [badgeData, thumbData] = await Promise.all([badgeRes.json(), thumbRes.json()]);
  if (badgeData.error) throw new Error(badgeData.message);

  return {
    user: { id: userData.id, name: userData.name, displayName: userData.displayName, avatarUrl: thumbData.imageUrl ?? null },
    badges: badgeData.data ?? [],
  };
}

// ── Feature 1 & 2: Badge Collection + Stats ───────────────────────────────────
function BadgeCollection() {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [user,    setUser]    = useState<UserInfo | null>(null);
  const [badges,  setBadges]  = useState<Badge[] | null>(null);
  const [filter,  setFilter]  = useState("");
  const [sort,    setSort]    = useState<"recent"|"alpha"|"game">("recent");

  async function handleFetch() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setUser(null); setBadges(null);
    try {
      const { user: u, badges: b } = await fetchUserWithBadges(query.trim());
      setUser(u); setBadges(b);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load badges."); }
    finally { setLoading(false); }
  }

  const sortedFiltered = useMemo(() => {
    if (!badges) return [];
    let b = [...badges];
    if (filter.trim()) b = b.filter((x) => (x.awarder?.name ?? "").toLowerCase().includes(filter.toLowerCase()) || x.name.toLowerCase().includes(filter.toLowerCase()));
    if (sort === "alpha")  b.sort((a, z) => a.name.localeCompare(z.name));
    if (sort === "game")   b.sort((a, z) => (a.awarder?.name ?? "").localeCompare(z.awarder?.name ?? ""));
    // "recent" = default order from API (most recent first)
    return b;
  }, [badges, filter, sort]);

  // Stats
  const stats = useMemo(() => {
    if (!badges || badges.length === 0) return null;
    const games = new Map<string, number>();
    badges.forEach((b) => { const g = b.awarder?.name ?? "Unknown"; games.set(g, (games.get(g) ?? 0) + 1); });
    let topGame = ""; let topCount = 0;
    games.forEach((count, game) => { if (count > topGame.length || count > topCount) { topGame = game; topCount = count; } });
    const sorted = [...badges].filter((b) => b.awardedDate).sort((a, z) => new Date(a.awardedDate!).getTime() - new Date(z.awardedDate!).getTime());
    return {
      total:   badges.length,
      games:   games.size,
      oldest:  sorted[0],
      newest:  sorted[sorted.length - 1],
      topGame, topCount,
    };
  }, [badges]);

  const selectStyle: React.CSSProperties = { padding: "8px 10px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontSize: "12px", cursor: "pointer", outline: "none" };

  return (
    <>
      <div className="rn-card mb-6">
        <SectionTitle title="Badge Collection" />
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFetch()} placeholder="Roblox username…"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "14px", outline: "none" }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(var(--color-accent-rgb),0.15)"; }}
            onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
          />
          <button onClick={handleFetch} disabled={loading} className="rn-btn-primary" style={{ opacity: loading ? 0.6 : 1 }}><Award size={14} /> Fetch</button>
        </div>
        {loading && <LoadingBar estimatedSeconds={3} />}
        {error   && <ErrorCard message={error} onRetry={handleFetch} />}
        {user && badges && !loading && (
          <>
            {/* User header */}
            <div className="flex items-center gap-4 mb-5 p-3 rounded-md" style={{ background: "rgba(var(--color-accent-rgb),0.04)", border: "1px solid rgba(var(--color-accent-rgb),0.1)" }}>
              {user.avatarUrl && (
                <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(var(--color-accent-rgb),0.5)", boxShadow: "0 0 10px rgba(var(--color-accent-rgb),0.3)", position: "relative", flexShrink: 0 }}>
                  <Image src={user.avatarUrl} alt={user.displayName} fill sizes="48px" style={{ objectFit: "cover" }} />
                </div>
              )}
              <div>
                <p style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{user.displayName}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>@{user.name}</p>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "28px", fontWeight: 700, color: "var(--color-accent)", margin: 0, lineHeight: 1 }}>{badges.length}</p>
                <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: 0 }}>Badges</p>
              </div>
            </div>
            {/* Controls */}
            <div className="flex gap-3 mb-4 flex-wrap items-center">
              <div className="flex items-center gap-2 flex-1">
                <Filter size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by game or badge name…"
                  style={{ flex: 1, padding: "7px 10px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.2)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none" }}
                />
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={selectStyle}>
                <option value="recent">Most Recent</option>
                <option value="alpha">Alphabetical</option>
                <option value="game">By Game</option>
              </select>
            </div>
            {/* Badge grid */}
            {sortedFiltered.length === 0
              ? <EmptyState icon={Search} title="No badges match" desc="Try a different filter." />
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedFiltered.map((b) => (
                    <BadgeCard key={b.id} badgeId={b.id} name={b.name} description={b.description} gameName={b.awarder?.name} awardedDate={b.awardedDate} iconUrl={b.imageUrl ?? null} />
                  ))}
                </div>
              )
            }
          </>
        )}
        {!user && !loading && !error && <EmptyState icon={Award} title="Enter a username" desc="Fetch a player's full badge collection." />}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="rn-card mb-6">
          <SectionTitle title="Badge Stats" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Total Badges"   value={stats.total}  />
            <StatCard label="Unique Games"   value={stats.games}  />
            <StatCard label="Top Game"        value={stats.topGame} sublabel={`${stats.topCount} badges`} />
            {stats.oldest && <StatCard label="Oldest Badge" value={stats.oldest.name} sublabel={stats.oldest.awarder?.name} />}
            {stats.newest && <StatCard label="Newest Badge" value={stats.newest.name} sublabel={stats.newest.awarder?.name} />}
          </div>
        </div>
      )}
    </>
  );
}

// ── Feature 3: Badge Comparison ───────────────────────────────────────────────
function BadgeComparison() {
  const [usernameA, setUsernameA] = useState("");
  const [usernameB, setUsernameB] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [result,    setResult]    = useState<{ userA: UserInfo; userB: UserInfo; onlyA: Badge[]; both: Badge[]; onlyB: Badge[] } | null>(null);

  async function handleCompare() {
    if (!usernameA.trim() || !usernameB.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const [dataA, dataB] = await Promise.all([
        fetchUserWithBadges(usernameA.trim()),
        fetchUserWithBadges(usernameB.trim()),
      ]);
      const setB    = new Set(dataB.badges.map((b) => b.id));
      const setA    = new Set(dataA.badges.map((b) => b.id));
      const onlyA   = dataA.badges.filter((b) => !setB.has(b.id));
      const both    = dataA.badges.filter((b) => setB.has(b.id));
      const onlyB   = dataB.badges.filter((b) => !setA.has(b.id));
      setResult({ userA: dataA.user, userB: dataB.user, onlyA, both, onlyB });
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Comparison failed."); }
    finally { setLoading(false); }
  }

  function ColHeader({ user, count }: { user: UserInfo; count: number }) {
    return (
      <div className="flex items-center gap-2 mb-3">
        {user.avatarUrl && (
          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(var(--color-accent-rgb),0.4)", position: "relative", flexShrink: 0 }}>
            <Image src={user.avatarUrl} alt={user.displayName} fill sizes="28px" style={{ objectFit: "cover" }} />
          </div>
        )}
        <span style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "11px", color: "var(--color-text-primary)" }}>{user.displayName}</span>
        <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "12px", color: "var(--color-accent)", marginLeft: "auto" }}>{count}</span>
      </div>
    );
  }

  return (
    <div className="rn-card">
      <SectionTitle title="Badge Comparison" />
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input value={usernameA} onChange={(e) => setUsernameA(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCompare()} placeholder="Username A…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none" }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; }}
        />
        <span style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "13px", fontWeight: 900, color: "var(--color-accent)", flexShrink: 0 }}>VS</span>
        <input value={usernameB} onChange={(e) => setUsernameB(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCompare()} placeholder="Username B…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none" }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; }}
        />
        <button onClick={handleCompare} disabled={loading} className="rn-btn-primary" style={{ opacity: loading ? 0.6 : 1 }}><GitCompare size={14} /> Compare</button>
      </div>
      {loading && <LoadingBar estimatedSeconds={4} />}
      {error   && <ErrorCard message={error} onRetry={handleCompare} />}
      {result && !loading && (
        <div className="grid grid-cols-3 gap-4 mt-2">
          {[
            { title: `Only ${result.userA.displayName}`, user: result.userA, badges: result.onlyA, col: "A" },
            { title: "Both",                             user: result.userA, badges: result.both,  col: "B" },
            { title: `Only ${result.userB.displayName}`, user: result.userB, badges: result.onlyB, col: "C" },
          ].map(({ title, user, badges }) => (
            <div key={title}>
              <p style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "10px", letterSpacing: "0.1em", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 8 }}>{title}</p>
              <ColHeader user={user} count={badges.length} />
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {badges.length === 0
                  ? <p style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center", padding: 16 }}>None</p>
                  : badges.map((b) => <BadgeCard key={b.id} badgeId={b.id} name={b.name} gameName={b.awarder?.name} awardedDate={b.awardedDate} iconUrl={b.imageUrl ?? null} />)
                }
              </div>
            </div>
          ))}
        </div>
      )}
      {!result && !loading && !error && <EmptyState icon={GitCompare} title="Compare two players" desc="See which badges are shared and which are unique." />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BadgeVaultPage() {
  return (
    <div className="hub-enter p-6 max-w-5xl mx-auto">
      <HubTitle />
      <BadgeCollection />
      <BadgeComparison />
    </div>
  );
}
