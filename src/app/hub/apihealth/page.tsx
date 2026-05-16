"use client";
// src/app/hub/apihealth/page.tsx
// HUB 6 — API HEALTH MONITOR
// Features: Live Ping Matrix · Ping History Log · Auto-Refresh Toggle

import { useState, useEffect, useRef, useCallback } from "react";
import { Activity, RefreshCw, Trash2, Clock, Wifi, WifiOff } from "lucide-react";
import LoadingBar from "@/components/LoadingBar";
import ErrorCard  from "@/components/ErrorCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PingResult {
  endpoint:   string;
  ms:         number | null;
  ok:         boolean;
  statusCode: number | null;
  checkedAt:  string;
}

const ENDPOINTS = ["users","thumbnails","groups","games","economy","presence","badges","catalog"];

// ── Shared UI ─────────────────────────────────────────────────────────────────
function HubTitle() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <Activity size={22} style={{ color: "var(--color-accent)" }} />
        <h1 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "22px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", margin: 0, textShadow: "0 0 20px rgba(var(--color-accent-rgb),0.5)" }}>
          API Health Monitor
        </h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", letterSpacing: "0.06em", margin: 0 }}>
        Real-time latency checks across all Roblox API endpoints.
      </p>
      <div style={{ height: 1, background: "rgba(var(--color-accent-rgb),0.2)", marginTop: 16 }} />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 16 }}>
      {title}
    </h2>
  );
}

// Latency color: green < 200ms · yellow 200–499ms · red 500ms+ or error
function latencyColor(ms: number | null, ok: boolean): string {
  if (!ok || ms === null) return "#ef4444";
  if (ms < 200)  return "#22c55e";
  if (ms < 500)  return "#eab308";
  return "#ef4444";
}

function StatusDot({ ms, ok }: { ms: number | null; ok: boolean }) {
  const color = latencyColor(ms, ok);
  return (
    <span style={{
      width: 10, height: 10, borderRadius: "50%",
      background: color,
      boxShadow: `0 0 6px ${color}`,
      display: "inline-block", flexShrink: 0,
      animation: ok && ms !== null && ms < 200 ? "presence-pulse 2s ease-in-out infinite" : "none",
    }} />
  );
}

