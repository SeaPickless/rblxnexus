"use client";
import { Suspense } from "react";
// src/app/page.tsx
// Sci-fi animations applied:
//  ✓ Particle canvas    — already existed, kept + enhanced
//  ✓ Glitch text        — RblxNexus wordmark glitches
//  ✓ Typewriter effect  — tagline types itself on load
//  ✓ Glow breathe       — logo icon box pulses glow
//  ✓ Pulse rings        — expanding rings from logo icon
//  ✓ Neon flicker       — button borders flicker like neon signs
//  ✓ Data stream        — card fades in with a counter-tick style entrance
//  ✓ Matrix grid bg     — scrolling grid lines on card background

import { useEffect, useRef, useState, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Canvas particle grid ──────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getAccentRgb = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-accent-rgb").trim();
      return v || "160,32,240";
    };

    let W = (canvas.width  = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const COUNT = 90;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.8 + 0.4,
      pulse: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    let frame = 0;

    function draw() {
      frame++;
      ctx!.clearRect(0, 0, W, H);
      const rgb = getAccentRgb();

      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx!.beginPath();
            ctx!.globalAlpha = (1 - dist / 130) * 0.2;
            ctx!.strokeStyle = `rgba(${rgb},1)`;
            ctx!.lineWidth = 0.6;
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        p.pulse += 0.02;
        const alpha = 0.4 + Math.sin(p.pulse) * 0.3;
        ctx!.globalAlpha = alpha;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${rgb},1)`;
        ctx!.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />;
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 42, startDelay = 800) {
  const [displayed, setDisplayed] = useState("");
  const [done,      setDone]      = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function RobloxIcon({ size = 18, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={style} className={className}>
      <path d="M5.005 3L3 21l15.995 3L21 3 5.005 3zm10.99 12.99l-6.01-1.133 1.133-6.01 6.01 1.133-1.133 6.01z" />
    </svg>
  );
}

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function LoginPage() {
  const router                                      = useRouter();
  const { status }                                  = useSession();
  const [loading,          setLoading]              = useState(false);
  const [robloxConnecting, setRobloxConnecting]     = useState(false);
  const [checked,          setChecked]              = useState(false);
  const [cardVisible,      setCardVisible]          = useState(false);

  const tagline = "Your Roblox command center.";
  const { displayed: typedTagline, done: taglineDone } = useTypewriter(tagline, 40, 1200);

  useEffect(() => {
    const signedIn = localStorage.getItem("rn_signed_in") === "true";
    if (signedIn) { router.replace("/hub/social"); }
    else { setChecked(true); setTimeout(() => setCardVisible(true), 100); }
  }, [router]);

  useEffect(() => {
    if (status === "authenticated") {
      localStorage.setItem("rn_signed_in", "true");
      router.push("/bootstrap");
    }
  }, [status, router]);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/bootstrap" });
  }

  function handleRobloxConnect() {
    setRobloxConnecting(true);
    window.location.href = "/api/auth/roblox/start";
  }

  if (!checked) return null;

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: "var(--color-base)" }}
    >
      <ParticleCanvas />

      {/* Scanline overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(var(--color-accent-rgb),0.018) 2px,rgba(var(--color-accent-rgb),0.018) 4px)",
        }}
      />

      {/* Radial ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] glow-breathe"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(var(--color-accent-rgb),0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Login card — data stream entrance + matrix grid bg ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm mx-4 overflow-hidden"
        style={{
          background:     "rgba(22,24,26,0.85)",
          border:         "1px solid rgba(var(--color-accent-rgb),0.4)",
          borderRadius:   "16px",
          padding:        "48px 40px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow:      "0 0 40px rgba(var(--color-accent-rgb),0.18), 0 0 80px rgba(var(--color-accent-rgb),0.06)",
          /* Data stream card entrance */
          opacity:        cardVisible ? 1 : 0,
          transform:      cardVisible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          transition:     "opacity 500ms ease, transform 500ms ease",
        }}
      >
        {/* Matrix grid inside card */}
        <div
          aria-hidden="true"
          className="matrix-grid pointer-events-none absolute inset-0 opacity-100"
          style={{ borderRadius: "16px" }}
        />

        {/* ── Wordmark ── */}
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          {/* Pulse rings + glow breathe on logo */}
          <div
            className="pulse-ring-wrap mb-2"
            style={{ borderRadius: "12px" }}
          >
            <div
              className="glow-breathe flex h-14 w-14 items-center justify-center rounded-xl"
              style={{
                background: "rgba(var(--color-accent-rgb),0.1)",
                border:     "1px solid rgba(var(--color-accent-rgb),0.5)",
              }}
            >
              <RobloxIcon size={28} style={{ color: "var(--color-accent)" }} />
            </div>
          </div>

          {/* Glitch wordmark */}
          <h1
            className="glitch-text font-orbitron text-3xl font-black uppercase"
            data-text="RblxNexus"
            style={{
              color: "var(--color-accent)",
              letterSpacing: "0.18em",
            }}
          >
            RblxNexus
          </h1>

          {/* Typewriter tagline */}
          <p
            className="font-rajdhani text-sm tracking-widest uppercase"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.15em", minHeight: "20px" }}
          >
            {typedTagline}
            {!taglineDone && <span className="typewriter-cursor" aria-hidden="true" />}
          </p>
        </div>

        {/* Divider */}
        <div
          className="relative z-10 w-full"
          style={{ height: "1px", background: "rgba(var(--color-accent-rgb),0.2)" }}
        />

        {/* ── Buttons ── */}
        <div className="relative z-10 flex flex-col gap-4 w-full">
          {/* Google Sign-In — neon flicker border */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || status === "loading"}
            className="neon-flicker-box w-full flex items-center justify-center gap-3 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:    "var(--color-elevated)",
              border:        "1.5px solid rgba(var(--color-accent-rgb),0.6)",
              color:         "var(--color-text-primary)",
              padding:       "13px 24px",
              fontFamily:    "var(--font-orbitron),sans-serif",
              fontSize:      "11px",
              fontWeight:    700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow   = "0 0 22px rgba(var(--color-accent-rgb),0.5), 0 0 44px rgba(var(--color-accent-rgb),0.15)";
              el.style.borderColor = "var(--color-accent)";
              el.style.transform   = "scale(1.03)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow   = "";
              el.style.borderColor = "rgba(var(--color-accent-rgb),0.6)";
              el.style.transform   = "scale(1)";
            }}
            onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)")}
            onMouseUp={(e)   => ((e.currentTarget as HTMLElement).style.transform = "scale(1.03)")}
          >
            <GoogleIcon size={18} />
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>

          {/* Connect Roblox — neon flicker accent */}
          <button
            onClick={handleRobloxConnect}
            disabled={robloxConnecting}
            className="neon-flicker-box w-full flex items-center justify-center gap-3 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:    "transparent",
              border:        "1.5px solid rgba(var(--color-accent-rgb),0.45)",
              color:         "var(--color-accent)",
              padding:       "13px 24px",
              fontFamily:    "var(--font-orbitron),sans-serif",
              fontSize:      "11px",
              fontWeight:    700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background  = "rgba(var(--color-accent-rgb),0.08)";
              el.style.borderColor = "var(--color-accent)";
              el.style.boxShadow   = "0 0 20px rgba(var(--color-accent-rgb),0.35)";
              el.style.transform   = "scale(1.03)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background  = "transparent";
              el.style.borderColor = "rgba(var(--color-accent-rgb),0.45)";
              el.style.boxShadow   = "";
              el.style.transform   = "scale(1)";
            }}
            onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)")}
            onMouseUp={(e)   => ((e.currentTarget as HTMLElement).style.transform = "scale(1.03)")}
          >
            <RobloxIcon size={18} />
            {robloxConnecting ? "Connecting..." : "Connect Roblox"}
          </button>
        </div>

        <p
          className="relative z-10 font-rajdhani text-xs text-center"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
        >
          Sign in with Google to access the hub.
          <br />
          Connect Roblox to unlock all features.
        </p>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
