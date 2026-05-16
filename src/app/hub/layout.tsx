// src/app/hub/layout.tsx
// Shell layout for ALL hub pages (/hub/*).
// Renders Sidebar + Topbar + main content area.
// This is why hub navigation works — without this file
// the Sidebar never renders on any hub page.

import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Topbar  from "@/components/Topbar";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div
        style={{
          display:   "flex",
          minHeight: "100vh",
          background: "var(--color-base)",
        }}
      >
        {/* ── Left sidebar — always visible on desktop, drawer on mobile ── */}
        <Sidebar />

        {/* ── Right: topbar + page content ── */}
        <div
          style={{
            flex:      1,
            display:   "flex",
            flexDirection: "column",
            minWidth:  0, // prevents flex overflow
            minHeight: "100vh",
          }}
        >
          <Topbar />
          <main style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
