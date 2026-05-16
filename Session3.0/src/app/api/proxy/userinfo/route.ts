// src/app/api/proxy/userinfo/route.ts
// GET /api/proxy/userinfo?userId=X
// Returns full user profile: { id, name, displayName, description, created, isBanned }
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
      `https://users.roblox.com/v1/users/${userId}`
    );

    return NextResponse.json(
      {
        id:          data.id,
        name:        data.name,
        displayName: data.displayName,
        description: data.description ?? "",
        created:     data.created,
        isBanned:    data.isBanned ?? false,
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
