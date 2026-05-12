"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Search, Star, Bookmark, BookmarkCheck, ExternalLink,
  Users, Eye, Heart, ChevronDown, ChevronUp, AlertTriangle, X
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GameResult {
  id: number; // universeId
  name: string;
  creator: { name: string; type: string };
  playing: number;
  visits: number;
  favoritedCount: number;
  likes?: number;
  dislikes?: number;
  maxPlayers?: number;
  description?: string;
  genre?: string;
  created?: string;
  updated?: string;
  thumbnailUrl?: string;
  allowedGearTypes?: string[];
}

interface WatchlistEntry {
  universeId: number;
  name: string;
  thumbnailUrl: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GENRES = ["All", "Adventure", "RPG", "Obby", "Tycoon", "Simulator", "Fighting", "Horror", "Town and City"];
const SORTS = [
  { label: "Active Players", value: "Active" },
  { label: "Most Visited", value: "Visits" },
  { label: "Top Rated", value: "Favorited" },
  { label: "Recently Updated", value: "Updated" },
];
const LS_KEY = "rn_watchlist";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function likeRatio(likes = 0, dislikes = 0) {
  const total = likes + dislikes;
  return total === 0 ? 0 : Math.round((likes / total) * 100);
}

function loadWatchlist(): WatchlistEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch { return []; }
}

