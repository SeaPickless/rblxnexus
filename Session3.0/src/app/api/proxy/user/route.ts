// src/app/api/proxy/user/route.ts
// GET /api/proxy/user?username=X
// Resolves a Roblox username to { id, name, displayName }
// SERVER-SIDE ONLY — browser never calls roblox.com directly.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: true, message: "Missing required param: username" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { data } = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      { usernames: [username], excludeBannedUsers: false },
      { headers: { "Content-Type": "application/json" } }
    );

    const user = data?.data?.[0];

    if (!user) {
      return NextResponse.json(
        { error: true, message: `User "${username}" not found.` },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { id: user.id, name: user.name, displayName: user.displayName },
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
