"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import {
  Activity, RefreshCw, Trash2, ToggleLeft, ToggleRight, Clock
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PingResult {
  endpoint: string;
  ms: number | null;
  ok: boolean;
  statusCode: number | null;
  checkedAt: string;
}

interface PingLog {
  [endpoint: string]: PingResult[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ENDPOINTS = [
  "catalog", "users", "thumbnails", "groups",
  "games", "economy", "presence", "badges",
];

const LS_LOG_KEY = "rn_ping_log";
const LS_AUTO_KEY = "rn_auto_refresh";
const AUTO_INTERVAL = 60; // seconds

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(result: PingResult) {
  if (!result.ok || result.ms === null) return "bg-red-500";
  if (result.ms < 200) return "bg-green-500";
  if (result.ms < 500) return "bg-yellow-500";
  return "bg-red-500";
}

function rowColor(ms: number | null, ok: boolean) {
  if (!ok || ms === null) return "text-red-400";
  if (ms < 200) return "text-green-400";
  if (ms < 500) return "text-yellow-400";
  return "text-red-400";
}

function loadLog(): PingLog {
  try { return JSON.parse(localStorage.getItem(LS_LOG_KEY) ?? "{}"); } catch { return {}; }
}

function saveLog(log: PingLog) {
  localStorage.setItem(LS_LOG_KEY, JSON.stringify(log));
}

function loadAutoRefresh(): boolean {
  try { return JSON.parse(localStorage.getItem(LS_AUTO_KEY) ?? "false"); } catch { return false; }
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── API ───────────────────────────────────────────────────────────────────────

async function pingEndpoint(endpoint: string): Promise<PingResult> {
  const start = performance.now();
  try {
    const res = await fetch(`/api/ping/${endpoint}`);
    const ms = Math.round(performance.now() - start);
    const data = res.ok ? await res.json() : {};
    return {
      endpoint,
      ms: data.ms ?? ms,
      ok: data.ok ?? res.ok,
      statusCode: data.statusCode ?? res.status,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      endpoint,
      ms: null,
      ok: false,
      statusCode: null,
      checkedAt: new Date().toISOString(),
    };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ result }: { result: PingResult | undefined }) {
  if (!result) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-white/20" />;
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor(result)}`} />;
}

// ── Ping Matrix ───────────────────────────────────────────────────────────────

function PingMatrix({
  latest,
  pinging,
  onPingAll,
  onPingSingle,
}: {
  latest: Record<string, PingResult>;
  pinging: Set<string>;
  onPingAll: () => void;
  onPingSingle: (ep: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Live API Ping Matrix</p>
        <button
          onClick={onPingAll}
          disabled={pinging.size > 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
        >
          <RefreshCw size={12} className={pinging.size > 0 ? "animate-spin" : ""} />
          Ping All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ENDPOINTS.map((ep) => {
          const r = latest[ep];
          const loading = pinging.has(ep);
          return (
            <div key={ep} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
              <StatusDot result={r} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white capitalize">{ep}</p>
                {r ? (
                  <p className="text-xs text-white/40">
                    {r.ok && r.ms !== null ? `${r.ms}ms` : "Unreachable"} · HTTP {r.statusCode ?? "—"} · {fmtTime(r.checkedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-white/30">Not pinged yet</p>
                )}
              </div>
              <button
                onClick={() => onPingSingle(ep)}
                disabled={loading}
                className="text-white/30 hover:text-white disabled:opacity-30 transition-colors"
                title="Retry"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── History Log ───────────────────────────────────────────────────────────────

function HistoryLog({ log, onClear }: { log: PingLog; onClear: () => void }) {
  // Flatten + sort by time
  const rows = Object.values(log)
    .flat()
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
    .slice(0, 200);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Ping History</p>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 size={12} /> Clear Log
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-6">No ping history yet. Run Ping All to start.</p>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-900/90 backdrop-blur border-b border-white/10">
                <tr>
                  {["Endpoint", "Latency", "Status", "HTTP", "Time"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-white/40 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2 text-white capitalize">{r.endpoint}</td>
                    <td className={`px-3 py-2 font-mono font-semibold ${rowColor(r.ms, r.ok)}`}>
                      {r.ok && r.ms !== null ? `${r.ms}ms` : "Unreachable"}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${r.ok ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {r.ok ? "OK" : "FAIL"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-white/50 font-mono">{r.statusCode ?? "—"}</td>
                    <td className="px-3 py-2 text-white/40">{fmtTime(r.checkedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Auto Refresh Toggle ───────────────────────────────────────────────────────

function AutoRefreshPanel({
  enabled,
  countdown,
  onToggle,
}: {
  enabled: boolean;
  countdown: number;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">Auto-Refresh</p>
        <p className="text-xs text-white/40">
          {enabled
            ? `Pinging all endpoints every ${AUTO_INTERVAL}s · next in ${countdown}s`
            : `Auto-refresh is off. Toggle to ping every ${AUTO_INTERVAL}s.`}
        </p>
      </div>
      <button onClick={onToggle} className="transition-colors">
        {enabled ? (
          <ToggleRight size={32} className="text-indigo-400" />
        ) : (
          <ToggleLeft size={32} className="text-white/30" />
        )}
      </button>
      {enabled && (
        <div className="flex items-center gap-1 text-xs text-indigo-400">
          <Clock size={12} />
          <span className="font-mono w-6 text-right">{countdown}s</span>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApiHealthPage() {
  const [latest, setLatest] = useState<Record<string, PingResult>>({});
  const [pinging, setPinging] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<PingLog>({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_INTERVAL);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted state
  useEffect(() => {
    setLog(loadLog());
    setAutoRefresh(loadAutoRefresh());
  }, []);

  function addToLog(result: PingResult) {
    setLog((prev) => {
      const ep = result.endpoint;
      const existing = prev[ep] ?? [];
      const updated = [result, ...existing].slice(0, 20);
      const next = { ...prev, [ep]: updated };
      saveLog(next);
      return next;
    });
  }

  const pingOne = useCallback(async (ep: string) => {
    setPinging((p) => new Set(p).add(ep));
    try {
      const result = await pingEndpoint(ep);
      setLatest((prev) => ({ ...prev, [ep]: result }));
      addToLog(result);
    } catch {
      toast.error(`Ping failed for ${ep}`);
    } finally {
      setPinging((p) => {
        const next = new Set(p);
        next.delete(ep);
        return next;
      });
    }
  }, []);

  const pingAll = useCallback(async () => {
    await Promise.all(ENDPOINTS.map(pingOne));
  }, [pingOne]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      setCountdown(AUTO_INTERVAL);

      intervalRef.current = setInterval(() => {
        if (!document.hidden) pingAll();
        setCountdown(AUTO_INTERVAL);
      }, AUTO_INTERVAL * 1000);

      countdownRef.current = setInterval(() => {
        setCountdown((c) => (c <= 1 ? AUTO_INTERVAL : c - 1));
      }, 1000);

      // Pause when tab hidden
      const handleVisibility = () => {
        if (document.hidden) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
        } else {
          intervalRef.current = setInterval(() => {
            pingAll();
            setCountdown(AUTO_INTERVAL);
          }, AUTO_INTERVAL * 1000);
          countdownRef.current = setInterval(() => {
            setCountdown((c) => (c <= 1 ? AUTO_INTERVAL : c - 1));
          }, 1000);
        }
      };

      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [autoRefresh, pingAll]);

  function toggleAutoRefresh() {
    const next = !autoRefresh;
    setAutoRefresh(next);
    localStorage.setItem(LS_AUTO_KEY, JSON.stringify(next));
    if (next) toast.success("Auto-refresh enabled");
    else toast("Auto-refresh disabled");
  }

  function clearLog() {
    setLog({});
    localStorage.removeItem(LS_LOG_KEY);
    toast.success("Log cleared");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity size={22} className="text-indigo-400" />
          API Health Monitor
        </h1>
        <p className="text-sm text-white/40">Real-time latency and status for Roblox API endpoints.</p>
      </div>

      <AutoRefreshPanel
        enabled={autoRefresh}
        countdown={countdown}
        onToggle={toggleAutoRefresh}
      />

      <PingMatrix
        latest={latest}
        pinging={pinging}
        onPingAll={pingAll}
        onPingSingle={pingOne}
      />

      <HistoryLog log={log} onClear={clearLog} />
    </div>
  );
}