// ── Feature 1: Live Ping Matrix ───────────────────────────────────────────────
function PingMatrix() {
  const [results,  setResults]  = useState<Record<string, PingResult>>({});
  const [pinging,  setPinging]  = useState<Record<string, boolean>>({});
  const [pingAll,  setPingAll]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  async function pingEndpoint(endpoint: string) {
    setPinging((p) => ({ ...p, [endpoint]: true }));
    setErrors((e) => { const n = { ...e }; delete n[endpoint]; return n; });
    try {
      const res  = await fetch(`/api/proxy/ping?endpoint=${endpoint}`);
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      const result: PingResult = data;
      setResults((r) => ({ ...r, [endpoint]: result }));
      // Append to history log
      const raw   = localStorage.getItem("rn_ping_log");
      const log: Record<string, PingResult[]> = raw ? JSON.parse(raw) : {};
      const prev  = log[endpoint] ?? [];
      log[endpoint] = [result, ...prev].slice(0, 20);
      localStorage.setItem("rn_ping_log", JSON.stringify(log));
    } catch (e: unknown) {
      setErrors((err) => ({ ...err, [endpoint]: e instanceof Error ? e.message : "Ping failed." }));
    } finally {
      setPinging((p) => ({ ...p, [endpoint]: false }));
    }
  }

  async function handlePingAll() {
    setPingAll(true);
    await Promise.all(ENDPOINTS.map((ep) => pingEndpoint(ep)));
    setPingAll(false);
  }

  return (
    <div className="rn-card mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <SectionTitle title="Live Ping Matrix" />
        <button
          onClick={handlePingAll}
          disabled={pingAll}
          className="rn-btn-primary"
          style={{ opacity: pingAll ? 0.6 : 1, fontSize: "11px" }}
        >
          <RefreshCw size={13} style={{ animation: pingAll ? "spin 1s linear infinite" : "none" }} />
          Ping All
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {ENDPOINTS.map((ep) => {
          const r    = results[ep];
          const busy = pinging[ep];
          const err  = errors[ep];
          const color = r ? latencyColor(r.ms, r.ok) : "var(--color-text-muted)";

          return (
            <div key={ep}>
              <div
                className="flex items-center gap-3 p-3 rounded-md"
                style={{ background: "rgba(var(--color-accent-rgb),0.03)", border: "1px solid rgba(var(--color-accent-rgb),0.08)", transition: "all 200ms ease" }}
              >
                {/* Status dot */}
                <div style={{ flexShrink: 0, width: 10 }}>
                  {r && !busy ? <StatusDot ms={r.ms} ok={r.ok} /> : (
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(var(--color-accent-rgb),0.2)", display: "inline-block" }} />
                  )}
                </div>

                {/* Endpoint name */}
                <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "13px", color: "var(--color-text-primary)", flex: 1, textTransform: "lowercase" }}>
                  {ep}.roblox.com
                </span>

                {/* Latency */}
                <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "14px", fontWeight: 700, color, width: 72, textAlign: "right", flexShrink: 0 }}>
                  {busy ? "…" : r ? (r.ms !== null ? `${r.ms}ms` : "Unreachable") : "—"}
                </span>

                {/* HTTP status */}
                <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "11px", color: "var(--color-text-muted)", width: 36, textAlign: "right", flexShrink: 0 }}>
                  {busy ? "" : r?.statusCode ?? ""}
                </span>

                {/* Last checked */}
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)", width: 80, textAlign: "right", flexShrink: 0, display: "none" }} className="md:inline">
                  {r ? new Date(r.checkedAt).toLocaleTimeString() : ""}
                </span>

                {/* Retry button */}
                <button
                  onClick={() => pingEndpoint(ep)}
                  disabled={busy}
                  style={{ background: "none", border: "1px solid rgba(var(--color-accent-rgb),0.2)", borderRadius: 4, cursor: busy ? "not-allowed" : "pointer", color: "var(--color-accent)", padding: "3px 8px", fontSize: "10px", flexShrink: 0, opacity: busy ? 0.5 : 1, letterSpacing: "0.06em", fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif" }}
                >
                  {busy ? "…" : "Ping"}
                </button>
              </div>

              {/* Loading bar per endpoint */}
              {busy && (
                <div className="mt-1 px-3">
                  <LoadingBar estimatedSeconds={1} label="" />
                </div>
              )}
              {err && !busy && (
                <div className="mt-1">
                  <ErrorCard message={err} onRetry={() => pingEndpoint(ep)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        {[{ color: "#22c55e", label: "< 200ms" }, { color: "#eab308", label: "200–499ms" }, { color: "#ef4444", label: "500ms+ / Error" }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", boxShadow: `0 0 4px ${color}` }} />
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature 2: Ping History Log ───────────────────────────────────────────────
function PingHistory() {
  const [log,    setLog]    = useState<{ endpoint: string; result: PingResult }[]>([]);
  const [cleared, setCleared] = useState(false);

  useEffect(() => { loadLog(); }, []);

  function loadLog() {
    const raw = localStorage.getItem("rn_ping_log");
    if (!raw) { setLog([]); return; }
    try {
      const data: Record<string, PingResult[]> = JSON.parse(raw);
      const flat: { endpoint: string; result: PingResult }[] = [];
      Object.entries(data).forEach(([ep, results]) => {
        results.forEach((r) => flat.push({ endpoint: ep, result: r }));
      });
      flat.sort((a, b) => new Date(b.result.checkedAt).getTime() - new Date(a.result.checkedAt).getTime());
      setLog(flat.slice(0, 100));
    } catch { setLog([]); }
  }

  function clearLog() {
    localStorage.removeItem("rn_ping_log");
    setLog([]);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }

  return (
    <div className="rn-card mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <SectionTitle title="Ping History" />
        <button onClick={clearLog} className="rn-btn-secondary" style={{ fontSize: "10px" }}>
          <Trash2 size={12} /> {cleared ? "Cleared!" : "Clear Log"}
        </button>
      </div>

      {log.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 24px" }}>
          <Clock size={40} style={{ color: "rgba(var(--color-accent-rgb),0.3)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No ping history yet. Run a ping to populate the log.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(var(--color-accent-rgb),0.15)" }}>
                {["Endpoint","Latency","Status","HTTP","Time"].map((h) => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600, fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map(({ endpoint, result }, i) => {
                const color = latencyColor(result.ms, result.ok);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(var(--color-accent-rgb),0.05)", background: i % 2 === 0 ? "rgba(var(--color-accent-rgb),0.01)" : "transparent" }}>
                    <td style={{ padding: "6px 10px", fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color: "var(--color-text-secondary)" }}>{endpoint}</td>
                    <td style={{ padding: "6px 10px", fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color, fontWeight: 700 }}>
                      {result.ms !== null ? `${result.ms}ms` : "Unreachable"}
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {result.ok
                          ? <Wifi size={11} style={{ color: "#22c55e" }} />
                          : <WifiOff size={11} style={{ color: "#ef4444" }} />}
                        <span style={{ fontSize: "10px", color: result.ok ? "#22c55e" : "#ef4444" }}>{result.ok ? "OK" : "Error"}</span>
                      </span>
                    </td>
                    <td style={{ padding: "6px 10px", fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color: "var(--color-text-muted)" }}>{result.statusCode ?? "—"}</td>
                    <td style={{ padding: "6px 10px", fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", color: "var(--color-text-muted)", fontSize: "10px" }}>
                      {new Date(result.checkedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Feature 3: Auto-Refresh Toggle ───────────────────────────────────────────
function AutoRefreshPanel() {
  const [on,        setOn]        = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [pinging,   setPinging]   = useState(false);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("rn_auto_refresh");
    if (saved === "true") setOn(true);
    return () => { clearAllTimers(); };
  }, []);

  function clearAllTimers() {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  const runPingAll = useCallback(async () => {
    setPinging(true);
    setCountdown(60);
    try {
      await fetch("/api/proxy/ping"); // pings all endpoints
    } finally {
      setPinging(false);
    }
  }, []);

  useEffect(() => {
    if (!on) { clearAllTimers(); return; }

    runPingAll();

    intervalRef.current = setInterval(() => {
      runPingAll();
      setCountdown(60);
    }, 60000);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 60));
    }, 1000);

    // Pause when tab hidden
    const handleVisibility = () => {
      if (document.hidden) { clearAllTimers(); }
      else { runPingAll(); }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearAllTimers();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [on, runPingAll]);

  function toggle() {
    const next = !on;
    setOn(next);
    localStorage.setItem("rn_auto_refresh", String(next));
    if (!next) { clearAllTimers(); setCountdown(60); }
  }

  return (
    <div className="rn-card">
      <SectionTitle title="Auto-Refresh" />
      <div className="flex items-center gap-4 flex-wrap">
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "14px", fontWeight: 600, color: on ? "var(--color-text-primary)" : "var(--color-text-secondary)", margin: 0, marginBottom: 2 }}>
            Auto-refresh every 60s
          </p>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            Automatically pings all endpoints while this hub is active. Pauses when tab is hidden.
          </p>
        </div>

        {/* Toggle */}
        <div
          onClick={toggle}
          style={{
            width: 48, height: 26, borderRadius: 999, cursor: "pointer", position: "relative", flexShrink: 0,
            background: on ? "var(--color-accent)" : "rgba(var(--color-accent-rgb),0.15)",
            boxShadow: on ? "0 0 14px rgba(var(--color-accent-rgb),0.5)" : "none",
            border: `1px solid ${on ? "var(--color-accent)" : "rgba(var(--color-accent-rgb),0.2)"}`,
            transition: "all 250ms ease",
          }}
        >
          <div style={{
            position: "absolute", top: 3,
            left: on ? "calc(100% - 20px - 3px)" : "3px",
            width: 18, height: 18, borderRadius: "50%",
            background: on ? "#fff" : "rgba(var(--color-accent-rgb),0.5)",
            transition: "left 250ms ease",
          }} />
        </div>
      </div>

      {/* Countdown + loading */}
      {on && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={13} style={{ color: "var(--color-text-muted)" }} />
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Next ping in</span>
            <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "18px", fontWeight: 700, color: "var(--color-accent)" }}>
              {countdown}s
            </span>
          </div>
          {pinging && <LoadingBar estimatedSeconds={1} label="Pinging all endpoints…" />}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApiHealthPage() {
  return (
    <div className="hub-enter p-6 max-w-4xl mx-auto">
      <HubTitle />
      <PingMatrix />
      <PingHistory />
      <AutoRefreshPanel />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes presence-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      `}</style>
    </div>
  );
}
