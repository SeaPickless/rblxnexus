// src/app/api/proxy/games/search/route.ts
// GET /api/proxy/games/search?q=X&genre=X&sort=X
// Searches Roblox games list.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const genre = req.nextUrl.searchParams.get("genre")?.trim() ?? "";
  const sort  = req.nextUrl.searchParams.get("sort")?.trim() ?? "";

  if (!q) {
    return NextResponse.json(
      { error: true, message: "Missing required param: q" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const params: Record<string, string> = { keyword: q, limit: "25" };
    if (genre) params.genre      = genre;
    if (sort)  params.sortToken  = sort;

    const { data } = await axios.get(
      "https://games.roblox.com/v1/games/list",
      { params }
    );

    return NextResponse.json(
      {
        data:           data?.games ?? [],
        nextPageCursor: data?.nextPageCursor ?? null,
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
