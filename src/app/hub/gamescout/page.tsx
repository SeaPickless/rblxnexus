"use client";
// src/app/hub/gamescout/page.tsx
// HUB 2 — GAME SCOUT
// Features: Game Search · Game Detail Inspector · Game Watchlist

import { useState, useEffect } from "react";
import Image from "next/image";
import { Gamepad2, Search, Star, Trash2, ExternalLink, ChevronDown, ChevronUp, Eye, X } from "lucide-react";
import LoadingBar from "@/components/LoadingBar";
import ErrorCard  from "@/components/ErrorCard";
import GameCard   from "@/components/GameCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface GameResult {
  id: number; name: string; creatorName: string;
  playing: number; visits: number;
  upVotes: number; downVotes: number; thumbnailUrl?: string | null;
}
interface GameDetail extends GameResult {
  description: string; maxPlayers: number; favorites: number;
  created: string; updated: string; genre: string;
}
interface WatchlistItem { universeId: number; name: string; thumbnailUrl?: string | null; playing?: number | null; }

const GENRES = ["All","Adventure","RPG","Obby","Tycoon","Simulator","Fighting","Horror","Town and City"];
const SORTS  = [
  { label: "Active Players",    value: "Active" },
  { label: "Most Visited",      value: "AllTime" },
  { label: "Top Rated",         value: "TopRated" },
  { label: "Recently Updated",  value: "RecentlyUpdated" },
];

// ── Shared UI ─────────────────────────────────────────────────────────────────
function HubTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <Gamepad2 size={22} style={{ color: "var(--color-accent)" }} />
        <h1 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "22px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", margin: 0, textShadow: "0 0 20px rgba(var(--color-accent-rgb),0.5)" }}>{title}</h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", letterSpacing: "0.06em", margin: 0 }}>{sub}</p>
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
async function fetchGameDetails(universeId: number): Promise<GameDetail> {
  const [detRes, voteRes, thumbRes] = await Promise.all([
    fetch(`/api/proxy/games/details?universeId=${universeId}`),
    fetch(`/api/proxy/games/votes?universeId=${universeId}`),
    fetch(`/api/proxy/games/thumbnail?universeId=${universeId}`),
  ]);
  const [det, vote, thumb] = await Promise.all([detRes.json(), voteRes.json(), thumbRes.json()]);
  if (det.error) throw new Error(det.message);
  return {
    id: det.id, name: det.name,
    creatorName: det.creator?.name ?? "Unknown",
    playing: det.playing ?? 0, visits: det.visits ?? 0,
    upVotes: vote.upVotes ?? 0, downVotes: vote.downVotes ?? 0,
    thumbnailUrl: thumb.imageUrl ?? null,
    description: det.description ?? "", maxPlayers: det.maxPlayers ?? 0,
    favorites: det.favoritedCount ?? 0,
    created: det.created ?? "", updated: det.updated ?? "",
    genre: det.genre ?? "",
  };
}

