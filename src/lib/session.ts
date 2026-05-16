// src/lib/session.ts
// Manages the Roblox session stored in an encrypted httpOnly cookie.
// Also exports the /api/auth/roblox/start handler logic used to
// initiate the PKCE flow (imported by the start route).
//
// CORS SOLUTION:
// The Roblox access_token is ONLY ever stored in a server-set httpOnly cookie.
// It is never exposed to JavaScript running in the browser, preventing both
// XSS token theft and any need for the browser to call roblox.com directly.

import { NextRequest, NextResponse } from "next/server";
import { decryptToken } from "./robloxAuth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RobloxSession {
  robloxId:       string;
  robloxUsername: string;
  robloxAvatar:   string | null;
  encryptedToken: string;
  expiresAt:      number; // Unix ms
}

// ── Cookie config ─────────────────────────────────────────────────────────────

const COOKIE_NAME    = "rblx_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path:     "/",
  maxAge:   60 * 60 * 2, // 2 hours — matches token expiry
};

// ── Write session ─────────────────────────────────────────────────────────────

/**
 * Serialize the Roblox session as JSON and set it in an httpOnly cookie.
 * Called by the OAuth callback after successful token exchange.
 */
export async function setRobloxSession(
  response: NextResponse,
  session: RobloxSession
): Promise<void> {
  response.cookies.set(
    COOKIE_NAME,
    JSON.stringify(session),
    COOKIE_OPTIONS
  );
}

// ── Read session ──────────────────────────────────────────────────────────────

/**
 * Read and parse the Roblox session from the incoming request's cookie.
 * Returns null if missing, malformed, or expired.
 */
export async function getRobloxSession(
  req: NextRequest
): Promise<RobloxSession | null> {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  let session: RobloxSession;
  try {
    session = JSON.parse(raw) as RobloxSession;
  } catch {
    return null;
  }

  // Reject expired sessions
  if (Date.now() > session.expiresAt) return null;

  return session;
}

/**
 * Retrieve the decrypted (raw) Roblox access token from the session cookie.
 * Used by proxy route handlers to authenticate Roblox API calls.
 * Returns null if no valid session exists.
 */
export async function getRobloxAccessToken(
  req: NextRequest
): Promise<string | null> {
  const session = await getRobloxSession(req);
  if (!session) return null;
  return decryptToken(session.encryptedToken);
}

// ── Clear session ─────────────────────────────────────────────────────────────

/**
 * Delete the Roblox session cookie.
 * Called by the /api/auth/roblox/signout route.
 */
export function clearRobloxSession(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}

// ── PKCE start helper ─────────────────────────────────────────────────────────
// This is the logic for /api/auth/roblox/start — kept here to avoid
// an extra file, but re-exported so the route can import it cleanly.

import { buildRobloxAuthUrl } from "./robloxAuth";

/**
 * Initiate the Roblox PKCE flow:
 * 1. Generate verifier + challenge + state
 * 2. Store verifier + state in short-lived httpOnly cookies
 * 3. Redirect the browser to Roblox's authorization endpoint
 *
 * The browser never sees the verifier or client secret.
 */
export function startRobloxOAuth(req: NextRequest): NextResponse {
  const { url, verifier, state } = buildRobloxAuthUrl();

  const response = NextResponse.redirect(url);

  const pkceOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   60 * 10, // 10 minutes — PKCE cookies are short-lived
  };

  response.cookies.set("rblx_pkce_verifier", verifier, pkceOptions);
  response.cookies.set("rblx_pkce_state",    state,    pkceOptions);

  return response;
}

// ── /api/auth/roblox/start route handler (inline) ────────────────────────────
// Create src/app/api/auth/roblox/start/route.ts with this content:
//
//   import { startRobloxOAuth } from "@/lib/session";
//   import { NextRequest } from "next/server";
//   export function GET(req: NextRequest) { return startRobloxOAuth(req); }
