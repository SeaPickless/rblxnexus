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
      'https://thumbnails.roblox.com/v1/games/icons',
      {
        params: {
          universeIds: universeId,
          size: '512x512',
          format: 'Png',
        },
      }
    );

    const imageUrl = res.data?.data?.[0]?.imageUrl ?? null;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Game thumbnail not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch game thumbnail' },
      { status: 500 }
    );
  }
}
