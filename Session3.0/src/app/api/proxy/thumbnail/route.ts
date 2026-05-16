// src/app/api/proxy/thumbnail/route.ts
// GET /api/proxy/thumbnail?userId=X&size=150x150
// Returns { imageUrl } for a user's avatar headshot.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

const VALID_SIZES = [
  "48x48","50x50","60x60","75x75","100x100",
  "110x110","150x150","180x180","352x352","420x420","720x720",
];

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();
  const size   = req.nextUrl.searchParams.get("size")?.trim() ?? "150x150";

  if (!userId || isNaN(Number(userId))) {
    return NextResponse.json(
      { error: true, message: "Missing or invalid param: userId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const resolvedSize = VALID_SIZES.includes(size) ? size : "150x150";

  try {
    const { data } = await axios.get(
      "https://thumbnails.roblox.com/v1/users/avatar-headshot",
      {
        params: {
          userIds: userId,
          size:    resolvedSize,
          format:  "Png",
          isCircular: false,
        },
      }
    );

    const imageUrl = data?.data?.[0]?.imageUrl ?? null;

    if (!imageUrl) {
      return NextResponse.json(
        { error: true, message: "Thumbnail not available." },
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
