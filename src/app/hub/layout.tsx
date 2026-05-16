// src/app/hub/layout.tsx
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Sidebar from "@/components/Sidebar";
import Topbar  from "@/components/Topbar";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProviderWrapper>
      <div
        style={{
          display:        "flex",
          minHeight:      "100vh",
          background:     "var(--color-base)",
        }}
      >
        {/* Sidebar — desktop sticky, mobile drawer */}
        <Sidebar />

        {/* Main content area */}
        <div
          style={{
            flex:          1,
            display:       "flex",
            flexDirection: "column",
            minWidth:      0,
            minHeight:     "100vh",
          }}
        >
          <Topbar />
          <main style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </div>
    </SessionProviderWrapper>
  );
}
