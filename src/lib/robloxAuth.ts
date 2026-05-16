// src/lib/robloxAuth.ts
// Roblox OAuth 2.0 PKCE helpers.
// All functions run SERVER-SIDE only. Never imported by client components.
//
// CORS SOLUTION:
// By keeping all crypto and token work here (server lib), we ensure
// no Roblox API URL ever reaches the browser bundle.

import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

// ── Constants ─────────────────────────────────────────────────────────────────
const ROBLOX_AUTH_URL  = "https://apis.roblox.com/oauth/v1/authorize";
const REDIRECT_URI     = `${process.env.NEXTAUTH_URL}/api/auth/roblox/callback`;
const SCOPES           = [
  "openid",
  "profile",
  "asset:read",
  "thumbnail:read",
  "user.social:read",
  "user.advanced:read",
].join(" ");

// Encryption key derived from NEXTAUTH_SECRET
function getEncKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET!;
  // Derive a 32-byte key via SHA-256
  return new Uint8Array(
    Buffer.from(
      crypto.createHash("sha256").update(secret).digest("hex"),
      "hex"
    )
  );
}

// ── PKCE helpers ──────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure PKCE code verifier (43–128 chars, URL-safe).
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(64).toString("base64url");
}

/**
 * Derive the PKCE code challenge from a verifier (S256 method).
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

/**
 * Generate a random state string for CSRF protection.
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Verify that the returned state matches the stored state.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyPKCE(returned: string, stored: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(returned),
      Buffer.from(stored)
    );
  } catch {
    return false;
  }
}

/**
 * Build the Roblox OAuth authorization URL with PKCE parameters.
 * Returns both the URL and the generated verifier + state
 * (which must be stored in httpOnly cookies before redirecting).
 */
export function buildRobloxAuthUrl(): {
  url:      string;
  verifier: string;
  state:    string;
} {
  const verifier  = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state     = generateState();

  const params = new URLSearchParams({
    client_id:             process.env.ROBLOX_CLIENT_ID!,
    redirect_uri:          REDIRECT_URI,
    response_type:         "code",
    scope:                 SCOPES,
    code_challenge:        challenge,
    code_challenge_method: "S256",
    state,
  });

  return {
    url:      `${ROBLOX_AUTH_URL}?${params.toString()}`,
    verifier,
    state,
  };
}

// ── Token encryption (jose JWT) ───────────────────────────────────────────────

/**
 * Encrypt a Roblox access token into a signed JWT for safe cookie storage.
 * The raw access_token is NEVER stored in plain text.
 */
export async function encryptToken(accessToken: string): Promise<string> {
  const key = getEncKey();
  return new SignJWT({ token: accessToken })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

/**
 * Decrypt and verify the JWT to retrieve the raw Roblox access token.
 * Returns null if the token is invalid or expired.
 */
export async function decryptToken(encrypted: string): Promise<string | null> {
  try {
    const key = getEncKey();
    const { payload } = await jwtVerify(encrypted, key);
    return (payload as { token?: string }).token ?? null;
  } catch {
    return null;
  }
}
