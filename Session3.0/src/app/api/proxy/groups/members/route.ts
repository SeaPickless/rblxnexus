// src/app/api/proxy/groups/members/route.ts
// GET /api/proxy/groups/members?groupId=X&cursor=X
// Returns paginated group member list (limit 50).
// SERVER-SIDE ONLY.

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const groupId = req.nextUrl.searchParams.get("groupId")?.trim();
  const cursor  = req.nextUrl.searchParams.get("cursor")?.trim() ?? "";

  if (!groupId || isNaN(Number(groupId))) {
    return NextResponse.json(
      { error: true, message: "Missing or invalid param: groupId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const params: Record<string, string> = { limit: "50" };
    if (cursor) params.cursor = cursor;

    const { data } = await axios.get(
      `https://groups.roblox.com/v1/groups/${groupId}/users`,
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
