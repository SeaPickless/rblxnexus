// src/app/api/proxy/games/thumbnail/route.ts
// GET /api/proxy/games/thumbnail?universeId=X
// Returns { imageUrl } for a game's icon thumbnail (512x512).
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
      "https://thumbnails.roblox.com/v1/games/icons",
      {
        params: {
          universeIds: universeId,
          size:        "512x512",
          format:      "Png",
          isCircular:  false,
        },
      }
    );

    const imageUrl = data?.data?.[0]?.imageUrl ?? null;

    if (!imageUrl) {
      return NextResponse.json(
        { error: true, message: "Game thumbnail not available." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { imageUrl },
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
