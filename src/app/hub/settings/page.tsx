"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Palette, Zap, User, LogOut, ToggleLeft, ToggleRight,
  Eye, Wifi, Layout, RefreshCw, Hash, AlertTriangle
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Theme {
  key: string;
  name: string;
  desc: string;
  swatch: string;
  accent: string;
}

interface ToggleSetting {
  key: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

interface Toggles {
  disableAnimations: boolean;
  compactSidebar: boolean;
  autoRefresh: boolean;
  showUserIds: boolean;
  lowBandwidth: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const THEMES: Theme[] = [
  { key: "nexus-dark", name: "Nexus Dark", desc: "Default dark experience", swatch: "from-gray-900 to-gray-800", accent: "border-indigo-500" },
  { key: "midnight-blue", name: "Midnight Blue", desc: "Deep ocean tones", swatch: "from-blue-950 to-blue-900", accent: "border-blue-500" },
  { key: "cyber-green", name: "Cyber Green", desc: "Matrix-inspired neon", swatch: "from-gray-950 to-green-950", accent: "border-green-400" },
  { key: "sunset-red", name: "Sunset Red", desc: "Warm crimson hues", swatch: "from-gray-950 to-red-950", accent: "border-red-500" },
  { key: "oled-black", name: "OLED Black", desc: "Pure black for OLED", swatch: "from-black to-gray-950", accent: "border-white/40" },
  { key: "light-mode", name: "Light Mode", desc: "Clean & bright", swatch: "from-gray-100 to-white", accent: "border-indigo-500" },
];

const TOGGLE_SETTINGS: ToggleSetting[] = [
  { key: "disableAnimations", label: "Disable Animations", desc: "Turn off transitions and motion effects.", icon: <Zap size={16} /> },
  { key: "compactSidebar", label: "Compact Sidebar", desc: "Show icons only in the navigation sidebar.", icon: <Layout size={16} /> },
  { key: "autoRefresh", label: "Auto-Refresh Data", desc: "Automatically refresh hub data in the background.", icon: <RefreshCw size={16} /> },
  { key: "showUserIds", label: "Show User IDs", desc: "Display Roblox user IDs alongside usernames.", icon: <Hash size={16} /> },
  { key: "lowBandwidth", label: "Low Bandwidth Mode", desc: "Skip avatar thumbnails to reduce data usage.", icon: <Wifi size={16} /> },
];

const LS_THEME_KEY = "rn_theme";
const LS_TOGGLES_KEY = "rn_toggles";

const ALL_LS_KEYS = [
  "rn_theme", "rn_toggles", "rn_watchlist",
  "rn_bookmarks", "rn_ping_log", "rn_auto_refresh",
];

const DEFAULT_TOGGLES: Toggles = {
  disableAnimations: false,
  compactSidebar: false,
  autoRefresh: false,
  showUserIds: false,
  lowBandwidth: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadToggles(): Toggles {
  try { return { ...DEFAULT_TOGGLES, ...JSON.parse(localStorage.getItem(LS_TOGGLES_KEY) ?? "{}") }; }
  catch { return DEFAULT_TOGGLES; }
}

function loadTheme(): string {
  return localStorage.getItem(LS_THEME_KEY) ?? "nexus-dark";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-indigo-400">{icon}</span>
      <h2 className="text-base font-bold text-white">{title}</h2>
    </div>
  );
}

// ── Theme Engine ──────────────────────────────────────────────────────────────

function ThemeEngine() {
  const [active, setActive] = useState("nexus-dark");

  useEffect(() => { setActive(loadTheme()); }, []);

  function selectTheme(key: string) {
    setActive(key);
    localStorage.setItem(LS_THEME_KEY, key);
    toast.success(`Theme set to ${THEMES.find((t) => t.key === key)?.name}`);
    // In a real app, you'd dispatch a context update here
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <SectionHeader icon={<Palette size={18} />} title="Theme Engine" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const isActive = active === theme.key;
          return (
            <button
              key={theme.key}
              onClick={() => selectTheme(theme.key)}
              className={`rounded-xl border-2 overflow-hidden transition-all text-left ${
                isActive ? theme.accent : "border-white/10 hover:border-white/30"
              }`}
            >
              {/* Swatch */}
              <div className={`h-12 bg-gradient-to-br ${theme.swatch}`} />
              {/* Info */}
              <div className="p-2 bg-white/5">
                <p className="text-xs font-semibold text-white">{theme.name}</p>
                <p className="text-xs text-white/40 leading-tight">{theme.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Performance Mode ──────────────────────────────────────────────────────────

function PerformanceMode() {
  const [toggles, setToggles] = useState<Toggles>(DEFAULT_TOGGLES);

  useEffect(() => { setToggles(loadToggles()); }, []);

  function flip(key: keyof Toggles) {
    setToggles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(LS_TOGGLES_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <SectionHeader icon={<Zap size={18} />} title="Performance Mode" />
      <div className="space-y-3">
        {TOGGLE_SETTINGS.map(({ key, label, desc, icon }) => {
          const on = toggles[key as keyof Toggles];
          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <span className="text-white/50 shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/40">{desc}</p>
              </div>
              <button onClick={() => flip(key as keyof Toggles)} className="shrink-0 transition-colors">
                {on ? (
                  <ToggleRight size={28} className="text-indigo-400" />
                ) : (
                  <ToggleLeft size={28} className="text-white/30" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Account Management ────────────────────────────────────────────────────────

interface ConnectedAccount {
  roblox?: {
    avatarUrl?: string;
    displayName: string;
    username: string;
    userId: number;
  };
  google?: {
    email: string;
  };
}

function AccountManagement() {
  const router = useRouter();
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => { setAccount(data); })
      .catch(() => { setAccount(null); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      ALL_LS_KEYS.forEach((k) => localStorage.removeItem(k));
      toast.success("All accounts disconnected. Redirecting…");
      setTimeout(() => router.push("/"), 1200);
    } catch {
      toast.error("Disconnect failed. Please try again.");
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <SectionHeader icon={<User size={18} />} title="Account Management" />
        <div className="animate-pulse space-y-2">
          <div className="h-16 rounded-xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      <SectionHeader icon={<User size={18} />} title="Account Management" />

      {account?.roblox ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
          {account.roblox.avatarUrl ? (
            <Image
              src={account.roblox.avatarUrl}
              alt={account.roblox.displayName}
              width={48}
              height={48}
              className="rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white">{account.roblox.displayName}</p>
            <p className="text-xs text-white/50">@{account.roblox.username} · ID {account.roblox.userId}</p>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
              Connected via Roblox OAuth
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm text-white/40">No Roblox account connected.</p>
        </div>
      )}

      {account?.google && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-xl">G</span>
          </div>
          <div>
            <p className="text-sm text-white font-medium">{account.google.email}</p>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
              Connected via Google
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        className="w-full py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={15} /> Disconnect All Accounts
      </button>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-red-500/30 bg-gray-900 p-6 space-y-4 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} />
              <p className="font-bold text-white">Disconnect All Accounts</p>
            </div>
            <p className="text-sm text-white/60">
              This will sign you out of all connected accounts, clear all local settings and data, and redirect you to the home page. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/40">Customise your RblxNexus experience.</p>
      </div>

      <ThemeEngine />
      <PerformanceMode />
      <AccountManagement />
    </div>
  );
}
