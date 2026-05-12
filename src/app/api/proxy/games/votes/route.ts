import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const universeId = searchParams.get('universeId');

  if (!universeId) {
    return NextResponse.json(
      { error: 'universeId is required' },
      { status: 400 }
    );
  }

  try {
    const res = await axios.get(
      'https://games.roblox.com/v1/games/votes',
      { params: { universeIds: universeId } }
    );

    const votes = res.data?.data?.[0];

    if (!votes) {
      return NextResponse.json(
        { error: 'Votes not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(votes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch game votes' },
      { status: 500 }
    );
  }
}
