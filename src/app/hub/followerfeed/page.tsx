"use client";
// src/app/hub/followerfeed/page.tsx
// HUB 5 — FOLLOWER FEED
// Features: Followers/Following Browser · Mutual Finder · Social Stats Card

import { useState } from "react";
import Image from "next/image";
import { Rss, Users, UserCheck, UserPlus, Copy, ChevronRight, Search } from "lucide-react";
import LoadingBar from "@/components/LoadingBar";
import ErrorCard  from "@/components/ErrorCard";
import { toastSuccess } from "@/components/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserRow { id: number; name: string; displayName: string; avatarUrl?: string | null; }
interface SocialUser extends UserRow { followersCount: number | null; followingCount: number | null; friendsCount: number | null; created: string; }

// ── Shared UI ─────────────────────────────────────────────────────────────────
function HubTitle() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <Rss size={22} style={{ color: "var(--color-accent)" }} />
        <h1 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "22px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", margin: 0, textShadow: "0 0 20px rgba(var(--color-accent-rgb),0.5)" }}>Follower Feed</h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", letterSpacing: "0.06em", margin: 0 }}>Browse followers, find mutuals, and inspect social stats.</p>
      <div style={{ height: 1, background: "rgba(var(--color-accent-rgb),0.2)", marginTop: 16 }} />
    </div>
  );
}
function SectionTitle({ title }: { title: string }) {
  return <h2 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 16 }}>{title}</h2>;
}
function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      <Icon size={48} style={{ color: "rgba(var(--color-accent-rgb),0.3)", margin: "0 auto 16px" }} />
      <p style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{desc}</p>
    </div>
  );
}

