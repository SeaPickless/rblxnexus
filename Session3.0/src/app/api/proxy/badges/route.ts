// src/app/api/proxy/badges/route.ts
// GET /api/proxy/badges?userId=X
// Returns up to 100 badges earned by a user.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();
  const cursor = req.nextUrl.searchParams.get("cursor")?.trim() ?? "";

  if (!userId || isNaN(Number(userId))) {
    return NextResponse.json(
      { error: true, message: "Missing or invalid param: userId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const params: Record<string, string> = { limit: "100", sortOrder: "Desc" };
    if (cursor) params.cursor = cursor;

    const { data } = await axios.get(
      `https://badges.roblox.com/v1/users/${userId}/badges`,
      { params }
    );

    return NextResponse.json(
      {
        data:               data?.data ?? [],
        nextPageCursor:     data?.nextPageCursor ?? null,
        previousPageCursor: data?.previousPageCursor ?? null,
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
