import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');
  const cursor = searchParams.get('cursor') ?? '';

  if (!groupId) {
    return NextResponse.json(
      { error: 'groupId is required' },
      { status: 400 }
    );
  }

  try {
    const res = await axios.get(
      `https://groups.roblox.com/v1/groups/${groupId}/users`,
      { params: { limit: 50, cursor } }
    );

    return NextResponse.json({
      data: res.data?.data ?? [],
      nextPageCursor: res.data?.nextPageCursor ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    );
  }
}