function UserListRow({ user, onClick }: { user: UserRow; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-2 rounded-md"
      style={{ cursor: onClick ? "pointer" : "default", transition: "background 150ms ease" }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.background = "rgba(var(--color-accent-rgb),0.05)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(var(--color-accent-rgb),0.35)", boxShadow: "0 0 6px rgba(var(--color-accent-rgb),0.2)", background: "var(--color-elevated)", position: "relative", flexShrink: 0 }}>
        {user.avatarUrl
          ? <Image src={user.avatarUrl} alt={user.displayName} fill sizes="36px" style={{ objectFit: "cover" }} />
          : <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "var(--color-accent)" }}>{user.displayName.charAt(0)}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.displayName}</p>
        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>@{user.name}</p>
      </div>
      {onClick && <ChevronRight size={13} style={{ color: "rgba(var(--color-accent-rgb),0.3)", flexShrink: 0 }} />}
    </div>
  );
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function resolveUser(username: string) {
  const res  = await fetch(`/api/proxy/user?username=${encodeURIComponent(username)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.message);
  return data as { id: number; name: string; displayName: string };
}

async function enrichUsers(users: { id: number; name: string; displayName: string }[]): Promise<UserRow[]> {
  return Promise.all(users.map(async (u) => {
    try {
      const r = await fetch(`/api/proxy/thumbnail?userId=${u.id}&size=100x100`);
      const d = await r.json();
      return { ...u, avatarUrl: d.imageUrl ?? null };
    } catch { return u; }
  }));
}

// ── Feature 1: Followers/Following Browser ────────────────────────────────────
function FollowerBrowser() {
  const [query,   setQuery]   = useState("");
  const [tab,     setTab]     = useState<"followers"|"following">("followers");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [header,  setHeader]  = useState<{ id: number; name: string; displayName: string; avatarUrl?: string|null; followerCount?: number; followingCount?: number } | null>(null);
  const [list,    setList]    = useState<UserRow[] | null>(null);
  const [cursor,  setCursor]  = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleLoad() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setList(null); setCursor(null);
    try {
      const u = await resolveUser(query.trim());
      const [countsRes, thumbRes] = await Promise.all([
        fetch(`/api/proxy/counts?userId=${u.id}`),
        fetch(`/api/proxy/thumbnail?userId=${u.id}&size=150x150`),
      ]);
      const [counts, thumb] = await Promise.all([countsRes.json(), thumbRes.json()]);
      setHeader({ ...u, avatarUrl: thumb.imageUrl ?? null, followerCount: counts.followers, followingCount: counts.following });
      await loadPage(u.id, tab);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load."); }
    finally { setLoading(false); }
  }

  async function loadPage(userId: number, currentTab: string, nextCursor?: string) {
    const endpoint = currentTab === "followers" ? "followers" : "following";
    const url = `/api/proxy/${endpoint}?userId=${userId}${nextCursor ? `&cursor=${nextCursor}` : ""}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error(data.message);
    const enriched = await enrichUsers(data.data ?? []);
    setList((prev) => nextCursor ? [...(prev ?? []), ...enriched] : enriched);
    setCursor(data.nextPageCursor ?? null);
  }

  async function switchTab(newTab: "followers"|"following") {
    setTab(newTab);
    if (!header) return;
    setLoading(true); setList(null); setCursor(null);
    try { await loadPage(header.id, newTab); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed."); }
    finally { setLoading(false); }
  }

  async function handleLoadMore() {
    if (!header || !cursor) return;
    setLoadingMore(true);
    try { await loadPage(header.id, tab, cursor); }
    catch { /* silent */ }
    finally { setLoadingMore(false); }
  }

  return (
    <div className="rn-card mb-6">
      <SectionTitle title="Followers & Following" />
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLoad()} placeholder="Roblox username…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none" }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(var(--color-accent-rgb),0.15)"; }}
          onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
        />
        <button onClick={handleLoad} disabled={loading} className="rn-btn-primary" style={{ opacity: loading ? 0.6 : 1 }}><Rss size={14} /> Load</button>
      </div>

      {/* Header */}
      {header && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-md" style={{ background: "rgba(var(--color-accent-rgb),0.04)", border: "1px solid rgba(var(--color-accent-rgb),0.1)" }}>
          {header.avatarUrl && (
            <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(var(--color-accent-rgb),0.5)", boxShadow: "0 0 8px rgba(var(--color-accent-rgb),0.3)", position: "relative", flexShrink: 0 }}>
              <Image src={header.avatarUrl} alt={header.displayName} fill sizes="40px" style={{ objectFit: "cover" }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{header.displayName}</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>@{header.name}</p>
          </div>
          <div className="flex gap-4">
            {[{ label: "Followers", val: header.followerCount }, { label: "Following", val: header.followingCount }].map(({ label, val }) => (
              <div key={label} style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "16px", fontWeight: 700, color: "var(--color-accent)", margin: 0 }}>{val?.toLocaleString() ?? "—"}</p>
                <p style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {header && (
        <div className="flex gap-0 mb-4" style={{ borderBottom: "1px solid rgba(var(--color-accent-rgb),0.15)" }}>
          {(["followers","following"] as const).map((t) => (
            <button key={t} onClick={() => switchTab(t)}
              style={{
                padding: "8px 20px", background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "11px",
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)",
                borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
                marginBottom: "-1px",
                boxShadow: tab === t ? "0 4px 12px -4px rgba(var(--color-accent-rgb),0.4)" : "none",
                transition: "all 200ms ease",
              }}
            >{t}</button>
          ))}
        </div>
      )}

      {loading && <LoadingBar estimatedSeconds={3} />}
      {error   && <ErrorCard message={error} onRetry={handleLoad} />}
      {list !== null && !loading && (
        <>
          {list.length === 0 ? <EmptyState icon={Users} title="None found" desc="This user has no followers or is following nobody." />
            : <div className="flex flex-col gap-1">{list.map((u) => <UserListRow key={u.id} user={u} />)}</div>}
          {cursor && (
            <button onClick={handleLoadMore} disabled={loadingMore} className="rn-btn-secondary w-full mt-4" style={{ fontSize: "11px", opacity: loadingMore ? 0.6 : 1 }}>
              {loadingMore ? "Loading…" : "Load More"}
            </button>
          )}
        </>
      )}
      {!header && !loading && !error && <EmptyState icon={Rss} title="Browse a user's network" desc="Enter a username to load their followers and following." />}
    </div>
  );
}

// ── Feature 2: Mutual Finder ──────────────────────────────────────────────────
function MutualFinder() {
  const [qa, setQa] = useState(""); const [qb, setQb] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string|null>(null);
  const [mutuals, setMutuals] = useState<UserRow[]|null>(null);

  async function handleFind() {
    if (!qa.trim() || !qb.trim()) return;
    setLoading(true); setError(null); setMutuals(null);
    try {
      const [a, b] = await Promise.all([resolveUser(qa.trim()), resolveUser(qb.trim())]);
      const res    = await fetch(`/api/proxy/mutuals?myId=${a.id}&targetId=${b.id}`);
      const data   = await res.json();
      if (data.error) throw new Error(data.message);
      const enriched = await enrichUsers(data.mutuals ?? []);
      setMutuals(enriched);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="rn-card mb-6">
      <SectionTitle title="Mutual Follower Finder" />
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input value={qa} onChange={(e) => setQa(e.target.value)} placeholder="Username A…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none" }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; }}
        />
        <span style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "12px", fontWeight: 900, color: "var(--color-accent)", flexShrink: 0 }}>&</span>
        <input value={qb} onChange={(e) => setQb(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFind()} placeholder="Username B…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none" }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; }}
        />
        <button onClick={handleFind} disabled={loading} className="rn-btn-primary" style={{ opacity: loading ? 0.6 : 1 }}><Search size={14} /> Find Mutuals</button>
      </div>
      {loading && <LoadingBar estimatedSeconds={4} />}
      {error   && <ErrorCard message={error} onRetry={handleFind} />}
      {mutuals !== null && !loading && (
        <>
          <div className="mb-4 text-center">
            <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "36px", fontWeight: 700, color: "var(--color-accent)", display: "block" }}>{mutuals.length}</span>
            <span style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Mutual Friends</span>
          </div>
          {mutuals.length === 0
            ? <EmptyState icon={Users} title="No mutual friends" desc="These two users share no mutual friends." />
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">{mutuals.map((u) => <UserListRow key={u.id} user={u} />)}</div>}
        </>
      )}
      {mutuals === null && !loading && !error && <EmptyState icon={UserCheck} title="Find mutual friends" desc="Enter two usernames to discover shared connections." />}
    </div>
  );
}

