"use client";
// src/app/hub/groupintel/page.tsx
// HUB 3 — GROUP INTEL
// Features: Group Search · Role Breakdown · Member Browser

import { useState } from "react";
import Image from "next/image";
import { Shield, Search, Users, ChevronRight } from "lucide-react";
import LoadingBar  from "@/components/LoadingBar";
import ErrorCard   from "@/components/ErrorCard";
import GroupCard   from "@/components/GroupCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface GroupResult {
  id: number; name: string; description?: string;
  memberCount: number; owner?: { username: string; userId: number };
  publicEntryAllowed: boolean; shout?: { body: string; poster: { username: string }; updated: string } | null;
  thumbnailUrl?: string | null;
}
interface Role  { id: number; name: string; rank: number; memberCount: number; }
interface Member {
  user: { userId: number; username: string; displayName: string };
  role: { name: string };
  avatarUrl?: string | null;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function HubTitle() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <Shield size={22} style={{ color: "var(--color-accent)" }} />
        <h1 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "22px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", margin: 0, textShadow: "0 0 20px rgba(var(--color-accent-rgb),0.5)" }}>Group Intel</h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", letterSpacing: "0.06em", margin: 0 }}>Search groups, inspect roles, and browse members.</p>
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

export default function GroupIntelPage() {
  const [query,       setQuery]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [results,     setResults]     = useState<GroupResult[] | null>(null);
  const [selected,    setSelected]    = useState<GroupResult | null>(null);
  const [roles,       setRoles]       = useState<Role[] | null>(null);
  const [rolesLoading,setRolesLoading]= useState(false);
  const [rolesError,  setRolesError]  = useState<string | null>(null);
  const [members,     setMembers]     = useState<Member[] | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError,   setMembersError]   = useState<string | null>(null);
  const [cursor,      setCursor]      = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResults(null); setSelected(null); setRoles(null); setMembers(null);
    try {
      const res  = await fetch(`/api/proxy/groups/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      setResults(data.data ?? []);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Search failed."); }
    finally { setLoading(false); }
  }

  async function handleSelectGroup(group: GroupResult) {
    setSelected(group); setRoles(null); setMembers(null);
    // Load roles automatically
    setRolesLoading(true); setRolesError(null);
    try {
      const res  = await fetch(`/api/proxy/groups/roles?groupId=${group.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      const sorted = (Array.isArray(data) ? data : data.roles ?? []).sort((a: Role, b: Role) => b.rank - a.rank);
      setRoles(sorted);
    } catch (e: unknown) { setRolesError(e instanceof Error ? e.message : "Failed to load roles."); }
    finally { setRolesLoading(false); }
  }

  async function loadMembers(nextCursor?: string) {
    if (!selected) return;
    setMembersLoading(true); setMembersError(null);
    try {
      const url = `/api/proxy/groups/members?groupId=${selected.id}${nextCursor ? `&cursor=${nextCursor}` : ""}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      const newMembers: Member[] = data.data ?? [];
      // Fetch avatars best-effort
      const withAvatars = await Promise.all(newMembers.map(async (m: Member) => {
        try {
          const r = await fetch(`/api/proxy/thumbnail?userId=${m.user.userId}&size=100x100`);
          const d = await r.json();
          return { ...m, avatarUrl: d.imageUrl ?? null };
        } catch { return m; }
      }));
      setMembers((prev) => nextCursor ? [...(prev ?? []), ...withAvatars] : withAvatars);
      setCursor(data.nextPageCursor ?? null);
    } catch (e: unknown) { setMembersError(e instanceof Error ? e.message : "Failed to load members."); }
    finally { setMembersLoading(false); }
  }

  const totalMembers = roles?.reduce((sum, r) => sum + (r.memberCount ?? 0), 0) ?? 0;

  return (
    <div className="hub-enter p-6 max-w-4xl mx-auto">
      <HubTitle />

      {/* ── Search ── */}
      <div className="rn-card mb-6">
        <SectionTitle title="Group Search" />
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search Roblox groups…"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "14px", outline: "none" }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(var(--color-accent-rgb),0.15)"; }}
            onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
          />
          <button onClick={handleSearch} disabled={loading} className="rn-btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
            <Search size={14} /> Search
          </button>
        </div>
        {loading && <LoadingBar estimatedSeconds={2} />}
        {error   && <ErrorCard message={error} onRetry={handleSearch} />}
        {results !== null && !loading && results.length === 0 && <EmptyState icon={Search} title="No groups found" desc="Try a different keyword." />}
        {results !== null && !loading && results.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            {results.map((g) => (
              <div key={g.id} onClick={() => handleSelectGroup(g)} style={{ cursor: "pointer" }}>
                <GroupCard
                  groupId={g.id} name={g.name}
                  description={g.description} memberCount={g.memberCount}
                  ownerName={g.owner?.username} isPublic={g.publicEntryAllowed}
                  shout={g.shout ?? null} iconUrl={g.thumbnailUrl ?? null}
                />
              </div>
            ))}
          </div>
        )}
        {results === null && !loading && !error && <EmptyState icon={Shield} title="Search for a group" desc="Enter a group name to inspect it." />}
      </div>

      {/* ── Selected group details ── */}
      {selected && (
        <>
          {/* Role Breakdown */}
          <div className="rn-card mb-6">
            <SectionTitle title="Role Breakdown" />
            {rolesLoading && <LoadingBar estimatedSeconds={2} />}
            {rolesError   && <ErrorCard message={rolesError} onRetry={() => handleSelectGroup(selected)} />}
            {roles && !rolesLoading && (
              <>
                <div className="flex flex-col gap-2">
                  {roles.map((r) => {
                    const pct = totalMembers > 0 ? (r.memberCount / totalMembers) * 100 : 0;
                    return (
                      <div key={r.id} className="flex items-center gap-3" style={{ padding: "8px 0", borderBottom: "1px solid rgba(var(--color-accent-rgb),0.07)" }}>
                        <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "11px", color: "var(--color-text-muted)", width: 28, textAlign: "right", flexShrink: 0 }}>{r.rank}</span>
                        <span style={{ fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "13px", color: "var(--color-text-primary)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                        <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(var(--color-accent-rgb),0.12)", overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-accent)", boxShadow: "0 0 4px rgba(var(--color-accent-rgb),0.6)", transition: "width 600ms ease" }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "12px", color: "var(--color-accent)", width: 52, textAlign: "right", flexShrink: 0 }}>{(r.memberCount ?? 0).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-3">
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>
                    Total: <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color: "var(--color-accent)" }}>{totalMembers.toLocaleString()}</span> members
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Member Browser */}
          <div className="rn-card">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title="Member Browser" />
              {!members && !membersLoading && (
                <button onClick={() => loadMembers()} className="rn-btn-secondary" style={{ fontSize: "10px" }}>
                  <Users size={13} /> Browse Members
                </button>
              )}
            </div>
            {membersLoading && <LoadingBar estimatedSeconds={3} />}
            {membersError   && <ErrorCard message={membersError} onRetry={() => loadMembers()} />}
            {members && !membersLoading && (
              <>
                <div className="flex flex-col gap-1">
                  {members.map((m) => (
                    <div key={m.user.userId} className="flex items-center gap-3 p-2 rounded-md" style={{ transition: "background 150ms ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(var(--color-accent-rgb),0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(var(--color-accent-rgb),0.35)", boxShadow: "0 0 6px rgba(var(--color-accent-rgb),0.2)", background: "var(--color-elevated)", position: "relative", flexShrink: 0 }}>
                        {m.avatarUrl
                          ? <Image src={m.avatarUrl} alt={m.user.displayName} fill sizes="34px" style={{ objectFit: "cover" }} />
                          : <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "var(--color-accent)" }}>{m.user.displayName.charAt(0)}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.user.displayName}</p>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>@{m.user.username}</p>
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)", flexShrink: 0, letterSpacing: "0.04em" }}>{m.role?.name}</span>
                      <ChevronRight size={13} style={{ color: "rgba(var(--color-accent-rgb),0.3)", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
                {cursor && (
                  <button onClick={() => loadMembers(cursor)} disabled={membersLoading} className="rn-btn-secondary w-full mt-4" style={{ fontSize: "11px" }}>
                    Load More
                  </button>
                )}
              </>
            )}
            {!members && !membersLoading && !membersError && <EmptyState icon={Users} title="No members loaded" desc='Click "Browse Members" to load the member list.' />}
          </div>
        </>
      )}
    </div>
  );
}
