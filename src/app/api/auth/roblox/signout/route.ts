// src/app/api/auth/roblox/signout/route.ts
// Clears the Roblox session cookie (httpOnly).
// Called from the settings page "Disconnect Roblox" button.
// Browser calls /api/auth/roblox/signout (same origin — no CORS).

import { NextRequest, NextResponse } from "next/server";
import { clearRobloxSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearRobloxSession(response);
  return response;
}

// Also support GET for simple link-based sign-out + redirect
export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/", req.url));
  clearRobloxSession(response);
  return response;
}
