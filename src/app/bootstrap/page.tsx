// src/app/bootstrap/page.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function BootstrapPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/hub/social");
    } else if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-base)",
        gap: 24,
      }}
    >
      {/* Glowing logo */}
      <div
        style={{
          fontFamily: "var(--font-orbitron), sans-serif",
          fontSize: "28px",
          fontWeight: 800,
          color: "var(--color-accent)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          textShadow: "0 0 30px rgba(var(--color-accent-rgb),0.6)",
        }}
      >
        RblxNexus
      </div>

      {/* Loading bar */}
      <div
        style={{
          width: 200,
          height: 4,
          borderRadius: 2,
          background: "rgba(var(--color-accent-rgb),0.15)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: "var(--color-accent)",
            boxShadow: "0 0 10px rgba(var(--color-accent-rgb),0.6)",
            animation: "lb-shimmer 1.5s infinite",
          }}
        />
      </div>

      <p
        style={{
          fontFamily: "var(--font-rajdhani), sans-serif",
          fontSize: "13px",
          color: "var(--color-text-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Initializing...
      </p>
    </main>
  );
}
