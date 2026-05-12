// Roblox OAuth 2.0 PKCE helpers

const ROBLOX_AUTH_URL = "https://apis.roblox.com/oauth/v1/authorize";
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID!;
const SCOPES = "openid profile asset:read thumbnail:read user.social:read user.advanced:read";

/**
 * Generate a cryptographically random code verifier (PKCE)
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Derive the code challenge from the verifier (SHA-256)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generate a random state string for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Build the full Roblox authorization URL
 */
export async function buildRobloxAuthUrl(
  redirectUri: string,
  state: string,
  codeVerifier: string
): Promise<string> {
  const challenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: ROBLOX_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return `${ROBLOX_AUTH_URL}?${params.toString()}`;
}

// --- Helpers ---

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}