// src/components/DisconnectModal.tsx
// Full-screen overlay modal for disconnecting all accounts and clearing all data.
// On confirm: signs out Google + Roblox, clears localStorage, redirects to /.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AlertTriangle, X, LogOut } from "lucide-react";

const LS_KEYS = [
  "rn_theme", "rn_toggles", "rn_watchlist", "rn_bookmarks",
  "rn_ping_log", "rn_auto_refresh", "rn_signed_in",
];

interface DisconnectModalProps {
  isOpen:   boolean;
  onClose:  () => void;
}

export default function DisconnectModal({ isOpen, onClose }: DisconnectModalProps) {
  const router                = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleDisconnect() {
    setLoading(true);
    setError(null);
    try {
      // 1. Sign out Roblox session (clears httpOnly cookie server-side)
      await fetch("/api/auth/roblox/signout", { method: "POST" });

      // 2. Clear localStorage
      LS_KEYS.forEach((k) => localStorage.removeItem(k));

      // 3. Sign out Google via NextAuth (redirects internally)
      await signOut({ redirect: false });

      // 4. Navigate to landing
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign-out failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "modal-fade-in 200ms ease forwards",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>

      {/* Modal panel */}
      <div
        style={{
          width: "100%", maxWidth: 420,
          background: "var(--color-elevated)",
          border: "1px solid rgba(239,68,68,0.35)",
          borderRadius: "12px",
          padding: "32px 28px",
          boxShadow: "0 0 40px rgba(239,68,68,0.15), 0 0 80px rgba(239,68,68,0.06)",
          animation: "modal-slide-up 220ms ease forwards",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(var(--color-accent-rgb),0.08)",
            border: "1px solid rgba(var(--color-accent-rgb),0.2)",
            color: "var(--color-text-muted)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(var(--color-accent-rgb),0.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(var(--color-accent-rgb),0.08)")}
        >
          <X size={14} />
        </button>

        {/* Warning icon */}
        <div style={{
          width: 52, height: 52, borderRadius: "12px",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 0 16px rgba(239,68,68,0.2)",
          animation: "error-icon-breathe 2.5s ease-in-out infinite",
        }}>
          <style>{`
            @keyframes error-icon-breathe {
              0%,100% { box-shadow: 0 0 16px rgba(239,68,68,0.2); }
              50%      { box-shadow: 0 0 28px rgba(239,68,68,0.45); }
            }
          `}</style>
          <AlertTriangle size={24} color="#EF4444" />
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
          fontSize: "16px", fontWeight: 700,
          color: "#EF4444",
          letterSpacing: "0.06em", textTransform: "uppercase",
          margin: 0, marginBottom: 10,
        }}>
          Disconnect All Accounts
        </h2>

        {/* Body text */}
        <p style={{
          fontSize: "13px",
          color: "var(--color-text-secondary)",
          lineHeight: 1.7,
          margin: 0, marginBottom: 8,
        }}>
          This will sign you out of both your <strong style={{ color: "var(--color-text-primary)" }}>Google</strong> and{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>Roblox</strong> accounts and clear all locally stored data including:
        </p>
        <ul style={{ margin: "0 0 20px 0", paddingLeft: 18, fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 2 }}>
          <li>Theme preferences</li>
          <li>Performance toggles</li>
          <li>Watchlist &amp; bookmarks</li>
          <li>Ping history &amp; cached data</li>
        </ul>

        {/* Error */}
        {error && (
          <p style={{
            fontSize: "12px", color: "#EF4444",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 6, padding: "8px 12px",
            marginBottom: 16, margin: "0 0 16px 0",
          }}>
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {/* Cancel */}
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: "11px 16px",
              borderRadius: 6,
              border: "1px solid rgba(var(--color-accent-rgb),0.3)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
              fontSize: "10px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.6)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--color-accent-rgb),0.3)"; }}
          >
            Cancel
          </button>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            disabled={loading}
            style={{
              flex: 1, padding: "11px 16px",
              borderRadius: 6,
              border: "1px solid rgba(239,68,68,0.5)",
              background: loading ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.1)",
              color: "#EF4444",
              fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
              fontSize: "10px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 200ms ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
            onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(239,68,68,0.25)"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            <LogOut size={13} />
            {loading ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      </div>
    </div>
  );
}
