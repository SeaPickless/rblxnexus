"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Search, Users, Link2, AlertTriangle, ChevronDown, Copy, Check
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  avatarUrl?: string;
}

interface SocialStats {
  user: RobloxUser;
  followers: number;
  following: number;
  friends: number;
  created: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function accountAgeFull(created: string) {
  const ms = Date.now() - new Date(created).getTime();
  const totalDays = Math.floor(ms / 86400000);
  const years = Math.floor(totalDays / 365);
  const days = totalDays % 365;
  return `${years}y ${days}d`;
}

// ── API ───────────────────────────────────────────────────────────────────────

async function resolveUsername(username: string): Promise<{ id: number; name: string; displayName: string }> {
  const res = await fetch("/api/roblox/users/usernames", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  if (!res.ok) throw new Error("User not found");
  const data = await res.json();
  const entry = data.data?.[0];
  if (!entry) throw new Error("User not found");
  return { id: entry.id, name: entry.name, displayName: entry.displayName };
}

async function fetchAvatarUrl(userId: number): Promise<string | undefined> {
  try {
    const res = await fetch(`/api/roblox/thumbnails/users?userIds=${userId}&size=150x150&format=Png`);
    if (res.ok) {
      const data = await res.json();
      return data.data?.[0]?.imageUrl;
    }
  } catch { /* non-fatal */ }
  return undefined;
}

async function fetchAvatarUrls(userIds: number[]): Promise<Record<number, string>> {
  if (userIds.length === 0) return {};
  try {
    const res = await fetch(`/api/roblox/thumbnails/users?userIds=${userIds.join(",")}&size=48x48&format=Png`);
    if (res.ok) {
      const data = await res.json();
      const map: Record<number, string> = {};
      (data.data ?? []).forEach((t: { targetId: number; imageUrl: string }) => { map[t.targetId] = t.imageUrl; });
      return map;
    }
  } catch { /* non-fatal */ }
  return {};
}

async function fetchFollowerPage(
  userId: number,
  type: "followers" | "following",
  cursor?: string
): Promise<{ users: RobloxUser[]; nextCursor?: string }> {
  const params = new URLSearchParams({ limit: "50" });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/roblox/${type}/${userId}?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch ${type}`);
  const data = await res.json();
  const users: RobloxUser[] = data.data ?? [];
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    const avMap = await fetchAvatarUrls(ids);
    users.forEach((u) => { u.avatarUrl = avMap[u.id]; });
  }
  return { users, nextCursor: data.nextPageCursor ?? undefined };
}

async function fetchCount(userId: number, type: "followers" | "following" | "friends"): Promise<number> {
  const res = await fetch(`/api/roblox/${type}/${userId}/count`);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
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

function UserRow({ user, onLookup }: { user: RobloxUser; onLookup?: (u: RobloxUser) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={user.displayName} width={36} height={36} className="rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{user.displayName}</p>
        <p className="text-xs text-white/40">@{user.name}</p>
      </div>
      {onLookup && (
        <button
          onClick={() => onLookup(user)}
          className="text-xs text-indigo-400 hover:underline shrink-0"
        >
          Lookup
        </button>
      )}
    </div>
  );
}

// ── Social Stats Card ─────────────────────────────────────────────────────────

function SocialStatsCard({ stats }: { stats: SocialStats }) {
  const [copied, setCopied] = useState(false);
  const ratio = stats.following > 0 ? (stats.followers / stats.following).toFixed(1) : "∞";
  const profileUrl = `https://www.roblox.com/users/${stats.user.id}/profile`;

  function copyLink() {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      toast.success("Profile link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-white/5 p-4 space-y-4">
      <div className="flex items-center gap-3">
        {stats.user.avatarUrl ? (
          <Image src={stats.user.avatarUrl} alt={stats.user.displayName} width={56} height={56} className="rounded-xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/10" />
        )}
        <div>
          <p className="font-bold text-white">{stats.user.displayName}</p>
          <p className="text-xs text-white/40">@{stats.user.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          ["Followers", fmtNum(stats.followers)],
          ["Following", fmtNum(stats.following)],
          ["Friends", fmtNum(stats.friends)],
          ["Ratio", `${ratio}x`],
          ["Account Age", accountAgeFull(stats.created)],
        ].map(([label, val]) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-base font-bold text-white">{val}</p>
            <p className="text-xs text-white/40">{label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={copyLink}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white transition-colors"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        {copied ? "Copied!" : "Copy Profile Link"}
      </button>
    </div>
  );
}

// ── Tab: Followers/Following Browser ─────────────────────────────────────────

function FollowerBrowserTab() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"followers" | "following">("followers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userHeader, setUserHeader] = useState<SocialStats | null>(null);
  const [users, setUsers] = useState<RobloxUser[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setUsers([]);
    setCursor(undefined);
    setUserHeader(null);
    try {
      const resolved = await resolveUsername(q);
      const [followers, following, friends, avatarUrl, infoRes] = await Promise.all([
        fetchCount(resolved.id, "followers"),
        fetchCount(resolved.id, "following"),
        fetchCount(resolved.id, "friends"),
        fetchAvatarUrl(resolved.id),
        fetch(`/api/roblox/users/${resolved.id}`),
      ]);
      const info = infoRes.ok ? await infoRes.json() : { created: new Date().toISOString() };
      setUserHeader({
        user: { ...resolved, avatarUrl },
        followers, following, friends,
        created: info.created,
      });
      setUserId(resolved.id);
      const { users: firstPage, nextCursor } = await fetchFollowerPage(resolved.id, mode);
      setUsers(firstPage);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function switchMode(newMode: "followers" | "following") {
    if (!userId || newMode === mode) { setMode(newMode); return; }
    setMode(newMode);
    setUsers([]);
    setCursor(undefined);
    setLoadingMore(true);
    try {
      const { users: page, nextCursor } = await fetchFollowerPage(userId, newMode);
      setUsers(page);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch { toast.error("Failed to load"); }
    finally { setLoadingMore(false); }
  }

  async function loadMore() {
    if (!userId || !cursor) return;
    setLoadingMore(true);
    try {
      const { users: more, nextCursor } = await fetchFollowerPage(userId, mode, cursor);
      setUsers((p) => [...p, ...more]);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch { toast.error("Failed to load more"); }
    finally { setLoadingMore(false); }
  }

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

      {loading && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}

      {userHeader && !loading && (
        <>
          <SocialStatsCard stats={userHeader} />

          {/* Mode tabs */}
          <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
            {(["followers", "following"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                  mode === m ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {m} ({m === "followers" ? fmtNum(userHeader.followers) : fmtNum(userHeader.following)})
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {users.map((u) => <UserRow key={u.id} user={u} />)}
            {loadingMore && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            {hasMore && !loadingMore && (
              <button
                onClick={loadMore}
                className="w-full py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:border-indigo-500/50 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronDown size={14} /> Load More
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Mutual Finder ────────────────────────────────────────────────────────

function MutualFinderTab() {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutuals, setMutuals] = useState<RobloxUser[] | null>(null);

  async function handleFind() {
    if (!nameA.trim() || !nameB.trim()) return;
    setLoading(true);
    setError(null);
    setMutuals(null);
    try {
      const [uA, uB] = await Promise.all([resolveUsername(nameA.trim()), resolveUsername(nameB.trim())]);

      // Fetch all followers for both (up to first page for now)
      async function getAllFollowers(uid: number): Promise<Set<number>> {
        const set = new Set<number>();
        let cur: string | undefined;
        for (let i = 0; i < 20; i++) { // max 20 pages = 1000 followers
          const { users, nextCursor } = await fetchFollowerPage(uid, "followers", cur);
          users.forEach((u) => set.add(u.id));
          cur = nextCursor;
          if (!cur) break;
        }
        return set;
      }

      const [setA, setB] = await Promise.all([getAllFollowers(uA.id), getAllFollowers(uB.id)]);
      const mutualIds = [...setA].filter((id) => setB.has(id));
      const avMap = await fetchAvatarUrls(mutualIds.slice(0, 50));

      // We need display names for mutual ids — fetch from API
      const mutualUsers: RobloxUser[] = mutualIds.slice(0, 50).map((id) => ({
        id, name: String(id), displayName: String(id), avatarUrl: avMap[id],
      }));

      // Bulk user lookup
      if (mutualIds.length > 0) {
        try {
          const uRes = await fetch("/api/roblox/users/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: mutualIds.slice(0, 50) }),
          });
          if (uRes.ok) {
            const uData = await uRes.json();
            const map: Record<number, { name: string; displayName: string }> = {};
            (uData.data ?? []).forEach((u: { id: number; name: string; displayName: string }) => { map[u.id] = u; });
            mutualUsers.forEach((u) => {
              if (map[u.id]) { u.name = map[u.id].name; u.displayName = map[u.id].displayName; }
            });
          }
        } catch { /* non-fatal */ }
      }

      setMutuals(mutualUsers);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
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
      <button
        onClick={handleFind}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Link2 size={14} /> {loading ? "Finding mutuals…" : "Find Mutual Followers"}
      </button>

      {error && <ErrorCard message={error} onRetry={handleFind} />}

      {mutuals !== null && (
        <div className="space-y-3">
          <p className="text-sm text-white/60">
            {mutuals.length === 0
              ? "No mutual followers found."
              : `${mutuals.length} mutual follower${mutuals.length !== 1 ? "s" : ""} found`}
          </p>
          {mutuals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mutuals.map((u) => <UserRow key={u.id} user={u} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "browser", label: "Followers/Following", icon: Users },
  { id: "mutuals", label: "Mutual Finder", icon: Link2 },
];

export default function FollowerFeedPage() {
  const [tab, setTab] = useState("browser");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Follower Feed</h1>
        <p className="text-sm text-white/40">Browse followers, find mutuals, and analyse social stats.</p>
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

      {tab === "browser" && <FollowerBrowserTab />}
      {tab === "mutuals" && <MutualFinderTab />}
    </div>
  );
}
