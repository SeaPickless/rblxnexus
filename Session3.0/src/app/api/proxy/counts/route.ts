// src/app/api/proxy/counts/route.ts
// GET /api/proxy/counts?userId=X
// Parallel fetches friends/followers/following counts.
// Returns { friends, followers, following }
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

async function fetchCount(url: string): Promise<number | null> {
  try {
    const { data } = await axios.get(url);
    return data?.count ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();

  if (!userId || isNaN(Number(userId))) {
    return NextResponse.json(
      { error: true, message: "Missing or invalid param: userId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const base = `https://friends.roblox.com/v1/users/${userId}`;

  const [friends, followers, following] = await Promise.all([
    fetchCount(`${base}/friends/count`),
    fetchCount(`${base}/followers/count`),
    fetchCount(`${base}/followings/count`),
  ]);

  // If all three failed, treat it as an upstream error
  if (friends === null && followers === null && following === null) {
    return NextResponse.json(
      { error: true, message: "Failed to fetch counts from Roblox.", status: 502 },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { friends, followers, following },
    { headers: { "Cache-Control": "no-store" } }
  );
}
