"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Search, Medal, BarChart2, GitCompare, AlertTriangle,
  Calendar, Trophy, Star, Filter
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Badge {
  id: number;
  name: string;
  description: string;
  awardingUniverse?: { id: number; name: string };
  imageUrl?: string;
  awardedDate?: string; // ISO from earned-dates endpoint
}

interface UserHeader {
  id: number;
  displayName: string;
  username: string;
  avatarUrl?: string;
}

type SortMode = "recent" | "alpha" | "game";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAwardDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── API ───────────────────────────────────────────────────────────────────────

async function resolveUser(username: string): Promise<UserHeader> {
  const res = await fetch("/api/roblox/users/usernames", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  if (!res.ok) throw new Error("User not found");
  const data = await res.json();
  const entry = data.data?.[0];
  if (!entry) throw new Error("User not found");

  const infoRes = await fetch(`/api/roblox/users/${entry.id}`);
  const info = infoRes.ok ? await infoRes.json() : { id: entry.id, name: entry.name, displayName: entry.displayName };

  let avatarUrl: string | undefined;
  try {
    const avRes = await fetch(`/api/roblox/thumbnails/users?userIds=${entry.id}&size=150x150&format=Png`);
    if (avRes.ok) {
      const avData = await avRes.json();
      avatarUrl = avData.data?.[0]?.imageUrl;
    }
  } catch { /* non-fatal */ }

  return { id: info.id, displayName: info.displayName, username: info.name, avatarUrl };
}

async function fetchBadges(userId: number): Promise<Badge[]> {
  const all: Badge[] = [];
  let cursor = "";
  // Paginate up to 500 badges
  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({ limit: "50" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/roblox/badges/user/${userId}?${params}`);
    if (!res.ok) break;
    const data = await res.json();
    all.push(...(data.data ?? []));
    cursor = data.nextPageCursor ?? "";
    if (!cursor) break;
  }

  // Fetch badge thumbnails in one call (max 100 ids)
  if (all.length > 0) {
    const chunk = all.slice(0, 100).map((b) => b.id).join(",");
    try {
      const tRes = await fetch(`/api/roblox/thumbnails/badges?badgeIds=${chunk}&size=150x150&format=Png`);
      if (tRes.ok) {
        const tData = await tRes.json();
        const map: Record<number, string> = {};
        (tData.data ?? []).forEach((t: { targetId: number; imageUrl: string }) => { map[t.targetId] = t.imageUrl; });
        all.forEach((b) => { b.imageUrl = map[b.id] ?? b.imageUrl; });
      }
    } catch { /* non-fatal */ }
  }

  // Fetch awarded dates for the first 100
  if (all.length > 0) {
    const chunk = all.slice(0, 100).map((b) => b.id).join(",");
    try {
      const dRes = await fetch(`/api/roblox/badges/user/${userId}/awarded?badgeIds=${chunk}`);
      if (dRes.ok) {
        const dData = await dRes.json();
        const map: Record<number, string> = {};
        (dData.data ?? []).forEach((d: { badgeId: number; awardedDate: string }) => { map[d.badgeId] = d.awardedDate; });
        all.forEach((b) => { b.awardedDate = map[b.id] ?? b.awardedDate; });
      }
    } catch { /* non-fatal */ }
  }

  return all;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className ?? ""}`} />;
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
      <AlertTriangle className="shrink-0 text-red-400" size={18} />
      <span className="text-sm text-red-300 flex-1">{message}</span>
      {onRetry && <button onClick={onRetry} className="text-xs text-red-400 hover:text-red-200 underline">Retry</button>}
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-xl border border-white/10 bg-white/5 p-2 flex flex-col items-center gap-1 text-center group cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {badge.imageUrl ? (
        <Image src={badge.imageUrl} alt={badge.name} width={60} height={60} className="rounded-lg object-cover" />
      ) : (
        <div className="w-15 h-15 rounded-lg bg-white/10 flex items-center justify-center">
          <Medal size={24} className="text-white/20" />
        </div>
      )}
      <p className="text-xs text-white font-medium line-clamp-2 leading-tight">{badge.name}</p>
      <p className="text-xs text-white/30 truncate w-full">{badge.awardingUniverse?.name ?? "—"}</p>
      <p className="text-xs text-indigo-400">{fmtAwardDate(badge.awardedDate)}</p>

      {/* Tooltip */}
      {hovered && badge.description && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-48 rounded-xl bg-gray-900 border border-white/20 p-2 shadow-xl text-xs text-white/70 text-left pointer-events-none">
          {badge.description}
        </div>
      )}
    </div>
  );
}