function saveWatchlist(list: WatchlistEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// ── API ───────────────────────────────────────────────────────────────────────

async function searchGames(keyword: string, genre: string, sort: string): Promise<GameResult[]> {
  const params = new URLSearchParams({ keyword, sortBy: sort });
  if (genre !== "All") params.set("genre", genre);
  const res = await fetch(`/api/roblox/games/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  const games: GameResult[] = data.data ?? [];

  // Fetch thumbnails
  if (games.length > 0) {
    const ids = games.map((g) => g.id).join(",");
    try {
      const tRes = await fetch(
        `/api/roblox/thumbnails/games?universeIds=${ids}&size=768x432&format=Png`
      );
      if (tRes.ok) {
        const tData = await tRes.json();
        const map: Record<number, string> = {};
        (tData.data ?? []).forEach((t: { universeId: number; imageUrl: string }) => {
          map[t.universeId] = t.imageUrl;
        });
        games.forEach((g) => { g.thumbnailUrl = map[g.id] ?? null; });
      }
    } catch { /* non-fatal */ }
  }

  return games;
}

async function fetchGameDetail(universeId: number): Promise<GameResult> {
  const res = await fetch(`/api/roblox/games/${universeId}`);
  if (!res.ok) throw new Error("Game not found");
  const data = await res.json();
  const game = data.data?.[0] ?? data;

  // Thumbnail
  try {
    const tRes = await fetch(
      `/api/roblox/thumbnails/games?universeIds=${universeId}&size=768x432&format=Png`
    );
    if (tRes.ok) {
      const tData = await tRes.json();
      game.thumbnailUrl = tData.data?.[0]?.imageUrl ?? null;
    }
  } catch { /* non-fatal */ }

  // Votes
  try {
    const vRes = await fetch(`/api/roblox/games/${universeId}/votes`);
    if (vRes.ok) {
      const vData = await vRes.json();
      game.likes = vData.data?.[0]?.upVotes ?? 0;
      game.dislikes = vData.data?.[0]?.downVotes ?? 0;
    }
  } catch { /* non-fatal */ }

  return game;
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

function LikeBar({ likes = 0, dislikes = 0 }: { likes?: number; dislikes?: number }) {
  const ratio = likeRatio(likes, dislikes);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/40">
        <span className="flex items-center gap-1"><Heart size={10} className="text-green-400" />{fmtNum(likes)}</span>
        <span>{ratio}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-green-500" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}

function GameCard({
  game,
  onSelect,
  watchlist,
  onToggleWatch,
}: {
  game: GameResult;
  onSelect: (g: GameResult) => void;
  watchlist: WatchlistEntry[];
  onToggleWatch: (g: GameResult) => void;
}) {
  const watched = watchlist.some((w) => w.universeId === game.id);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-indigo-500/50 transition-colors">
      <button onClick={() => onSelect(game)} className="w-full text-left">
        {game.thumbnailUrl ? (
          <Image src={game.thumbnailUrl} alt={game.name} width={768} height={432} className="w-full aspect-video object-cover" />
        ) : (
          <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
            <Eye size={32} className="text-white/20" />
          </div>
        )}
        <div className="p-3 space-y-2">
          <p className="font-semibold text-sm text-white line-clamp-1">{game.name}</p>
          <p className="text-xs text-white/40">{game.creator.name}</p>
          <div className="flex gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1"><Users size={10} />{fmtNum(game.playing)}</span>
            <span className="flex items-center gap-1"><Eye size={10} />{fmtNum(game.visits)}</span>
          </div>
          <LikeBar likes={game.likes} dislikes={game.dislikes} />
        </div>
      </button>
      <div className="px-3 pb-3">
        <button
          onClick={() => onToggleWatch(game)}
          className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
            watched
              ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
              : "bg-white/5 text-white/50 hover:text-white border border-white/10"
          }`}
        >
          {watched ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          {watched ? "Watching" : "Watch"}
        </button>
      </div>
    </div>
  );
}

function GameDetailPanel({
  game,
  onClose,
  watchlist,
  onToggleWatch,
}: {
  game: GameResult;
  onClose: () => void;
  watchlist: WatchlistEntry[];
  onToggleWatch: (g: GameResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const watched = watchlist.some((w) => w.universeId === game.id);
  const ratio = likeRatio(game.likes, game.dislikes);

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-white/5 overflow-hidden">
      {/* Banner */}
      {game.thumbnailUrl ? (
        <Image src={game.thumbnailUrl} alt={game.name} width={768} height={432} className="w-full aspect-video object-cover" />
      ) : (
        <div className="w-full aspect-video bg-white/5" />
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-white text-lg leading-tight">{game.name}</h2>
            <p className="text-sm text-white/50">by {game.creator.name}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ["Active", fmtNum(game.playing)],
            ["Visits", fmtNum(game.visits)],
            ["Favorites", fmtNum(game.favoritedCount)],
            ["Max Players", game.maxPlayers ?? "—"],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-base font-bold text-white">{val}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          ))}
        </div>

        {/* Like bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/40">
            <span>👍 {fmtNum(game.likes ?? 0)}</span>
            <span>{ratio}% positive</span>
            <span>👎 {fmtNum(game.dislikes ?? 0)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${ratio}%` }} />
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
          {[
            ["Genre", game.genre ?? "—"],
            ["Created", fmtDate(game.created)],
            ["Updated", fmtDate(game.updated)],
          ].map(([k, v]) => (
            <div key={k}><span className="text-white/30">{k}: </span>{v}</div>
          ))}
        </div>

        {/* Description */}
        {game.description && (
          <div>
            <p className={`text-sm text-white/60 whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}>
              {game.description}
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

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={`https://www.roblox.com/games/${game.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <ExternalLink size={13} /> Open in Roblox
          </a>
          <button
            onClick={() => onToggleWatch(game)}
            className={`px-4 rounded-xl border text-sm font-medium transition-colors ${
              watched
                ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                : "border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {watched ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Game Search ──────────────────────────────────────────────────────────

function GameSearchTab({
  watchlist,
  onToggleWatch,
}: {
  watchlist: WatchlistEntry[];
  onToggleWatch: (g: GameResult) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<GameResult[]>([]);
  const [selected, setSelected] = useState<GameResult | null>(null);

  async function handleSearch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const results = await searchGames(keyword, genre, sort);
      setGames(results);
      if (results.length === 0) toast("No games found.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Search failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectCard(g: GameResult) {
    // fetch full detail
    try {
      const detail = await fetchGameDetail(g.id);
      setSelected(detail);
    } catch { setSelected(g); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search games…"
          className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          <Search size={16} className="text-white" />
        </button>
      </div>

      {error && <ErrorCard message={error} onRetry={handleSearch} />}

      {selected && (
        <GameDetailPanel
          game={selected}
          onClose={() => setSelected(null)}
          watchlist={watchlist}
          onToggleWatch={onToggleWatch}
        />
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 overflow-hidden">
              <Skeleton className="w-full aspect-video" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && games.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {games.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              onSelect={handleSelectCard}
              watchlist={watchlist}
              onToggleWatch={onToggleWatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Game Watchlist ───────────────────────────────────────────────────────

function WatchlistTab({
  watchlist,
  onRemove,
}: {
  watchlist: WatchlistEntry[];
  onRemove: (id: number) => void;
}) {
  const [liveData, setLiveData] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (watchlist.length === 0) return;
    setLoading(true);
    const ids = watchlist.map((w) => w.universeId).join(",");
    fetch(`/api/roblox/games/live?universeIds=${ids}`)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<number, number> = {};
        (d.data ?? []).forEach((g: { id: number; playing: number }) => {
          map[g.id] = g.playing;
        });
        setLiveData(map);
      })
      .catch(() => toast.error("Failed to fetch live player counts"))
      .finally(() => setLoading(false));
  }, [watchlist]);

  const sorted = [...watchlist].sort(
    (a, b) => (liveData[b.universeId] ?? 0) - (liveData[a.universeId] ?? 0)
  );

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <Bookmark size={32} className="mx-auto mb-2" />
        <p className="text-sm">No games in watchlist. Watch a game from Search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">{watchlist.length} game{watchlist.length !== 1 ? "s" : ""} watched · sorted by live players</p>
      {sorted.map((entry) => (
        <div key={entry.universeId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          {entry.thumbnailUrl ? (
            <Image src={entry.thumbnailUrl} alt={entry.name} width={64} height={36} className="rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-16 h-9 rounded-lg bg-white/10 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{entry.name}</p>
            <p className="text-xs text-white/40">
              {loading ? "Loading…" : (
                liveData[entry.universeId] !== undefined
                  ? `${fmtNum(liveData[entry.universeId])} playing`
                  : "Unavailable"
              )}
            </p>
          </div>
          <button
            onClick={() => onRemove(entry.universeId)}
            className="text-white/30 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "search", label: "Search", icon: Search },
  { id: "watchlist", label: "Watchlist", icon: Bookmark },
];

export default function GameScoutPage() {
  const [tab, setTab] = useState("search");
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);

  useEffect(() => { setWatchlist(loadWatchlist()); }, []);

  function toggleWatch(game: GameResult) {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.universeId === game.id);
      const next = exists
        ? prev.filter((w) => w.universeId !== game.id)
        : [...prev, { universeId: game.id, name: game.name, thumbnailUrl: game.thumbnailUrl ?? null }];
      saveWatchlist(next);
      toast.success(exists ? "Removed from watchlist" : "Added to watchlist");
      return next;
    });
  }

  function removeFromWatchlist(universeId: number) {
    setWatchlist((prev) => {
      const next = prev.filter((w) => w.universeId !== universeId);
      saveWatchlist(next);
      toast.success("Removed from watchlist");
      return next;
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Game Scout</h1>
        <p className="text-sm text-white/40">Discover, inspect, and track Roblox games.</p>
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
            <Icon size={13} />
            {label}
            {id === "watchlist" && watchlist.length > 0 && (
              <span className="ml-1 bg-indigo-500/30 text-indigo-300 text-xs rounded-full px-1.5">
                {watchlist.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "search" && <GameSearchTab watchlist={watchlist} onToggleWatch={toggleWatch} />}
      {tab === "watchlist" && <WatchlistTab watchlist={watchlist} onRemove={removeFromWatchlist} />}
    </div>
  );
}
