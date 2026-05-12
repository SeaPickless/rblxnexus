import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');

  if (!groupId) {
    return NextResponse.json(
      { error: 'groupId is required' },
      { status: 400 }
    );
  }

  try {
    const res = await axios.get(
      `https://groups.roblox.com/v1/groups/${groupId}/roles`
    );

    return NextResponse.json(res.data?.roles ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch group roles' },
      { status: 500 }
    );
  }
}