// ── Feature 1: Game Search ────────────────────────────────────────────────────
function GameSearch({ onSelectGame }: { onSelectGame: (g: GameResult) => void }) {
  const [query,   setQuery]   = useState("");
  const [genre,   setGenre]   = useState("All");
  const [sort,    setSort]    = useState("Active");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [results, setResults] = useState<GameResult[] | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResults(null);
    try {
      const params = new URLSearchParams({ q: query.trim(), sort });
      if (genre !== "All") params.set("genre", genre);
      const res  = await fetch(`/api/proxy/games/search?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.message);

      const games: GameResult[] = data.data ?? [];
      // Fetch thumbnails + votes in parallel (best effort)
      const enriched = await Promise.all(games.map(async (g: { universeId?: number; id?: number; name: string; creator?: { name: string }; playing: number; visits: number }) => {
        const uid = g.universeId ?? g.id;
        try {
          const [tRes, vRes] = await Promise.all([
            fetch(`/api/proxy/games/thumbnail?universeId=${uid}`),
            fetch(`/api/proxy/games/votes?universeId=${uid}`),
          ]);
          const [t, v] = await Promise.all([tRes.json(), vRes.json()]);
          return {
            id: uid as number, name: g.name,
            creatorName: g.creator?.name ?? "Unknown",
            playing: g.playing ?? 0, visits: g.visits ?? 0,
            upVotes: v.upVotes ?? 0, downVotes: v.downVotes ?? 0,
            thumbnailUrl: t.imageUrl ?? null,
          };
        } catch {
          return {
            id: uid as number, name: g.name,
            creatorName: g.creator?.name ?? "Unknown",
            playing: g.playing ?? 0, visits: g.visits ?? 0,
            upVotes: 0, downVotes: 0, thumbnailUrl: null,
          };
        }
      }));
      setResults(enriched);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: 6,
    background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)",
    color: "var(--color-text-primary)", fontSize: "13px", cursor: "pointer", outline: "none",
  };

  return (
    <div className="rn-card mb-6">
      <SectionTitle title="Game Search" />
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search games by keyword…"
          style={{ flex: 1, minWidth: 180, padding: "10px 14px", borderRadius: 6, background: "var(--color-elevated)", border: "1px solid rgba(var(--color-accent-rgb),0.3)", color: "var(--color-text-primary)", fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "14px", outline: "none" }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--color-accent)"; (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(var(--color-accent-rgb),0.15)"; }}
          onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} style={selectStyle}>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={handleSearch} disabled={loading} className="rn-btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
          <Search size={14} /> Search
        </button>
      </div>
      {loading && <LoadingBar estimatedSeconds={2} />}
      {error   && <ErrorCard message={error} onRetry={handleSearch} />}
      {results !== null && !loading && results.length === 0 && <EmptyState icon={Search} title="No games found" desc="Try a different keyword or genre." />}
      {results !== null && !loading && results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {results.map((g) => (
            <GameCard key={g.id} {...g} universeId={g.id} onClick={() => onSelectGame(g)} />
          ))}
        </div>
      )}
      {results === null && !loading && !error && <EmptyState icon={Gamepad2} title="Discover Roblox games" desc="Search by keyword, filter by genre and sort." />}
    </div>
  );
}

// ── Feature 2: Game Detail Inspector ─────────────────────────────────────────
function GameDetailPanel({ universeId, onClose }: { universeId: number; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [game,    setGame]    = useState<GameDetail | null>(null);
  const [descOpen, setDescOpen] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try { setGame(await fetchGameDetails(universeId)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [universeId]);

  function formatCount(n: number) {
    if (n >= 1e9) return (n/1e9).toFixed(1)+"B";
    if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
    if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
    return n.toString();
  }

  const totalVotes  = (game?.upVotes ?? 0) + (game?.downVotes ?? 0);
  const likeRatio   = totalVotes > 0 ? (game?.upVotes ?? 0) / totalVotes : 0;
  const likePercent = Math.round(likeRatio * 100);
  const ratioColor  = likeRatio >= 0.8 ? "#22c55e" : likeRatio >= 0.5 ? "#eab308" : "#ef4444";

  return (
    <div className="rn-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle title="Game Details" />
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={16} /></button>
      </div>
      {loading && <LoadingBar estimatedSeconds={2} />}
      {error   && <ErrorCard message={error} onRetry={load} />}
      {game && !loading && (
        <div>
          {/* Banner thumbnail */}
          {game.thumbnailUrl && (
            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", position: "relative", marginBottom: 16, border: "1px solid rgba(var(--color-accent-rgb),0.2)" }}>
              <Image src={game.thumbnailUrl} alt={game.name} fill sizes="100%" style={{ objectFit: "cover" }} />
            </div>
          )}
          {/* Name + creator */}
          <h3 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>{game.name}</h3>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: 16 }}>by {game.creatorName}</p>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Playing",    value: formatCount(game.playing) },
              { label: "Visits",     value: formatCount(game.visits) },
              { label: "Favorites",  value: formatCount(game.favorites) },
              { label: "Max Players",value: game.maxPlayers.toString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(var(--color-accent-rgb),0.04)", border: "1px solid rgba(var(--color-accent-rgb),0.1)", borderRadius: 6, padding: "10px 12px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "18px", fontWeight: 700, color: "var(--color-accent)", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
          {/* Like ratio */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Like ratio</span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "11px", color: ratioColor }}>{likePercent}% · {formatCount(game.upVotes)} 👍 / {formatCount(game.downVotes)} 👎</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(var(--color-accent-rgb),0.1)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${likePercent}%`, background: ratioColor, boxShadow: `0 0 8px ${ratioColor}`, borderRadius: 4, transition: "width 800ms ease" }} />
            </div>
          </div>
          {/* Meta */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            {game.genre   && <span>Genre: <span style={{ color: "var(--color-text-secondary)" }}>{game.genre}</span></span>}
            {game.created && <span>Created: <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color: "var(--color-accent)" }}>{new Date(game.created).toLocaleDateString()}</span></span>}
            {game.updated && <span>Updated: <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color: "var(--color-accent)" }}>{new Date(game.updated).toLocaleDateString()}</span></span>}
          </div>
          {/* Description */}
          {game.description && (
            <div className="mb-4">
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: descOpen ? "unset" : 4, overflow: descOpen ? "visible" : "hidden" }}>{game.description}</p>
              <button onClick={() => setDescOpen(!descOpen)} style={{ fontSize: "11px", color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}>
                {descOpen ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> More</>}
              </button>
            </div>
          )}
          <a href={`https://www.roblox.com/games/${game.id}`} target="_blank" rel="noopener noreferrer" className="rn-btn-primary flex items-center justify-center gap-2" style={{ textDecoration: "none", fontSize: "11px" }}>
            <ExternalLink size={13} /> Open in Roblox
          </a>
        </div>
      )}
    </div>
  );
}

