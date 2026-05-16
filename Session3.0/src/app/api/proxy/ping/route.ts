// src/app/api/proxy/ping/route.ts
// GET /api/proxy/ping?endpoint=catalog|users|thumbnails|groups|games|economy|presence|badges
// Measures real round-trip ms to each Roblox subdomain.
// Returns { endpoint, ms, ok, statusCode, checkedAt }
// NEVER returns fake/simulated ms values — real network timing only.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

// Each endpoint maps to a lightweight URL that returns quickly
const ENDPOINT_URLS: Record<string, string> = {
  users:      "https://users.roblox.com/v1/users/1",
  thumbnails: "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=1&size=48x48&format=Png",
  groups:     "https://groups.roblox.com/v1/groups/1",
  games:      "https://games.roblox.com/v1/games?universeIds=1",
  economy:    "https://economy.roblox.com/v1/currencies/1/balance",
  presence:   "https://presence.roblox.com/v1/presence/users",
  badges:     "https://badges.roblox.com/v1/users/1/badges?limit=10",
  catalog:    "https://catalog.roblox.com/v1/search/items?limit=10",
};

const VALID_ENDPOINTS = Object.keys(ENDPOINT_URLS);

async function pingEndpoint(name: string): Promise<{
  endpoint:   string;
  ms:         number | null;
  ok:         boolean;
  statusCode: number | null;
  checkedAt:  string;
}> {
  const url       = ENDPOINT_URLS[name];
  const checkedAt = new Date().toISOString();
  const start     = Date.now();

  try {
    const res = await axios.get(url, {
      timeout: 8000,
      // For presence endpoint which requires POST, we just do a HEAD-like GET
      // and accept any non-network error as "reachable"
      validateStatus: () => true,
    });

    const ms         = Date.now() - start;
    const statusCode = res.status;
    // Consider 2xx and 4xx as "ok" — endpoint is reachable
    // Only 5xx or network errors count as down
    const ok = statusCode < 500;

    return { endpoint: name, ms, ok, statusCode, checkedAt };
  } catch {
    // Network error — endpoint unreachable
    return { endpoint: name, ms: null, ok: false, statusCode: null, checkedAt };
  }
}

export async function GET(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint")?.trim().toLowerCase();

  // Ping a single endpoint
  if (endpoint) {
    if (!VALID_ENDPOINTS.includes(endpoint)) {
      return NextResponse.json(
        {
          error: true,
          message: `Invalid endpoint. Valid values: ${VALID_ENDPOINTS.join(", ")}`,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await pingEndpoint(endpoint);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  }

  // No endpoint param → ping ALL endpoints in parallel
  const results = await Promise.all(
    VALID_ENDPOINTS.map((name) => pingEndpoint(name))
  );

  return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
}
