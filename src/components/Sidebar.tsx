"use client";
// src/components/Sidebar.tsx
// Sci-fi animations applied:
//  ✓ Glitch text  — RblxNexus wordmark glitches randomly
//  ✓ Glow breathe — Logo icon box pulses its glow
//  ✓ Pulse rings  — Expanding rings emit from logo icon
//  ✓ Matrix grid  — Scrolling grid lines behind nav items
//  ✓ Neon flicker — Active nav item border flickers like a neon sign
//  ✓ Hover scan line — Scan line sweeps across nav items on hover
//  ✓ Stagger entrance — Nav items slide in sequentially on mount

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Users, Gamepad2, Shield, Award, Rss, Activity, Settings,
  ChevronLeft, ChevronRight, Zap, Menu, X,
} from "lucide-react";
import { getToggles, setToggle } from "@/lib/toggles";
import clsx from "clsx";

const HUBS = [
  { label: "Social Commander", icon: Users,    href: "/hub/social" },
  { label: "Game Scout",       icon: Gamepad2, href: "/hub/gamescout" },
  { label: "Group Intel",      icon: Shield,   href: "/hub/groupintel" },
  { label: "Badge Vault",      icon: Award,    href: "/hub/badgevault" },
  { label: "Follower Feed",    icon: Rss,      href: "/hub/followerfeed" },
  { label: "API Health",       icon: Activity, href: "/hub/apihealth" },
  { label: "RN Settings",      icon: Settings, href: "/hub/settings" },
] as const;

export default function Sidebar() {
  const pathname                        = usePathname();
  const [compact,    setCompact]        = useState(false);
  const [isMobile,   setIsMobile]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [mounted,    setMounted]        = useState(false);

  useEffect(() => {
    const t = getToggles();
    setCompact(t.compactSidebar);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    // Trigger stagger entrance after mount
    requestAnimationFrame(() => setMounted(true));
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isCompact = compact && !isMobile;

  function toggleCompact() {
    const next = !compact;
    setCompact(next);
    setToggle("compactSidebar", next);
    if (next) document.body.classList.add("compact-sidebar");
    else      document.body.classList.remove("compact-sidebar");
  }

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md neon-flicker-box"
          style={{
            background: "var(--color-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-accent)",
          }}
        >
          <Menu size={18} />
        </button>
      )}

      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        style={{
          width: isCompact ? "var(--sidebar-width-compact)" : "var(--sidebar-width)",
          minHeight: "100vh",
          background: "linear-gradient(180deg, var(--color-surface) 0%, var(--color-base) 100%)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          transition: "width 250ms ease, transform 250ms ease",
          position: isMobile ? "fixed" : "sticky",
          top: 0, left: 0,
          zIndex: 50,
          transform: isMobile && !mobileOpen ? "translateX(-100%)" : "translateX(0)",
          flexShrink: 0,
          overflowX: "hidden",
        }}
      >
        {/* ── Matrix grid scrolling background ─── */}
        <div
          aria-hidden="true"
          className="matrix-grid pointer-events-none absolute inset-0 z-0 opacity-100"
        />

        {/* ── Logo ── */}
        <div
          className="relative z-10 flex items-center gap-3 px-3"
          style={{
            height: "var(--topbar-height)",
            borderBottom: "1px solid rgba(var(--color-accent-rgb),0.15)",
            flexShrink: 0,
          }}
        >
          {/* Pulse rings + glow breathe on logo icon */}
          <div className="pulse-ring-wrap flex-shrink-0" style={{ borderRadius: "8px" }}>
            <div
              className="glow-breathe flex h-8 w-8 items-center justify-center rounded-md"
              style={{
                background: "rgba(var(--color-accent-rgb),0.12)",
                border: "1px solid rgba(var(--color-accent-rgb),0.5)",
              }}
            >
              <Zap size={16} style={{ color: "var(--color-accent)" }} />
            </div>
          </div>

          {!isCompact && (
            /* Glitch text wordmark */
            <span
              className="glitch-text font-orbitron text-sm font-bold uppercase tracking-widest truncate"
              data-text="RblxNexus"
              style={{ color: "var(--color-accent)" }}
            >
              RblxNexus
            </span>
          )}

          {isMobile && mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto flex-shrink-0"
              aria-label="Close menu"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-3">
          {HUBS.map(({ label, icon: Icon, href }, idx) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <div
                key={href}
                className="relative group px-2 mb-0.5"
                style={{
                  /* Stagger entrance */
                  opacity:    mounted ? 1 : 0,
                  transform:  mounted ? "translateX(0)" : "translateX(-16px)",
                  transition: `opacity 300ms ease ${80 + idx * 45}ms, transform 300ms ease ${80 + idx * 45}ms`,
                }}
              >
                {/* Compact tooltip */}
                {isCompact && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div
                      className="font-rajdhani text-xs font-semibold whitespace-nowrap rounded px-2 py-1"
                      style={{
                        background: "var(--color-elevated)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                        boxShadow: "0 0 10px rgba(var(--color-accent-rgb),0.25)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {label}
                    </div>
                  </div>
                )}

                {/* Scan line + neon flicker on active */}
                <Link
                  href={href}
                  className={clsx(
                    "scan-line-host flex items-center rounded-md transition-all duration-200",
                    isCompact ? "justify-center px-0 py-2.5 gap-0" : "gap-3 py-2.5",
                    active && "neon-flicker-box"
                  )}
                  style={
                    active
                      ? {
                          background: "rgba(var(--color-accent-rgb),0.1)",
                          borderLeft: isCompact ? "none" : "3px solid var(--color-accent)",
                          paddingLeft: isCompact ? undefined : "9px",
                          color: "var(--color-accent)",
                        }
                      : {
                          color: "var(--color-text-secondary)",
                          borderLeft: isCompact ? "none" : "3px solid transparent",
                          paddingLeft: isCompact ? undefined : "9px",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = "var(--color-text-primary)";
                      el.style.background = "rgba(var(--color-accent-rgb),0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = "var(--color-text-secondary)";
                      el.style.background = "";
                    }
                  }}
                >
                  {/* Scan line child element (driven by .scan-line-host:hover in CSS) */}
                  <span className="scan-line" aria-hidden="true" />
                  <Icon size={18} style={{ color: "inherit", flexShrink: 0, position: "relative", zIndex: 1 }} />
                  {!isCompact && (
                    <span
                      className="font-rajdhani text-sm font-medium truncate"
                      style={{ letterSpacing: "0.04em", position: "relative", zIndex: 1 }}
                    >
                      {label}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div
          className="relative z-10"
          style={{ height: "1px", background: "rgba(var(--color-accent-rgb),0.15)", margin: "0 12px" }}
        />

        {!isMobile && (
          <button
            onClick={toggleCompact}
            className={clsx(
              "relative z-10 flex items-center gap-2 m-2 rounded-md py-2 transition-all duration-200",
              isCompact ? "justify-center px-0" : "px-3"
            )}
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
          >
            {compact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!isCompact && (
              <span className="font-orbitron text-[10px] uppercase tracking-widest">Collapse</span>
            )}
          </button>
        )}
      </aside>
    </>
  );
}
