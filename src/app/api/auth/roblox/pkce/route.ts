import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { state, codeVerifier } = await req.json();

    if (!state || !codeVerifier) {
      return NextResponse.json({ error: "Missing state or codeVerifier" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set("roblox_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes — enough for auth flow
      path: "/",
    });

    res.cookies.set("roblox_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}