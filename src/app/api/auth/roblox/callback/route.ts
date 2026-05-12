import { NextRequest, NextResponse } from "next/server";
import { saveRobloxSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieState = req.cookies.get("roblox_oauth_state")?.value;
  const codeVerifier = req.cookies.get("roblox_code_verifier")?.value;

  const redirectBase = process.env.NEXTAUTH_URL ?? "https://rblxnexus.vercel.app";

  if (error || !code || !state || state !== cookieState || !codeVerifier) {
    return NextResponse.redirect(`${redirectBase}/?error=roblox_auth_failed`);
  }

  try {
    const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${redirectBase}/api/auth/roblox/callback`,
        code_verifier: codeVerifier,
        client_id: process.env.ROBLOX_CLIENT_ID!,
        client_secret: process.env.ROBLOX_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokens = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokens;

    const userRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) throw new Error("Failed to fetch Roblox userinfo");

    const robloxUser = await userRes.json();

    const response = NextResponse.redirect(`${redirectBase}/dashboard`);

    response.cookies.delete("roblox_oauth_state");
    response.cookies.delete("roblox_code_verifier");

    await saveRobloxSession(response, {
      accessToken: access_token,
      refreshToken: refresh_token ?? null,
      expiresAt: Date.now() + (expires_in ?? 3600) * 1000,
      userId: robloxUser.sub,
      username: robloxUser.preferred_username ?? robloxUser.name ?? "Unknown",
      displayName: robloxUser.name ?? robloxUser.preferred_username ?? "Unknown",
      picture: robloxUser.picture ?? null,
    });

    return response;
  } catch (err) {
    console.error("[roblox/callback]", err);
    return NextResponse.redirect(`${redirectBase}/?error=roblox_token_failed`);
  }
}