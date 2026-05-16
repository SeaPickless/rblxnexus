// src/app/api/auth/roblox/start/route.ts
//
// CORS SOLUTION:
// The "Connect Roblox" button on the login page navigates to THIS
// same-origin URL instead of directly to apis.roblox.com.
// This server handler generates the PKCE verifier + state, stores them
// in httpOnly cookies, then redirects to Roblox. The browser never
// constructs or knows the verifier — it just follows a redirect chain.

import { NextRequest } from "next/server";
import { startRobloxOAuth } from "@/lib/session";

export function GET(req: NextRequest) {
  return startRobloxOAuth(req);
}
