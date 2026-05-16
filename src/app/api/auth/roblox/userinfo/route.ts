// src/app/api/auth/roblox/userinfo/route.ts
//
// CORS SOLUTION:
// The browser calls /api/auth/roblox/userinfo (same origin — no CORS).
// This server-side handler reads the encrypted Roblox token from the
// httpOnly cookie and returns the stored user info.
// The browser NEVER calls apis.roblox.com directly.

import { NextRequest, NextResponse } from "next/server";
import { getRobloxSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getRobloxSession(req);

  if (!session) {
    return NextResponse.json(
      { error: "No Roblox session found. Please connect your Roblox account." },
      { status: 401 }
    );
  }

  // Return only safe, non-sensitive fields to the browser
  return NextResponse.json({
    robloxId:       session.robloxId,
    robloxUsername: session.robloxUsername,
    robloxAvatar:   session.robloxAvatar,
    expiresAt:      session.expiresAt,
    connected:      true,
  });
}
