// src/app/api/auth/roblox/callback/route.ts
//
// CORS SOLUTION:
// The browser is redirected HERE (same origin) by Roblox after the user
// approves. This server-side handler then exchanges the code for tokens by
// calling apis.roblox.com from the SERVER — never from the browser.
// The browser never touches roblox.com directly. CORS eliminated.

import { NextRequest, NextResponse } from "next/server";
import { encryptToken, verifyPKCE } from "@/lib/robloxAuth";
import { setRobloxSession } from "@/lib/session";

const ROBLOX_TOKEN_URL   = "https://apis.roblox.com/oauth/v1/token";
const ROBLOX_USERINFO_URL = "https://apis.roblox.com/oauth/v1/userinfo";
const REDIRECT_URI       = `${process.env.NEXTAUTH_URL}/api/auth/roblox/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // ── Handle Roblox OAuth errors ────────────────────────────────────────────
  if (error) {
    console.error("[Roblox OAuth] Error from Roblox:", error);
    return NextResponse.redirect(
      new URL(`/?roblox_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?roblox_error=missing_params", req.url));
  }

  // ── Retrieve code_verifier from cookie (set during /api/auth/roblox/start) ─
  const storedVerifier = req.cookies.get("rblx_pkce_verifier")?.value;
  const storedState    = req.cookies.get("rblx_pkce_state")?.value;

  if (!storedVerifier || !storedState) {
    return NextResponse.redirect(new URL("/?roblox_error=session_expired", req.url));
  }

  // ── Verify state to prevent CSRF ─────────────────────────────────────────
  if (!verifyPKCE(state, storedState)) {
    return NextResponse.redirect(new URL("/?roblox_error=state_mismatch", req.url));
  }

  // ── Exchange code for tokens — SERVER SIDE, never browser ────────────────
  // This is the key CORS fix: fetch() runs on the Next.js server, not the browser.
  let tokenData: {
    access_token:  string;
    refresh_token?: string;
    expires_in:    number;
    token_type:    string;
  };

  try {
    const tokenRes = await fetch(ROBLOX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        code,
        redirect_uri:  REDIRECT_URI,
        code_verifier: storedVerifier,
        client_id:     process.env.ROBLOX_CLIENT_ID!,
        client_secret: process.env.ROBLOX_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[Roblox OAuth] Token exchange failed:", errText);
      return NextResponse.redirect(
        new URL("/?roblox_error=token_exchange_failed", req.url)
      );
    }

    tokenData = await tokenRes.json();
  } catch (err) {
    console.error("[Roblox OAuth] Network error during token exchange:", err);
    return NextResponse.redirect(new URL("/?roblox_error=network_error", req.url));
  }

  // ── Fetch Roblox userinfo — SERVER SIDE ───────────────────────────────────
  let robloxUser: {
    sub:             string; // Roblox user ID
    name?:           string;
    preferred_username?: string;
    profile?:        string;
    picture?:        string;
  };

  try {
    const userRes = await fetch(ROBLOX_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error("[Roblox OAuth] Userinfo fetch failed:", userRes.status);
      return NextResponse.redirect(
        new URL("/?roblox_error=userinfo_failed", req.url)
      );
    }

    robloxUser = await userRes.json();
  } catch (err) {
    console.error("[Roblox OAuth] Userinfo network error:", err);
    return NextResponse.redirect(new URL("/?roblox_error=network_error", req.url));
  }

  // ── Encrypt access token and store in httpOnly cookie ────────────────────
  const encryptedToken = await encryptToken(tokenData.access_token);

  // Build the response — redirect to bootstrap screen
  const response = NextResponse.redirect(new URL("/bootstrap", req.url));

  // Store encrypted Roblox session
  await setRobloxSession(response, {
    robloxId:       robloxUser.sub,
    robloxUsername: robloxUser.preferred_username ?? robloxUser.name ?? "Unknown",
    robloxAvatar:   robloxUser.picture ?? null,
    encryptedToken,
    expiresAt:      Date.now() + tokenData.expires_in * 1000,
  });

  // Clear PKCE cookies
  response.cookies.delete("rblx_pkce_verifier");
  response.cookies.delete("rblx_pkce_state");

  return response;
}
