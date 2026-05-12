import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ENDPOINTS: Record<string, string> = {
  catalog: 'https://catalog.roblox.com',
  users: 'https://users.roblox.com',
  thumbnails: 'https://thumbnails.roblox.com',
  groups: 'https://groups.roblox.com',
  games: 'https://games.roblox.com',
  economy: 'https://economy.roblox.com',
  presence: 'https://presence.roblox.com',
  badges: 'https://badges.roblox.com',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint || !ENDPOINTS[endpoint]) {
    return NextResponse.json(
      { error: 'Invalid or missing endpoint' },
      { status: 400 }
    );
  }

  const url = ENDPOINTS[endpoint];
  const start = Date.now();

  try {
    const res = await axios.get(url, { timeout: 8000 });
    const ms = Date.now() - start;

    return NextResponse.json({
      endpoint,
      ms,
      ok: true,
      statusCode: res.status,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    const ms = Date.now() - start;
    const statusCode = error?.response?.status ?? null;

    return NextResponse.json({
      endpoint,
      ms: statusCode ? ms : null,
      ok: false,
      statusCode,
      checkedAt: new Date().toISOString(),
    });
  }
}
