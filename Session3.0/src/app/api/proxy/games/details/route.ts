// src/app/api/proxy/games/details/route.ts
// GET /api/proxy/games/details?universeId=X
// Returns full game details for a universe ID.
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
      "https://games.roblox.com/v1/games",
      { params: { universeIds: universeId } }
    );

    const game = data?.data?.[0];

    if (!game) {
      return NextResponse.json(
        { error: true, message: "Game not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      game,
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
