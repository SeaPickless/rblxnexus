"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Search, Users, Shield, ExternalLink, ChevronDown,
  ChevronUp, ChevronRight, AlertTriangle, List
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GroupInfo {
  id: number;
  name: string;
  description: string;
  owner: { userId: number; username: string; displayName: string };
  memberCount: number;
  publicEntryAllowed: boolean;
  shout?: { body: string; poster: { username: string }; created: string };
  iconUrl?: string;
}

interface GroupRole {
  id: number;
  name: string;
  rank: number;
  memberCount: number;
}

interface GroupMember {
  user: { userId: number; username: string; displayName: string };
  role: { name: string };
  avatarUrl?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── API ───────────────────────────────────────────────────────────────────────

async function searchGroups(keyword: string): Promise<GroupInfo[]> {
  const res = await fetch(`/api/roblox/groups/search?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error("Group search failed");
  const data = await res.json();
  const groups: GroupInfo[] = data.data ?? [];

  // Fetch icons
  if (groups.length > 0) {
    const ids = groups.map((g) => g.id).join(",");
    try {
      const iRes = await fetch(`/api/roblox/thumbnails/groups?groupIds=${ids}&size=150x150&format=Png`);
      if (iRes.ok) {
        const iData = await iRes.json();
        const map: Record<number, string> = {};
        (iData.data ?? []).forEach((t: { targetId: number; imageUrl: string }) => {
          map[t.targetId] = t.imageUrl;
        });
        groups.forEach((g) => { g.iconUrl = map[g.id] ?? undefined; });
      }
    } catch { /* non-fatal */ }
  }

  return groups;
}

async function fetchGroupRoles(groupId: number): Promise<GroupRole[]> {
  const res = await fetch(`/api/roblox/groups/${groupId}/roles`);
  if (!res.ok) throw new Error("Failed to fetch roles");
  const data = await res.json();
  return (data.roles ?? []).sort((a: GroupRole, b: GroupRole) => b.rank - a.rank);
}

async function fetchGroupMembers(
  groupId: number,
  cursor?: string
): Promise<{ members: GroupMember[]; nextCursor?: string }> {
  const params = new URLSearchParams({ limit: "50" });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/roblox/groups/${groupId}/members?${params}`);
  if (!res.ok) throw new Error("Failed to fetch members");
  const data = await res.json();
  const members: GroupMember[] = data.data ?? [];

  // Avatar headshots
  if (members.length > 0) {
    const ids = members.map((m) => m.user.userId).join(",");
    try {
      const aRes = await fetch(`/api/roblox/thumbnails/users?userIds=${ids}&size=48x48&format=Png`);
      if (aRes.ok) {
        const aData = await aRes.json();
        const map: Record<number, string> = {};
        (aData.data ?? []).forEach((t: { targetId: number; imageUrl: string }) => {
          map[t.targetId] = t.imageUrl;
        });
        members.forEach((m) => { m.avatarUrl = map[m.user.userId] ?? undefined; });
      }
    } catch { /* non-fatal */ }
  }

  return { members, nextCursor: data.nextPageCursor ?? undefined };
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
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-red-400 hover:text-red-200 underline">Retry</button>
      )}
    </div>
  );
}

// ── Group Card ────────────────────────────────────────────────────────────────