// ── Feature 3: Social Stats Card ──────────────────────────────────────────────
function SocialStatsCard() {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string|null>(null);
  const [user,    setUser]    = useState<SocialUser|null>(null);

  async function handleLoad() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setUser(null);
    try {
      const u = await resolveUser(query.trim());
      const [infoRes, countsRes, thumbRes] = await Promise.all([
        fetch(`/api/proxy/userinfo?userId=${u.id}`),
        fetch(`/api/proxy/counts?userId=${u.id}`),
        fetch(`/api/proxy/thumbnail?userId=${u.id}&size=150x150`),
      ]);
      const [info, counts, thumb] = await Promise.all([infoRes.json(), countsRes.json(), thumbRes.json()]);
      if (info.error) throw new Error(info.message);
      setUser({ ...u, avatarUrl: thumb.imageUrl ?? null, followersCount: counts.followers, followingCount: counts.following, friendsCount: counts.friends, created: info.created });
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed."); }
    finally { setLoading(false); }
  }

  function copyLink() {
    if (!user) return;
    navigator.clipboard.writeText(`https://www.roblox.com/users/${user.id}/profile`).then(() => toastSuccess("Link copied!"));
  }

  const ageYears = user ? (Date.now() - new Date(user.created).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
  const ageDays  = user ? Math.floor((Date.now() - new Date(user.created).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const ratio    = user && user.followingCount && user.followingCount > 0
    ? (user.followersCount ?? 0) / user.followingCount : null;

  return (
    <div className="rn-card">
      <SectionTitle title="Social Stats" />
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLoad()} placeholder="Roblox username…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none" }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; }}
        />
        <button onClick={handleLoad} disabled={loading} className="rn-btn-primary" style={{ opacity: loading ? 0.6 : 1 }}><UserPlus size={14} /> Load Stats</button>
      </div>
      {loading && <LoadingBar estimatedSeconds={2} />}
      {error   && <ErrorCard message={error} onRetry={handleLoad} />}
      {user && !loading && (
        <div>
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            {user.avatarUrl && (
              <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(var(--color-accent-rgb),0.6)", boxShadow: "0 0 12px rgba(var(--color-accent-rgb),0.4)", position: "relative", flexShrink: 0 }}>
                <Image src={user.avatarUrl} alt={user.displayName} fill sizes="56px" style={{ objectFit: "cover" }} />
              </div>
            )}
            <div>
              <p style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{user.displayName}</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>@{user.name}</p>
            </div>
          </div>
          {/* Stat grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {[
              { label: "Followers",  val: user.followersCount?.toLocaleString() ?? "—" },
              { label: "Following",  val: user.followingCount?.toLocaleString()  ?? "—" },
              { label: "Friends",    val: user.friendsCount?.toLocaleString()    ?? "—" },
              { label: "F/F Ratio",  val: ratio !== null ? `${ratio.toFixed(1)}×` : "—" },
              { label: "Account Age",val: `${ageYears.toFixed(1)}y` },
              { label: "Days Old",   val: ageDays.toLocaleString() },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: "rgba(var(--color-accent-rgb),0.04)", border: "1px solid rgba(var(--color-accent-rgb),0.1)", borderRadius: 6, padding: "10px 12px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "18px", fontWeight: 700, color: "var(--color-accent)", margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
          {ratio !== null && (
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: 16, fontStyle: "italic" }}>
              {ratio >= 1 ? `${ratio.toFixed(1)}× more followers than following` : `Following ${(1/ratio).toFixed(1)}× more than they have followers`}
            </p>
          )}
          <button onClick={copyLink} className="rn-btn-secondary flex items-center gap-2" style={{ fontSize: "11px" }}>
            <Copy size={13} /> Copy Profile Link
          </button>
        </div>
      )}
      {!user && !loading && !error && <EmptyState icon={UserPlus} title="View social stats" desc="Enter a username to see their full social breakdown." />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FollowerFeedPage() {
  return (
    <div className="hub-enter p-6 max-w-4xl mx-auto">
      <HubTitle />
      <FollowerBrowser />
      <MutualFinder />
      <SocialStatsCard />
    </div>
  );
}
