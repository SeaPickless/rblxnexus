import { NextRequest, NextResponse } from "next/server";
import { getIronSession, IronSession } from "iron-session";

export interface RobloxSessionData {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  userId: string;
  username: string;
  displayName: string;
  picture: string | null;
}

const SESSION_OPTIONS = {
  cookieName: "rblxnexus_roblox_session",
  password: process.env.NEXTAUTH_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

/**
 * Save Roblox session to encrypted httpOnly cookie
 */
export async function saveRobloxSession(
  res: NextResponse,
  data: RobloxSessionData
): Promise<void> {
  // iron-session works with IncomingMessage/ServerResponse shape
  // For App Router we manually set the Set-Cookie header via iron-session's
  // sealData + cookie approach using jose under the hood.
  // We use a lightweight manual approach compatible with Next.js App Router:
  const { sealData } = await import("iron-session");
  const sealed = await sealData(data, {
    password: SESSION_OPTIONS.password,
    ttl: SESSION_OPTIONS.cookieOptions.maxAge,
  });

  res.cookies.set(SESSION_OPTIONS.cookieName, sealed, {
    httpOnly: true,
    secure: SESSION_OPTIONS.cookieOptions.secure,
    sameSite: SESSION_OPTIONS.cookieOptions.sameSite,
    maxAge: SESSION_OPTIONS.cookieOptions.maxAge,
    path: "/",
  });
}

/**
 * Read and decrypt the Roblox session from the request cookie
 */
export async function getRobloxSession(
  req: NextRequest
): Promise<RobloxSessionData | null> {
  const cookie = req.cookies.get(SESSION_OPTIONS.cookieName)?.value;
  if (!cookie) return null;

  try {
    const { unsealData } = await import("iron-session");
    const data = await unsealData<RobloxSessionData>(cookie, {
      password: SESSION_OPTIONS.password,
    });
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Clear the Roblox session cookie
 */
export async function clearRobloxSession(res: NextResponse): Promise<void> {
  res.cookies.set(SESSION_OPTIONS.cookieName, "", {
    httpOnly: true,
    secure: SESSION_OPTIONS.cookieOptions.secure,
    sameSite: SESSION_OPTIONS.cookieOptions.sameSite,
    maxAge: 0,
    path: "/",
  });
}

/**
 * Check if a session token is expired
 */
export function isSessionExpired(session: RobloxSessionData): boolean {
  return Date.now() >= session.expiresAt;
}