function GroupCard({
  group,
  onSelect,
  selected,
}: {
  group: GroupInfo;
  onSelect: (g: GroupInfo) => void;
  selected: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-2xl border bg-white/5 p-4 space-y-3 transition-colors ${
        selected ? "border-indigo-500/60" : "border-white/10"
      }`}
    >
      <div className="flex gap-3 items-start">
        {group.iconUrl ? (
          <Image src={group.iconUrl} alt={group.name} width={56} height={56} className="rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0 flex items-center justify-center">
            <Shield size={24} className="text-white/20" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-white text-sm">{group.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              group.publicEntryAllowed
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            }`}>
              {group.publicEntryAllowed ? "Public" : "Private"}
            </span>
          </div>
          <p className="text-xs text-white/40">{fmtNum(group.memberCount)} members</p>
          <p className="text-xs text-white/40">Owner: {group.owner.displayName}</p>
        </div>
      </div>

      {/* Shout */}
      {group.shout && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-indigo-400 mb-1">📢 Shout by {group.shout.poster.username}</p>
          <p className="text-sm text-white/70">{group.shout.body}</p>
          <p className="text-xs text-white/30 mt-1">{fmtDate(group.shout.created)}</p>
        </div>
      )}

      {/* Description */}
      {group.description && (
        <div>
          <p className={`text-sm text-white/60 ${expanded ? "" : "line-clamp-3"}`}>
            {group.description}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs text-indigo-400 flex items-center gap-1"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Less" : "More"}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <a
          href={`https://www.roblox.com/groups/${group.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:underline"
        >
          <ExternalLink size={12} /> View on Roblox
        </a>
        <button
          onClick={() => onSelect(group)}
          className="ml-auto flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
        >
          <List size={12} /> {selected ? "Viewing details" : "View details"}
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Role Breakdown ────────────────────────────────────────────────────────────

function RoleBreakdown({ groupId, totalMembers }: { groupId: number; totalMembers: number }) {
  const [roles, setRoles] = useState<GroupRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchGroupRoles(groupId);
      setRoles(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  // Load on mount
  useState(() => { load(); });

  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>;
  if (error) return <ErrorCard message={error} onRetry={load} />;

  return (
    <div className="space-y-2">
      {roles.map((role) => {
        const pct = totalMembers > 0 ? (role.memberCount / totalMembers) * 100 : 0;
        return (
          <div key={role.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30 font-mono">[{role.rank}]</span>
                <span className="text-sm text-white font-medium">{role.name}</span>
              </div>
              <span className="text-xs text-white/40">{fmtNum(role.memberCount)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-white/30 text-right">Total: {fmtNum(totalMembers)} members</p>
    </div>
  );
}

// ── Member Browser ────────────────────────────────────────────────────────────

function MemberBrowser({ groupId }: { groupId: number }) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  async function load(reset = false) {
    setLoading(true);
    setError(null);
    try {
      const { members: newMembers, nextCursor } = await fetchGroupMembers(
        groupId,
        reset ? undefined : cursor
      );
      setMembers((prev) => (reset ? newMembers : [...prev, ...newMembers]));
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  useState(() => { load(true); });

  if (error) return <ErrorCard message={error} onRetry={() => load(true)} />;

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div key={m.user.userId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
          {m.avatarUrl ? (
            <Image src={m.avatarUrl} alt={m.user.displayName} width={36} height={36} className="rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{m.user.displayName}</p>
            <p className="text-xs text-white/40">@{m.user.username} · {m.role.name}</p>
          </div>
          <a
            href={`/hub/social?u=${m.user.username}`}
            className="text-xs text-indigo-400 hover:underline shrink-0"
          >
            Lookup
          </a>
        </div>
      ))}

      {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}

      {hasMore && !loading && (
        <button
          onClick={() => load()}
          className="w-full py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:border-indigo-500/50 transition-colors"
        >
          Load More
        </button>
      )}

      {!hasMore && members.length > 0 && (
        <p className="text-xs text-white/30 text-center">All {members.length} members loaded.</p>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function GroupDetailPanel({ group }: { group: GroupInfo }) {
  const [activeSection, setActiveSection] = useState<"roles" | "members" | null>(null);

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-white/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-white">Group Details</p>
        <span className="text-xs text-white/30">ID: {group.id}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection(activeSection === "roles" ? null : "roles")}
          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
            activeSection === "roles"
              ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
              : "border-white/10 text-white/50 hover:text-white"
          }`}
        >
          Role Breakdown
        </button>
        <button
          onClick={() => setActiveSection(activeSection === "members" ? null : "members")}
          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
            activeSection === "members"
              ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
              : "border-white/10 text-white/50 hover:text-white"
          }`}
        >
          Browse Members
        </button>
      </div>

      {activeSection === "roles" && (
        <RoleBreakdown groupId={group.id} totalMembers={group.memberCount} />
      )}
      {activeSection === "members" && (
        <MemberBrowser groupId={group.id} />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GroupIntelPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selected, setSelected] = useState<GroupInfo | null>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const results = await searchGroups(q);
      setGroups(results);
      if (results.length === 0) toast("No groups found.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Search failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Group Intel</h1>
        <p className="text-sm text-white/40">Search groups, inspect roles, and browse members.</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search groups by name…"
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
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="space-y-4">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              onSelect={setSelected}
              selected={selected?.id === g.id}
            />
          ))}
        </div>
      )}

      {selected && <GroupDetailPanel group={selected} />}
    </div>
  );
}
