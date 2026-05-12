import { NextRequest, NextResponse } from "next/server";
import { getRobloxSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getRobloxSession(req);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Roblox userinfo" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[roblox/userinfo]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}