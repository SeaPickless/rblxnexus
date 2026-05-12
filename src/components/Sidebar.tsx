"use client";

// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Users,
  Gamepad2,
  Shield,
  Award,
  Rss,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";

const HUBS = [
  { label: "Social Commander", href: "/hub/social",       icon: Users      },
  { label: "Game Scout",       href: "/hub/gamescout",    icon: Gamepad2   },
  { label: "Group Intel",      href: "/hub/groupintel",   icon: Shield     },
  { label: "Badge Vault",      href: "/hub/badgevault",   icon: Award      },
  { label: "Follower Feed",    href: "/hub/followerfeed", icon: Rss        },
  { label: "API Health",       href: "/hub/apihealth",    icon: Activity   },
  { label: "RN Settings",      href: "/hub/settings",     icon: Settings   },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact]       = useState(false);

  // Sync compact state from body class (set by toggles.ts)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCompact(document.body.classList.contains("compact-sidebar"));
    });
    observer.observe(document.body, { attributeFilter: ["class"] });
    setCompact(document.body.classList.contains("compact-sidebar"));
    return () => observer.disconnect();
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="rblx-hamburger md:hidden"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx("rblx-sidebar", {
          open:    mobileOpen,
          compact: compact,
        })}
      >
        {/* Logo / wordmark */}
        <div className="rblx-sidebar-logo">
          <span className="logo-icon">⬡</span>
          {!compact && (
            <span className="logo-text">
              Rblx<span className="text-accent">Nexus</span>
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav className="rblx-sidebar-nav">
          {HUBS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={clsx("rblx-nav-item", { active, compact })}
                title={compact ? label : undefined}
              >
                <Icon size={18} className="nav-icon" />
                {!compact && <span className="nav-label">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <button
          className="rblx-sidebar-collapse hidden md:flex"
          onClick={() => {
            // Delegate to toggles system by dispatching a custom event
            window.dispatchEvent(
              new CustomEvent("rblx:toggle", { detail: "compactSidebar" })
            );
          }}
          aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
        >
          {compact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!compact && <span>Collapse</span>}
        </button>
      </aside>

      {/* Inline styles — scoped to sidebar */}
      <style jsx>{`
        /* Hamburger */
        .rblx-hamburger {
          position: fixed;
          top: 12px;
          left: 12px;
          z-index: 60;
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* Logo row */
        .rblx-sidebar-logo {
          height: 56px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .logo-icon {
          font-size: 22px;
          color: var(--accent);
          flex-shrink: 0;
        }
        .logo-text {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.3px;
          white-space: nowrap;
        }

        /* Nav list */
        .rblx-sidebar-nav {
          flex: 1 1 auto;
          overflow-y: auto;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Nav item */
        .rblx-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 13.5px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          overflow: hidden;
        }
        .rblx-nav-item:hover {
          background: var(--elevated);
          color: var(--text-primary);
        }
        .rblx-nav-item.active {
          background: var(--accent-muted);
          color: var(--accent);
        }
        .rblx-nav-item.active .nav-icon {
          color: var(--accent);
        }

        /* Compact: center icon, tooltip via title */
        .rblx-nav-item.compact {
          justify-content: center;
          padding: 10px;
        }

        /* Collapse button */
        .rblx-sidebar-collapse {
          margin: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          align-items: center;
          gap: 6px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .rblx-sidebar-collapse:hover {
          background: var(--elevated);
          color: var(--text-primary);
        }

        /* Compact sidebar width override */
        .rblx-sidebar.compact {
          width: 48px;
        }
      `}</style>
    </>
  );
}