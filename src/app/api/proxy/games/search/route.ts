import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const genre = searchParams.get('genre') ?? '';
  const sort = searchParams.get('sort') ?? '';

  try {
    const res = await axios.get(
      'https://games.roblox.com/v1/games/list',
      {
        params: {
          keyword: q,
          genre,
          sortToken: sort,
        },
      }
    );

    return NextResponse.json(res.data ?? { games: [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    );
  }
}
