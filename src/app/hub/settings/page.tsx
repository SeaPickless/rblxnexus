"use client";
// src/app/hub/settings/page.tsx
// HUB 7 — RN SETTINGS
// Features: Theme Engine · Performance Mode · Account Management

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Settings, Zap, Palette, User,
  Monitor, Minimize2, RefreshCw, Hash, ImageOff, LogOut,
} from "lucide-react";
import ThemeCard       from "@/components/ThemeCard";
import ToggleRow       from "@/components/ToggleRow";
import DisconnectModal from "@/components/DisconnectModal";
import { THEMES }      from "@/lib/theme";
import { getToggles, DEFAULT_TOGGLES, type Toggles } from "@/lib/toggles";

// ── Shared UI ─────────────────────────────────────────────────────────────────
function HubTitle() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <Settings size={22} style={{ color: "var(--color-accent)" }} />
        <h1 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "22px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", margin: 0, textShadow: "0 0 20px rgba(var(--color-accent-rgb),0.5)" }}>
          RN Settings
        </h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", letterSpacing: "0.06em", margin: 0 }}>
        Customize your command center.
      </p>
      <div style={{ height: 1, background: "rgba(var(--color-accent-rgb),0.2)", marginTop: 16 }} />
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon size={16} style={{ color: "var(--color-accent)" }} />
      <h2 style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

// ── Feature 1: Theme Engine ───────────────────────────────────────────────────
function ThemeEngine() {
  return (
    <div className="rn-card mb-6">
      <SectionTitle icon={Palette} title="Theme Engine" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {THEMES.map((t) => (
          <ThemeCard
            key={t.key}
            themeKey={t.key}
            label={t.label}
            description={t.description}
            base={t.base}
            surface={t.surface}
            accent={t.accent}
          />
        ))}
      </div>
    </div>
  );
}

// ── Feature 2: Performance Mode ───────────────────────────────────────────────
const TOGGLE_DEFS: {
  key:   keyof Toggles;
  icon:  React.ElementType;
  name:  string;
  desc:  string;
}[] = [
  {
    key:  "disableAnimations",
    icon: Zap,
    name: "Disable Animations",
    desc: "Turns off all CSS animations and transitions for maximum performance.",
  },
  {
    key:  "compactSidebar",
    icon: Minimize2,
    name: "Compact Sidebar",
    desc: "Collapses the sidebar to icon-only mode. Labels appear as hover tooltips.",
  },
  {
    key:  "autoRefresh",
    icon: RefreshCw,
    name: "Auto Refresh",
    desc: "API Health Monitor auto-pings all endpoints every 60 seconds while active.",
  },
  {
    key:  "showUserIds",
    icon: Hash,
    name: "Show User IDs",
    desc: "Displays numeric Roblox user IDs alongside usernames throughout the app.",
  },
  {
    key:  "lowBandwidth",
    icon: ImageOff,
    name: "Low Bandwidth Mode",
    desc: "Skips loading avatar and thumbnail images. Shows initials-based placeholders.",
  },
];

