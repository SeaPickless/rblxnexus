import { NextRequest, NextResponse } from "next/server";
import { clearRobloxSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const redirectBase = process.env.NEXTAUTH_URL ?? "https://rblxnexus.vercel.app";
  const response = NextResponse.json({ success: true });
  await clearRobloxSession(response);
  return response;
}

export async function GET(req: NextRequest) {
  const redirectBase = process.env.NEXTAUTH_URL ?? "https://rblxnexus.vercel.app";
  const response = NextResponse.redirect(`${redirectBase}/`);
  await clearRobloxSession(response);
  return response;
}