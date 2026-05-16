// src/app/api/proxy/mutuals/route.ts
// GET /api/proxy/mutuals?myId=X&targetId=Y
// Fetches both friend lists server-side and returns intersection.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

async function fetchFriends(userId: string): Promise<{ id: number; name: string; displayName: string }[]> {
  const { data } = await axios.get(
    `https://friends.roblox.com/v1/users/${userId}/friends`
  );
  return data?.data ?? [];
}

export async function GET(req: NextRequest) {
  const myId     = req.nextUrl.searchParams.get("myId")?.trim();
  const targetId = req.nextUrl.searchParams.get("targetId")?.trim();

  if (!myId || !targetId || isNaN(Number(myId)) || isNaN(Number(targetId))) {
    return NextResponse.json(
      { error: true, message: "Missing or invalid params: myId, targetId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const [myFriends, targetFriends] = await Promise.all([
      fetchFriends(myId),
      fetchFriends(targetId),
    ]);

    const targetSet = new Set(targetFriends.map((f) => f.id));
    const mutuals   = myFriends.filter((f) => targetSet.has(f.id));

    return NextResponse.json(
      { mutuals, count: mutuals.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? (err.response?.status ?? 502) : 502;
    const message = axios.isAxiosError(err)
      ? (err.response?.data?.errors?.[0]?.message ?? err.message)
      : "Unexpected server error";
    return NextResponse.json(
      { error: true, message, status },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
