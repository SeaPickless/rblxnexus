"use client";
// src/components/Topbar.tsx
// Sci-fi animations applied:
//  ✓ Typewriter effect — page title types itself on route change
//  ✓ Glow breathe     — accent pip pulses its glow
//  ✓ Neon flicker     — avatar border ring flickers
//  ✓ Pulse rings      — rings expand from avatar on load

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { LogIn, User } from "lucide-react";
import { getToggles } from "@/lib/toggles";

const HUB_LABELS: Record<string, string> = {
  "/hub/social":       "Social Commander",
  "/hub/gamescout":    "Game Scout",
  "/hub/groupintel":   "Group Intel",
  "/hub/badgevault":   "Badge Vault",
  "/hub/followerfeed": "Follower Feed",
  "/hub/apihealth":    "API Health Monitor",
  "/hub/settings":     "RN Settings",
};

function getPageTitle(pathname: string): string {
  if (HUB_LABELS[pathname]) return HUB_LABELS[pathname];
  for (const [key, label] of Object.entries(HUB_LABELS)) {
    if (pathname.startsWith(key + "/")) return label;
  }
  return "RblxNexus";
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 38) {
  const [displayed, setDisplayed] = useState(text);
  const [typing,    setTyping]    = useState(false);
  const prevText                  = useRef(text);

  useEffect(() => {
    if (text === prevText.current) return;
    prevText.current = text;
    setTyping(true);
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTyping(false);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, typing };
}

export default function Topbar() {
  const pathname                      = usePathname();
  const { data: session, status }     = useSession();
  const [signedIn,    setSignedIn]    = useState(false);
  const [showUserIds, setShowUserIds] = useState(false);

  useEffect(() => {
    setSignedIn(localStorage.getItem("rn_signed_in") === "true");
    const t = getToggles();
    setShowUserIds(t.showUserIds);
  }, []);

  const rawTitle            = getPageTitle(pathname);
  const { displayed, typing } = useTypewriter(rawTitle, 36);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6"
      style={{
        height: "var(--topbar-height)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(22,24,26,0.78)",
        borderBottom: "1px solid rgba(var(--color-accent-rgb),0.3)",
      }}
    >
      {/* ── Left: typewriter page title ── */}
      <div className="flex items-center gap-3 min-w-0 pl-10 md:pl-0">
        {/* Glow-breathing accent pip */}
        <span
          className="hidden md:block h-4 w-0.5 rounded-full flex-shrink-0 glow-breathe"
          style={{ background: "var(--color-accent)" }}
        />
        <h1
          className="font-orbitron text-sm md:text-base font-bold uppercase tracking-widest truncate"
          style={{ color: "var(--color-text-primary)", letterSpacing: "0.1em", minWidth: "120px" }}
        >
          {displayed}
          {/* Typewriter cursor — shown while typing */}
          {typing && <span className="typewriter-cursor" aria-hidden="true" />}
        </h1>
      </div>

      {/* ── Right: user / sign-in ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {!signedIn && status !== "authenticated" && (
          <button
            onClick={() => signIn("google")}
            className="rn-btn-primary hidden sm:flex"
            style={{ fontSize: "10px", padding: "8px 16px" }}
          >
            <LogIn size={14} />
            Sign In
          </button>
        )}

        {status === "authenticated" && session?.user && (
          <div className="flex items-center gap-2">
            {showUserIds && (session.user as { robloxId?: string }).robloxId && (
              <span
                className="font-mono-rblx text-xs hidden md:block"
                style={{ color: "var(--color-text-muted)" }}
              >
                #{(session.user as { robloxId?: string }).robloxId}
              </span>
            )}
            <span
              className="hidden md:block font-rajdhani text-sm font-semibold tracking-wide"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {session.user.name}
            </span>

            {/* Pulse rings + neon flicker on avatar */}
            <div
              className="pulse-ring-wrap flex-shrink-0"
              style={{ borderRadius: "50%" }}
            >
              <div
                className="relative h-8 w-8 rounded-full overflow-hidden neon-flicker-box"
                style={{
                  border: "1.5px solid var(--color-accent)",
                  flexShrink: 0,
                }}
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    fill sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: "var(--color-elevated)" }}
                  >
                    <User size={16} style={{ color: "var(--color-accent)" }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div
            className="h-8 w-8 rounded-full skeleton flex-shrink-0"
            style={{ border: "1.5px solid var(--color-border)" }}
          />
        )}
      </div>
    </header>
  );
}