function PerformanceMode() {
  const [toggles, setToggles] = useState<Toggles>(DEFAULT_TOGGLES);

  useEffect(() => {
    setToggles(getToggles());
  }, []);

  function handleChange(key: keyof Toggles, value: boolean) {
    setToggles((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="rn-card mb-6">
      <SectionTitle icon={Zap} title="Performance Mode" />
      <div className="flex flex-col gap-3">
        {TOGGLE_DEFS.map(({ key, icon, name, desc }) => (
          <ToggleRow
            key={key}
            icon={icon}
            name={name}
            description={desc}
            toggleKey={key}
            value={toggles[key] as boolean}
            onChange={handleChange}
          />
        ))}
      </div>
    </div>
  );
}

// ── Feature 3: Account Management ────────────────────────────────────────────
function AccountManagement() {
  const [roblox,  setRoblox]  = useState<{ robloxId: string; robloxUsername: string; robloxAvatar: string | null } | null>(null);
  const [google,  setGoogle]  = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      setLoading(true);
      try {
        // Roblox session
        const robloxRes  = await fetch("/api/auth/roblox/userinfo");
        const robloxData = await robloxRes.json();
        if (robloxData.connected) setRoblox(robloxData);

        // Google session via NextAuth
        const sessionRes  = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user) {
          setGoogle({ name: sessionData.user.name ?? "", email: sessionData.user.email ?? "" });
        }
      } catch {
        // Sessions may not exist — not an error
      } finally {
        setLoading(false);
      }
    }
    loadAccounts();
  }, []);

  function AccountRow({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 8, background: "rgba(var(--color-accent-rgb),0.03)", border: "1px solid rgba(var(--color-accent-rgb),0.1)", marginBottom: 10 }}>
        {children}
      </div>
    );
  }

  function ConnectedDot() {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#22c55e" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e", display: "inline-block" }} />
        Connected
      </span>
    );
  }

  return (
    <div className="rn-card">
      <SectionTitle icon={User} title="Account Management" />

      {loading ? (
        <div style={{ padding: "16px 0" }}>
          {[1,2].map((i) => (
            <div key={i} style={{ height: 64, borderRadius: 8, marginBottom: 10, background: "rgba(var(--color-accent-rgb),0.06)", animation: "skeleton-pulse 1.6s ease-in-out infinite" }} />
          ))}
        </div>
      ) : (
        <>
          {/* Roblox account row */}
          {roblox ? (
            <AccountRow>
              {roblox.robloxAvatar ? (
                <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(var(--color-accent-rgb),0.5)", boxShadow: "0 0 10px rgba(var(--color-accent-rgb),0.3)", position: "relative", flexShrink: 0 }}>
                  <Image src={roblox.robloxAvatar} alt={roblox.robloxUsername} fill sizes="44px" style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-elevated)", border: "2px solid rgba(var(--color-accent-rgb),0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif", fontSize: "16px", color: "var(--color-accent)" }}>
                    {roblox.robloxUsername.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, marginBottom: 2 }}>
                  {roblox.robloxUsername}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "11px", color: "var(--color-text-muted)" }}>
                    ID: {roblox.robloxId}
                  </span>
                  <ConnectedDot />
                </div>
                <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: "2px 0 0", letterSpacing: "0.04em" }}>
                  Connected via Roblox OAuth
                </p>
              </div>
            </AccountRow>
          ) : (
            <AccountRow>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-elevated)", border: "2px solid rgba(var(--color-accent-rgb),0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Monitor size={20} style={{ color: "rgba(var(--color-accent-rgb),0.3)" }} />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>Roblox account not connected</p>
                <a href="/api/auth/roblox/start" style={{ fontSize: "11px", color: "var(--color-accent)", textDecoration: "none", letterSpacing: "0.06em" }}>Connect Roblox →</a>
              </div>
            </AccountRow>
          )}

          {/* Google account row */}
          {google ? (
            <AccountRow>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-elevated)", border: "2px solid rgba(var(--color-accent-rgb),0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 8px rgba(var(--color-accent-rgb),0.2)" }}>
                {/* Google "G" mark */}
                <svg width="22" height="22" viewBox="0 0 24 24" aria-label="Google">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-rajdhani,'Rajdhani'),sans-serif", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, marginBottom: 2 }}>
                  {google.name}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono'),monospace", fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {google.email}
                  </span>
                  <ConnectedDot />
                </div>
                <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: "2px 0 0", letterSpacing: "0.04em" }}>
                  Connected via Google OAuth
                </p>
              </div>
            </AccountRow>
          ) : (
            <AccountRow>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-elevated)", border: "2px solid rgba(var(--color-accent-rgb),0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={20} style={{ color: "rgba(var(--color-accent-rgb),0.3)" }} />
              </div>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>Google account not connected</p>
            </AccountRow>
          )}

          {/* Disconnect button */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 mt-4"
            style={{
              padding: "13px 24px", borderRadius: 8, cursor: "pointer",
              background: "rgba(239,68,68,0.08)",
              border: "1.5px solid rgba(239,68,68,0.4)",
              color: "#ef4444",
              fontFamily: "var(--font-orbitron,'Orbitron'),sans-serif",
              fontSize: "11px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background   = "rgba(239,68,68,0.16)";
              (e.currentTarget as HTMLElement).style.borderColor  = "rgba(239,68,68,0.7)";
              (e.currentTarget as HTMLElement).style.boxShadow    = "0 0 20px rgba(239,68,68,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background   = "rgba(239,68,68,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor  = "rgba(239,68,68,0.4)";
              (e.currentTarget as HTMLElement).style.boxShadow    = "none";
            }}
          >
            <LogOut size={14} />
            Disconnect All Accounts
          </button>
        </>
      )}

      <DisconnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="hub-enter p-6 max-w-4xl mx-auto">
      <HubTitle />
      <ThemeEngine />
      <PerformanceMode />
      <AccountManagement />
    </div>
  );
}
