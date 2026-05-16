// src/app/api/proxy/presence/route.ts
// GET /api/proxy/presence?userIds=X,Y,Z
// Returns array of presence objects for given user IDs.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("userIds")?.trim();

  if (!raw) {
    return NextResponse.json(
      { error: true, message: "Missing required param: userIds" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const userIds = raw
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => !isNaN(id) && id > 0);

  if (userIds.length === 0) {
    return NextResponse.json(
      { error: true, message: "No valid userIds provided." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { data } = await axios.post(
      "https://presence.roblox.com/v1/presence/users",
      { userIds },
      { headers: { "Content-Type": "application/json" } }
    );

    return NextResponse.json(
      data?.userPresences ?? [],
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
