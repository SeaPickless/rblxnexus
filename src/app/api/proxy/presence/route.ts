import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userIdsParam = searchParams.get('userIds');

  if (!userIdsParam) {
    return NextResponse.json(
      { error: 'userIds is required' },
      { status: 400 }
    );
  }

  const userIds = userIdsParam.split(',').map(Number);

  try {
    const res = await axios.post(
      'https://presence.roblox.com/v1/presence/users',
      { userIds },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return NextResponse.json(res.data?.userPresences ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch presence' },
      { status: 500 }
    );
  }
}