// ── Feature 3: Watchlist ──────────────────────────────────────────────────────
function GameWatchlist({ onSelectGame }: { onSelectGame: (id: number) => void }) {
  const [items,   setItems]   = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("rn_watchlist");
    if (raw) {
      try { setItems(JSON.parse(raw)); } catch { setItems([]); }
    }
    // Refresh live player counts
    const saved: WatchlistItem[] = raw ? JSON.parse(raw) : [];
    if (saved.length === 0) return;
    setLoading(true);
    Promise.all(saved.map(async (item) => {
      try {
        const res  = await fetch(`/api/proxy/games/details?universeId=${item.universeId}`);
        const data = await res.json();
        return { ...item, playing: data.playing ?? null };
      } catch { return { ...item, playing: null }; }
    })).then((enriched) => {
      const sorted = enriched.sort((a, b) => (b.playing ?? -1) - (a.playing ?? -1));
      setItems(sorted);
      localStorage.setItem("rn_watchlist", JSON.stringify(sorted));
    }).finally(() => setLoading(false));
  }, []);

  function removeItem(universeId: number) {
    const next = items.filter((i) => i.universeId !== universeId);
    setItems(next);
    localStorage.setItem("rn_watchlist", JSON.stringify(next));
  }

  return (
    <div className="rn-card">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle title="Game Watchlist" />
        <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "12px", color: "var(--color-accent)" }}>{items.length} watched</span>
      </div>
      {loading && <LoadingBar estimatedSeconds={1} label="Refreshing player counts…" />}
      {items.length === 0 && !loading && <EmptyState icon={Star} title="Watchlist empty" desc='Click "Watch" on any game card to add it here.' />}
      <div className="flex flex-col gap-2 mt-2">
        {items.map((item) => (
          <div key={item.universeId} className="flex items-center gap-3 p-3 rounded-md" style={{ background: "rgba(var(--color-accent-rgb),0.03)", border: "1px solid rgba(var(--color-accent-rgb),0.1)", cursor: "pointer" }} onClick={() => onSelectGame(item.universeId)}>
            {item.thumbnailUrl && (
              <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", position: "relative", border: "1px solid rgba(var(--color-accent-rgb),0.2)", flexShrink: 0 }}>
                <Image src={item.thumbnailUrl} alt={item.name} fill sizes="40px" style={{ objectFit: "cover" }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "12px", color: "var(--color-text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
              {item.playing !== undefined && (
                <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "11px", color: "var(--color-accent)", margin: 0 }}>
                  {item.playing !== null ? `${item.playing.toLocaleString()} playing` : "—"}
                </p>
              )}
            </div>
            <button onClick={(e) => { e.stopPropagation(); removeItem(item.universeId); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, flexShrink: 0 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GameScoutPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function handleSelectGame(g: GameResult | number) {
    setSelectedId(typeof g === "number" ? g : g.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="hub-enter p-6 max-w-5xl mx-auto">
      <HubTitle title="Game Scout" sub="Search, inspect, and watch Roblox games in real time." />
      {selectedId !== null && <GameDetailPanel universeId={selectedId} onClose={() => setSelectedId(null)} />}
      <GameSearch onSelectGame={handleSelectGame} />
      <GameWatchlist onSelectGame={handleSelectGame} />
    </div>
  );
}
