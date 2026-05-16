// src/app/api/proxy/groups/search/route.ts
// GET /api/proxy/groups/search?q=X
// Searches Roblox groups by keyword.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: true, message: "Missing required param: q" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { data } = await axios.get(
      "https://groups.roblox.com/v1/groups/search",
      { params: { keyword: q, limit: 25 } }
    );

    return NextResponse.json(
      {
        data:           data?.data ?? [],
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
