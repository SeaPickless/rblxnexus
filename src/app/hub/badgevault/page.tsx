"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Search, Users, GitCompare, Shield, ExternalLink,
  UserCheck, Clock, ChevronDown, ChevronUp, AlertTriangle
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
}

interface UserPresence {
  userPresenceType: number; // 0=Offline 1=Online 2=InGame 3=InStudio
  lastLocation?: string;
  placeId?: number;
  gameId?: string;
  universeId?: number;
}

interface UserStats {
  friends: number;
  followers: number;
  following: number;
}

interface FullUser {
  info: RobloxUser;
  presence: UserPresence | null;
  stats: UserStats | null;
  avatarUrl: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const PRESENCE_LABELS: Record<number, string> = {
  0: "Offline", 1: "Online", 2: "In Game", 3: "In Studio",
};
const PRESENCE_COLORS: Record<number, string> = {
  0: "bg-gray-500", 1: "bg-green-500", 2: "bg-blue-500", 3: "bg-purple-500",
};

function accountAge(created: string) {
  const ms = Date.now() - new Date(created).getTime();
  const days = Math.floor(ms / 86400000);
  const years = Math.floor(days / 365);
  const rem = days % 365;
  return years > 0 ? `${years}y ${rem}d` : `${days}d`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── API helpers (proxy routes) ────────────────────────────────────────────────

async function fetchUser(username: string): Promise<FullUser> {
  // 1. Resolve username → id
  const idRes = await fetch("/api/roblox/users/usernames", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  if (!idRes.ok) throw new Error("User not found");
  const idData = await idRes.json();
  const userEntry = idData.data?.[0];
  if (!userEntry) throw new Error("User not found");
  const id = userEntry.id;

  // 2. Fetch profile
  const infoRes = await fetch(`/api/roblox/users/${id}`);
  if (!infoRes.ok) throw new Error("Failed to fetch user info");
  const info: RobloxUser = await infoRes.json();

  // 3. Presence
  let presence: UserPresence | null = null;
  try {
    const pRes = await fetch("/api/roblox/presence/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [id] }),
    });
    if (pRes.ok) {
      const pData = await pRes.json();
      presence = pData.userPresences?.[0] ?? null;
    }
  } catch { /* non-fatal */ }

  // 4. Stats (friends / followers / following)
  let stats: UserStats | null = null;
  try {
    const [frRes, foRes, fwRes] = await Promise.all([
      fetch(`/api/roblox/friends/${id}/count`),
      fetch(`/api/roblox/followers/${id}/count`),
      fetch(`/api/roblox/following/${id}/count`),
    ]);
    stats = {
      friends: frRes.ok ? (await frRes.json()).count : 0,
      followers: foRes.ok ? (await foRes.json()).count : 0,
      following: fwRes.ok ? (await fwRes.json()).count : 0,
    };
  } catch { /* non-fatal */ }

  // 5. Avatar thumbnail
  let avatarUrl: string | null = null;
  try {
    const avRes = await fetch(
      `/api/roblox/thumbnails/users?userIds=${id}&size=150x150&format=Png`
    );
    if (avRes.ok) {
      const avData = await avRes.json();
      avatarUrl = avData.data?.[0]?.imageUrl ?? null;
    }
  } catch { /* non-fatal */ }

  return { info, presence, stats, avatarUrl };
}

async function fetchFriends(userId: number): Promise<RobloxUser[]> {
  const res = await fetch(`/api/roblox/friends/${userId}/list`);
  if (!res.ok) throw new Error("Failed to fetch friends");
  const data = await res.json();
  return data.data ?? [];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-white/5 ${className ?? ""}`} />
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
      <AlertTriangle className="shrink-0 text-red-400" size={18} />
      <span className="text-sm text-red-300 flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-400 hover:text-red-200 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function UserCard({ user }: { user: FullUser }) {
  const [expanded, setExpanded] = useState(false);
  const p = user.presence;
  const presenceType = p?.userPresenceType ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex gap-4 items-start">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.info.displayName}
            width={80}
            height={80}
            className="rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-white/10 shrink-0 flex items-center justify-center">
            <Users size={32} className="text-white/30" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-lg text-white truncate">
              {user.info.displayName}
            </span>
            {user.info.isBanned && (
              <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
                <Shield size={10} /> Banned
              </span>
            )}
          </div>
          <p className="text-sm text-white/50">@{user.info.name}</p>
          <p className="text-xs text-white/40">ID: {user.info.id}</p>

          {/* Presence badge */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${PRESENCE_COLORS[presenceType]}`}
            />
            <span className="text-sm text-white/70">
              {PRESENCE_LABELS[presenceType]}
              {presenceType === 2 && p?.lastLocation && ` · ${p.lastLocation}`}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {user.stats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Friends", user.stats.friends],
            ["Followers", user.stats.followers],
            ["Following", user.stats.following],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl bg-white/5 p-3">
              <p className="text-lg font-bold text-white">
                {(val as number).toLocaleString()}
              </p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-white/50">
        <span className="flex items-center gap-1">
          <Clock size={12} /> Joined {fmtDate(user.info.created)}
        </span>
        <span className="flex items-center gap-1">
          <UserCheck size={12} /> {accountAge(user.info.created)} old
        </span>
      </div>

      {/* Bio */}
      {user.info.description && (
        <div>
          <p
            className={`text-sm text-white/60 whitespace-pre-wrap ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {user.info.description}
          </p>
          {user.info.description.split("\n").length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs text-indigo-400 flex items-center gap-1"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* CTA */}
      <a
        href={`https://www.roblox.com/users/${user.info.id}/profile`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 transition-colors"
      >
        <ExternalLink size={14} /> View on Roblox
      </a>
    </div>
  );
}

// ── Tab: User Lookup ──────────────────────────────────────────────────────────

function UserLookupTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FullUser | null>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setUser(null);
    try {
      const result = await fetchUser(q);
      setUser(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-16" />
          <Skeleton className="h-8" />
        </div>
      )}
      {error && <ErrorCard message={error} onRetry={handleSearch} />}
      {user && <UserCard user={user} />}
    </div>
  );
}

// ── Tab: Friend Radar ─────────────────────────────────────────────────────────

function FriendRadarTab() {
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    target: FullUser;
    mutuals: RobloxUser[];
    hopDistance: number;
  } | null>(null);

  async function handleScan() {
    const a = userA.trim();
    const b = userB.trim();
    if (!a || !b) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const [fullA, fullB] = await Promise.all([fetchUser(a), fetchUser(b)]);
      const [friendsA, friendsB] = await Promise.all([
        fetchFriends(fullA.info.id),
        fetchFriends(fullB.info.id),
      ]);
      const idsA = new Set(friendsA.map((f) => f.id));
      const idsB = new Set(friendsB.map((f) => f.id));

      let hopDistance = 3;
      if (idsA.has(fullB.info.id)) hopDistance = 1;
      else if ([...idsA].some((id) => idsB.has(id))) hopDistance = 2;

      const mutuals = friendsA.filter((f) => idsB.has(f.id));
      setResult({ target: fullB, mutuals, hopDistance });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Scan failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const hopLabel = (h: number) =>
    h === 1 ? "Direct Friend" : h === 2 ? "Friend-of-Friend" : "Extended Network";
  const hopColor = (h: number) =>
    h === 1 ? "bg-green-500/20 text-green-400 border-green-500/30"
      : h === 2 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-gray-500/20 text-gray-400 border-gray-500/30";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <input
          value={userA}
          onChange={(e) => setUserA(e.target.value)}
          placeholder="Your username"
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
        />
        <input
          value={userB}
          onChange={(e) => setUserB(e.target.value)}
          placeholder="Target username"
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Users size={14} /> {loading ? "Scanning…" : "Scan Friend Network"}
      </button>

      {error && <ErrorCard message={error} onRetry={handleScan} />}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs border rounded-full px-3 py-1 font-medium ${hopColor(result.hopDistance)}`}
            >
              {result.hopDistance} Hop{result.hopDistance > 1 ? "s" : ""} · {hopLabel(result.hopDistance)}
            </span>
          </div>

          <UserCard user={result.target} />

          <div>
            <p className="text-sm text-white/60 mb-2 font-medium">
              Mutual Friends ({result.mutuals.length})
            </p>
            {result.mutuals.length === 0 ? (
              <p className="text-sm text-white/30 italic">No mutual friends found.</p>
            ) : (
              <MutualGrid mutuals={result.mutuals} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MutualGrid({ mutuals }: { mutuals: RobloxUser[] }) {
  const [avatars, setAvatars] = useState<Record<number, string>>({});
  const shown = mutuals.slice(0, 20);
  const extra = mutuals.length - 20;

  // Fetch avatars on mount
  useState(() => {
    const ids = shown.map((u) => u.id).join(",");
    fetch(`/api/roblox/thumbnails/users?userIds=${ids}&size=48x48&format=Png`)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<number, string> = {};
        (d.data ?? []).forEach((item: { targetId: number; imageUrl: string }) => {
          map[item.targetId] = item.imageUrl;
        });
        setAvatars(map);
      })
      .catch(() => {});
  });

  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((u) => (
        <div key={u.id} title={u.name} className="relative">
          {avatars[u.id] ? (
            <Image
              src={avatars[u.id]}
              alt={u.name}
              width={40}
              height={40}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/10" />
          )}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/50">
          +{extra}
        </div>
      )}
    </div>
  );
}

// ── Tab: Profile Compare ──────────────────────────────────────────────────────

function ProfileCompareTab() {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<[FullUser, FullUser] | null>(null);

  async function handleCompare() {
    if (!nameA.trim() || !nameB.trim()) return;
    setLoading(true);
    setError(null);
    setUsers(null);
    try {
      const [a, b] = await Promise.all([
        fetchUser(nameA.trim()),
        fetchUser(nameB.trim()),
      ]);
      setUsers([a, b]);
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
        <input
          value={nameA}
          onChange={(e) => setNameA(e.target.value)}
          placeholder="User A"
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
        />
        <input
          value={nameB}
          onChange={(e) => setNameB(e.target.value)}
          placeholder="User B"
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <button
        onClick={handleCompare}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <GitCompare size={14} /> {loading ? "Comparing…" : "Compare Profiles"}
      </button>

      {error && <ErrorCard message={error} onRetry={handleCompare} />}

      {users && <CompareView a={users[0]} b={users[1]} />}
    </div>
  );
}

function CompareView({ a, b }: { a: FullUser; b: FullUser }) {
  const rows: { label: string; valA: number; valB: number }[] = [
    { label: "Friends", valA: a.stats?.friends ?? 0, valB: b.stats?.friends ?? 0 },
    { label: "Followers", valA: a.stats?.followers ?? 0, valB: b.stats?.followers ?? 0 },
    { label: "Following", valA: a.stats?.following ?? 0, valB: b.stats?.following ?? 0 },
    {
      label: "Account Age (days)",
      valA: Math.floor((Date.now() - new Date(a.info.created).getTime()) / 86400000),
      valB: Math.floor((Date.now() - new Date(b.info.created).getTime()) / 86400000),
    },
  ];

  function MiniCard({ user }: { user: FullUser }) {
    return (
      <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.info.displayName} width={56} height={56} className="rounded-xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/10" />
        )}
        <p className="font-bold text-sm text-white text-center truncate max-w-full">
          {user.info.displayName}
        </p>
        {user.info.isBanned && (
          <span className="text-xs text-red-400 flex items-center gap-1"><Shield size={10} />Banned</span>
        )}
        <a
          href={`https://www.roblox.com/users/${user.info.id}/profile`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 flex items-center gap-1 hover:underline"
        >
          <ExternalLink size={10} /> View
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <MiniCard user={a} />
        <span className="text-white/30 font-bold text-sm">VS</span>
        <MiniCard user={b} />
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const winA = row.valA > row.valB;
          const winB = row.valB > row.valA;
          return (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <span
                className={`text-sm font-semibold text-right ${winA ? "text-indigo-400" : "text-white/50"}`}
              >
                {row.valA.toLocaleString()}
              </span>
              <span className="text-xs text-white/30 text-center whitespace-nowrap">
                {row.label}
              </span>
              <span
                className={`text-sm font-semibold ${winB ? "text-indigo-400" : "text-white/50"}`}
              >
                {row.valB.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "lookup", label: "User Lookup", icon: Search },
  { id: "radar", label: "Friend Radar", icon: Users },
  { id: "compare", label: "Profile Compare", icon: GitCompare },
];

export default function SocialCommanderPage() {
  const [tab, setTab] = useState("lookup");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Social Commander</h1>
        <p className="text-sm text-white/40">Lookup, radar, and compare Roblox profiles.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === id
                ? "bg-indigo-600 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "lookup" && <UserLookupTab />}
      {tab === "radar" && <FriendRadarTab />}
      {tab === "compare" && <ProfileCompareTab />}
    </div>
  );
}