function BadgeStats({ badges }: { badges: Badge[] }) {
  const stats = useMemo(() => {
    if (badges.length === 0) return null;
    const games: Record<string, { name: string; count: number }> = {};
    badges.forEach((b) => {
      const gName = b.awardingUniverse?.name ?? "Unknown";
      if (!games[gName]) games[gName] = { name: gName, count: 0 };
      games[gName].count++;
    });
    const topGame = Object.values(games).sort((a, b) => b.count - a.count)[0];
    const uniqueGames = Object.keys(games).length;

    const withDate = badges.filter((b) => b.awardedDate);
    const sorted = [...withDate].sort(
      (a, b) => new Date(a.awardedDate!).getTime() - new Date(b.awardedDate!).getTime()
    );
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    return { total: badges.length, uniqueGames, topGame, oldest, newest };
  }, [badges]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { icon: <Trophy size={14} className="text-yellow-400" />, label: "Total Badges", value: stats.total.toLocaleString() },
        { icon: <Star size={14} className="text-indigo-400" />, label: "Unique Games", value: stats.uniqueGames.toLocaleString() },
        { icon: <BarChart2 size={14} className="text-green-400" />, label: "Top Game", value: `${stats.topGame?.name ?? "—"} (${stats.topGame?.count ?? 0})` },
        { icon: <Calendar size={14} className="text-white/40" />, label: "Oldest Badge", value: stats.oldest ? `${stats.oldest.name} · ${fmtAwardDate(stats.oldest.awardedDate)}` : "—" },
        { icon: <Calendar size={14} className="text-white/40" />, label: "Newest Badge", value: stats.newest ? `${stats.newest.name} · ${fmtAwardDate(stats.newest.awardedDate)}` : "—" },
      ].map(({ icon, label, value }) => (
        <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs text-white/40">{label}</span></div>
          <p className="text-sm font-semibold text-white truncate">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Collection ───────────────────────────────────────────────────────────

function CollectionTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserHeader | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [sort, setSort] = useState<SortMode>("recent");
  const [gameFilter, setGameFilter] = useState("");

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setUser(null);
    setBadges([]);
    try {
      const u = await resolveUser(q);
      const b = await fetchBadges(u.id);
      setUser(u);
      setBadges(b);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let b = [...badges];
    if (gameFilter) b = b.filter((x) => (x.awardingUniverse?.name ?? "").toLowerCase().includes(gameFilter.toLowerCase()));
    if (sort === "recent") b.sort((a, z) => new Date(z.awardedDate ?? 0).getTime() - new Date(a.awardedDate ?? 0).getTime());
    if (sort === "alpha") b.sort((a, z) => a.name.localeCompare(z.name));
    if (sort === "game") b.sort((a, z) => (a.awardingUniverse?.name ?? "").localeCompare(z.awardingUniverse?.name ?? ""));
    return b;
  }, [badges, sort, gameFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter Roblox username…"
          className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          <Search size={16} className="text-white" />
        </button>
      </div>

      {error && <ErrorCard message={error} onRetry={handleSearch} />}

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
          </div>
        </div>
      )}

      {user && !loading && (
        <>
          {/* User header */}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.displayName} width={48} height={48} className="rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/10" />
            )}
            <div>
              <p className="font-bold text-white">{user.displayName}</p>
              <p className="text-xs text-white/40">@{user.username} · {badges.length.toLocaleString()} badges</p>
            </div>
          </div>

          {/* Stats */}
          <BadgeStats badges={badges} />

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5">
              <Filter size={12} className="text-white/30" />
              <input
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                placeholder="Filter by game…"
                className="bg-transparent text-sm text-white placeholder-white/30 focus:outline-none w-32"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="alpha">Alphabetical</option>
              <option value="game">By Game</option>
            </select>
            <span className="ml-auto text-xs text-white/30 self-center">{filtered.length} badges</span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {filtered.map((b) => <BadgeCard key={b.id} badge={b} />)}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-sm text-white/30 py-6">No badges match your filter.</p>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab: Compare ──────────────────────────────────────────────────────────────

function CompareTab() {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    userA: UserHeader; userB: UserHeader;
    onlyA: Badge[]; shared: Badge[]; onlyB: Badge[];
  } | null>(null);

  async function handleCompare() {
    if (!nameA.trim() || !nameB.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const [uA, uB] = await Promise.all([resolveUser(nameA.trim()), resolveUser(nameB.trim())]);
      const [bA, bB] = await Promise.all([fetchBadges(uA.id), fetchBadges(uB.id)]);
      const idsB = new Set(bB.map((b) => b.id));
      const idsA = new Set(bA.map((b) => b.id));
      const onlyA = bA.filter((b) => !idsB.has(b.id));
      const shared = bA.filter((b) => idsB.has(b.id));
      const onlyB = bB.filter((b) => !idsA.has(b.id));
      setResult({ userA: uA, userB: uB, onlyA, shared, onlyB });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Compare failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <input value={nameA} onChange={(e) => setNameA(e.target.value)} placeholder="User A" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500" />
        <input value={nameB} onChange={(e) => setNameB(e.target.value)} placeholder="User B" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500" />
      </div>
      <button onClick={handleCompare} disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
        <GitCompare size={14} /> {loading ? "Comparing…" : "Compare Badge Collections"}
      </button>

      {error && <ErrorCard message={error} onRetry={handleCompare} />}

      {result && (
        <div className="space-y-4">
          {/* User cards */}
          <div className="grid grid-cols-2 gap-2">
            {([result.userA, result.userB] as UserHeader[]).map((u) => (
              <div key={u.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-2">
                {u.avatarUrl ? (
                  <Image src={u.avatarUrl} alt={u.displayName} width={36} height={36} className="rounded-lg object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white/10" />
                )}
                <div>
                  <p className="text-sm font-bold text-white">{u.displayName}</p>
                  <p className="text-xs text-white/40">@{u.username}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 3-column layout */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Only A", count: result.onlyA.length, color: "text-red-400", badges: result.onlyA },
              { label: "Both", count: result.shared.length, color: "text-indigo-400", badges: result.shared },
              { label: "Only B", count: result.onlyB.length, color: "text-green-400", badges: result.onlyB },
            ].map(({ label, count, color, badges }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-2 space-y-2">
                <p className={`text-sm font-bold ${color}`}>{label}</p>
                <p className="text-xs text-white/40">{count}</p>
                <div className="grid grid-cols-2 gap-1">
                  {badges.slice(0, 8).map((b) => (
                    <div key={b.id} title={b.name}>
                      {b.imageUrl ? (
                        <Image src={b.imageUrl} alt={b.name} width={40} height={40} className="rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10" />
                      )}
                    </div>
                  ))}
                </div>
                {badges.length > 8 && (
                  <p className="text-xs text-white/30">+{badges.length - 8} more</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "collection", label: "Collection", icon: Medal },
  { id: "compare", label: "Compare", icon: GitCompare },
];

export default function BadgeVaultPage() {
  const [tab, setTab] = useState("collection");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Badge Vault</h1>
        <p className="text-sm text-white/40">Browse, analyse, and compare Roblox badge collections.</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === id ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === "collection" && <CollectionTab />}
      {tab === "compare" && <CompareTab />}
    </div>
  );
}
