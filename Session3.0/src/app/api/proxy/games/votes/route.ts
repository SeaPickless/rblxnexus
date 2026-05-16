// src/app/api/proxy/games/votes/route.ts
// GET /api/proxy/games/votes?universeId=X
// Returns vote data { upVotes, downVotes } for a game.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const universeId = req.nextUrl.searchParams.get("universeId")?.trim();

  if (!universeId || isNaN(Number(universeId))) {
    return NextResponse.json(
      { error: true, message: "Missing or invalid param: universeId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { data } = await axios.get(
      "https://games.roblox.com/v1/games/votes",
      { params: { universeIds: universeId } }
    );

    const votes = data?.data?.[0];

    if (!votes) {
      return NextResponse.json(
        { error: true, message: "Votes not found for this game." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        universeId: votes.id,
        upVotes:    votes.upVotes   ?? 0,
        downVotes:  votes.downVotes ?? 0,
      },
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
