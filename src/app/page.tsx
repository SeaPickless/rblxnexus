"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { generateCodeVerifier, generateState, buildRobloxAuthUrl } from "@/lib/robloxAuth";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [robloxLoading, setRobloxLoading] = useState(false);

  // Show auth errors from callback redirects
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "roblox_auth_failed") {
      toast.error("Roblox auth was cancelled or failed.");
    } else if (error === "roblox_token_failed") {
      toast.error("Could not complete Roblox sign-in. Try again.");
    } else if (error) {
      toast.error("Authentication error. Please try again.");
    }
  }, [searchParams]);

  // Redirect to dashboard if already fully signed in with Google
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast.error("Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  async function handleRobloxSignIn() {
    setRobloxLoading(true);
    try {
      const verifier = generateCodeVerifier();
      const state = generateState();
      const redirectUri = `${window.location.origin}/api/auth/roblox/callback`;
      const url = await buildRobloxAuthUrl(redirectUri, state, verifier);

      // Store state + verifier in cookies (via API route to set httpOnly)
      await fetch("/api/auth/roblox/pkce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, codeVerifier: verifier }),
      });

      window.location.href = url;
    } catch {
      toast.error("Failed to start Roblox sign-in.");
      setRobloxLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e8ff47] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#e8ff47 1px, transparent 1px), linear-gradient(90deg, #e8ff47 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#e8ff47] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-[#e8ff47] rounded-md flex items-center justify-center">
              <span className="text-[#0a0a0f] font-black text-sm leading-none">RN</span>
            </div>
            <span
              className="text-white text-2xl tracking-tight"
              style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}
            >
              RblxNexus
            </span>
          </div>
          <p className="text-zinc-500 text-sm tracking-wide uppercase">
            Your Roblox command center
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#111118] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
          <p className="text-zinc-400 text-sm text-center mb-1">
            Sign in to get started
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || robloxLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-[#0a0a0f] font-semibold text-sm rounded-xl px-4 py-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-zinc-600 text-xs">then link</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Roblox */}
          <button
            onClick={handleRobloxSignIn}
            disabled={googleLoading || robloxLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#e8ff47] hover:bg-[#d4eb30] text-[#0a0a0f] font-semibold text-sm rounded-xl px-4 py-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {robloxLoading ? (
              <span className="w-4 h-4 border-2 border-[#0a0a0f]/40 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RobloxIcon />
            )}
            Connect Roblox Account
          </button>

          <p className="text-zinc-600 text-xs text-center leading-relaxed">
            Sign in with Google first, then connect your Roblox account to unlock all features.
          </p>
        </div>

        <p className="text-zinc-700 text-xs text-center">
          By signing in you agree to our{" "}
          <span className="text-zinc-500 underline cursor-pointer">Terms</span>{" "}
          &{" "}
          <span className="text-zinc-500 underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function RobloxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.94 16.08 2 5.92 12.06 3.94 14 14.08zM12.06 20.06l-2-10.14 10.08-1.98 2 10.08z" />
    </svg>
  );
}