// src/app/api/proxy/friends/route.ts
// GET /api/proxy/friends?userId=X
// Returns array of friend objects for a user.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();

  if (!userId || isNaN(Number(userId))) {
    return NextResponse.json(
      { error: true, message: "Missing or invalid param: userId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { data } = await axios.get(
      `https://friends.roblox.com/v1/users/${userId}/friends`
    );

    return NextResponse.json(
      data?.data ?? [],
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
