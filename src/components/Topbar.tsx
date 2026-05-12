"use client";

// src/components/Topbar.tsx
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { LogIn, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

// Map route segments to human-readable page titles
const PAGE_TITLES: Record<string, string> = {
  "/hub/social":      "Social Commander",
  "/hub/gamescout":   "Game Scout",
  "/hub/groupintel":  "Group Intel",
  "/hub/badgevault":  "Badge Vault",
  "/hub/followerfeed":"Follower Feed",
  "/hub/apihealth":   "API Health Monitor",
  "/hub/settings":    "RN Settings",
  "/":                "Dashboard",
};

function resolveTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Prefix match (sub-routes)
  for (const [key, label] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + "/")) return label;
  }
  return "RblxNexus";
}

export function Topbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const title = resolveTitle(pathname);
  const user  = session?.user;

  // Initials fallback avatar
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // Check low-bandwidth toggle
  const [lowBw, setLowBw] = useState(false);
  useEffect(() => {
    const sync = () => setLowBw(document.body.classList.contains("low-bandwidth"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <header className="rblx-topbar">
      {/* Page title */}
      <h1 className="topbar-title">{title}</h1>

      {/* Right side */}
      <div className="topbar-right">
        {status === "loading" && (
          <div className="avatar-skeleton" aria-label="Loading user..." />
        )}

        {status === "unauthenticated" && (
          <button className="sign-in-btn" onClick={() => signIn("google")}>
            <LogIn size={15} />
            Sign in
          </button>
        )}

        {status === "authenticated" && user && (
          <div className="user-menu-wrapper" ref={menuRef}>
            <button
              className="user-chip"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              {/* Avatar */}
              <div className="avatar-wrap">
                {/* Real image (hidden in low-bandwidth mode) */}
                {user.image && !lowBw && (
                  <Image
                    src={user.image}
                    alt={user.name ?? "User avatar"}
                    width={28}
                    height={28}
                    className="avatar-img rblx-avatar-img"
                  />
                )}
                {/* Fallback initials (shown in low-bandwidth or when no image) */}
                <span
                  className={clsx("avatar-fallback rblx-avatar-fallback", {
                    hidden: user.image && !lowBw,
                  })}
                >
                  {initials}
                </span>
              </div>

              <span className="user-name">{user.name}</span>
              <ChevronDown
                size={14}
                className={clsx("chevron", { rotated: menuOpen })}
              />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="user-dropdown" role="menu">
                <div className="dropdown-info">
                  <p className="dropdown-name">{user.name}</p>
                  <p className="dropdown-email">{user.email}</p>
                </div>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item danger"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); signOut(); }}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .topbar-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.2px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Loading skeleton */
        .avatar-skeleton {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--elevated);
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        /* Sign in button */
        .sign-in-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: var(--accent);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .sign-in-btn:hover { opacity: 0.85; }

        /* User chip */
        .user-menu-wrapper { position: relative; }

        .user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          border-radius: 99px;
          background: var(--elevated);
          border: 1px solid var(--border);
          cursor: pointer;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          transition: background 0.15s;
        }
        .user-chip:hover { background: var(--surface); }

        .avatar-wrap {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--accent-muted);
          color: var(--accent);
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-fallback.hidden { display: none; }

        .user-name {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chevron {
          color: var(--text-secondary);
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .chevron.rotated { transform: rotate(180deg); }

        /* Dropdown */
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 10px;
          box-shadow: var(--shadow);
          overflow: hidden;
          z-index: 100;
        }

        .dropdown-info {
          padding: 12px 14px;
        }
        .dropdown-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .dropdown-email {
          font-size: 11.5px;
          color: var(--text-secondary);
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dropdown-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          text-align: left;
        }
        .dropdown-item:hover { background: var(--surface); color: var(--text-primary); }
        .dropdown-item.danger:hover { color: #EF4444; }
      `}</style>
    </header>
  );
}
