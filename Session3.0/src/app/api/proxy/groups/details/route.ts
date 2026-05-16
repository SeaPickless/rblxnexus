// src/app/api/proxy/groups/details/route.ts
// GET /api/proxy/groups/details?groupId=X
// Returns full group details.
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const groupId = req.nextUrl.searchParams.get("groupId")?.trim();

  if (!groupId || isNaN(Number(groupId))) {
    return NextResponse.json(
      { error: true, message: "Missing or invalid param: groupId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { data } = await axios.get(
      `https://groups.roblox.com/v1/groups/${groupId}`
    );

    return NextResponse.json(
      data,
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
