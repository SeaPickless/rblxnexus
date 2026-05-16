"use client";
// src/app/bootstrap/page.tsx
// Shown after Google sign-in, before the main hub.
// Displays 5 sequential status messages with a glowing progress bar,
// then redirects to /hub/social.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

const STEPS = [
  "Initializing Rblx Nexus...",
  "Establishing secure connection...",
  "Getting your Roblox profile...",
  "Loading hub modules...",
  "Finalizing your command center...",
];

export default function BootstrapPage() {
  const router                    = useRouter();
  const [step,    setStep]        = useState(0);
  const [progress, setProgress]   = useState(0);
  const [done,    setDone]        = useState(false);

  useEffect(() => {
    // Make sure rn_signed_in is set
    localStorage.setItem("rn_signed_in", "true");

    let current = 0;
    const total = STEPS.length;

    function nextStep() {
      current++;
      const pct = Math.round((current / total) * 100);
      setStep(current);
      setProgress(pct);

      if (current >= total) {
        setDone(true);
        setTimeout(() => router.push("/hub/social"), 600);
      } else {
        setTimeout(nextStep, 800);
      }
    }

    // Start after a short delay
    const t = setTimeout(() => {
      setStep(1);
      setProgress(20);
      setTimeout(nextStep, 800);
    }, 400);

    return () => clearTimeout(t);
  }, [router]);

  const currentLabel = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <main
      style={{
        minHeight:      "100vh",
        background:     "var(--color-base)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "24px",
      }}
    >
      {/* Scanline overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(var(--color-accent-rgb),0.015) 2px,rgba(var(--color-accent-rgb),0.015) 4px)",
        }}
      />

      <div
        style={{
          width:          "100%",
          maxWidth:       380,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          gap:            32,
          position:       "relative",
          zIndex:         1,
          opacity:        done ? 0 : 1,
          transition:     "opacity 500ms ease",
        }}
      >
        {/* Glowing logo */}
        <div
          style={{
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(var(--color-accent-rgb),0.1)",
            border: "1px solid rgba(var(--color-accent-rgb),0.5)",
            boxShadow: "0 0 24px rgba(var(--color-accent-rgb),0.35), 0 0 48px rgba(var(--color-accent-rgb),0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "glow-breathe 3s ease-in-out infinite",
          }}
        >
          <Zap size={28} style={{ color: "var(--color-accent)" }} />
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily:    "var(--font-orbitron,'Orbitron'),sans-serif",
              fontSize:      "24px",
              fontWeight:    900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color:         "var(--color-accent)",
              margin:        0,
              textShadow:    "0 0 20px rgba(var(--color-accent-rgb),0.6)",
            }}
          >
            RblxNexus
          </h1>
        </div>

        {/* Progress section */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Status message */}
          <p
            style={{
              fontFamily:    "var(--font-rajdhani,'Rajdhani'),sans-serif",
              fontSize:      "13px",
              letterSpacing: "0.06em",
              color:         "rgba(var(--color-accent-rgb),0.8)",
              textAlign:     "center",
              minHeight:     20,
              transition:    "opacity 300ms ease",
            }}
          >
            {currentLabel}
          </p>

          {/* Progress bar track */}
          <div
            style={{
              width:        "100%",
              height:       4,
              borderRadius: 2,
              background:   "rgba(var(--color-accent-rgb),0.12)",
              overflow:     "hidden",
              position:     "relative",
            }}
          >
            {/* Fill */}
            <div
              style={{
                position:   "absolute",
                top: 0, left: 0,
                height:     "100%",
                width:      `${progress}%`,
                background: "var(--color-accent)",
                borderRadius: 2,
                transition: "width 700ms ease",
                boxShadow:  "0 0 10px rgba(var(--color-accent-rgb),0.8), 0 0 20px rgba(var(--color-accent-rgb),0.4)",
              }}
            >
              {/* Leading bright spot */}
              <div
                style={{
                  position: "absolute", right: 0, top: 0,
                  width: 20, height: "100%",
                  background: "rgba(255,255,255,0.6)",
                  filter: "blur(3px)",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          {/* Percent */}
          <p
            style={{
              fontFamily:    "var(--font-mono,'JetBrains Mono'),monospace",
              fontSize:      "11px",
              color:         "var(--color-text-muted)",
              textAlign:     "right",
              margin:        0,
            }}
          >
            {progress}%
          </p>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", gap: 8 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width:        i < step ? 20 : 6,
                height:       6,
                borderRadius: 3,
                background:   i < step ? "var(--color-accent)" : "rgba(var(--color-accent-rgb),0.2)",
                boxShadow:    i < step ? "0 0 6px rgba(var(--color-accent-rgb),0.6)" : "none",
                transition:   "all 400ms ease",
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
