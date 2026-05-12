import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  try {
    const res = await axios.get(
      'https://groups.roblox.com/v1/groups/search',
      { params: { keyword: q, limit: 25 } }
    );

    return NextResponse.json(res.data?.data ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search groups' },
      { status: 500 }
    );
  }
}
