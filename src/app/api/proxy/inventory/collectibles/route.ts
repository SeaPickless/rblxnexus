import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const cursor = searchParams.get('cursor') ?? '';

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const res = await axios.get(
      `https://inventory.roblox.com/v2/users/${userId}/inventory`,
      {
        params: {
          assetTypes:
            'Shirt,Pants,Hat,HairAccessory,FaceAccessory,NeckAccessory,ShoulderAccessory,FrontAccessory,BackAccessory,WaistAccessory',
          limit: 50,
          cursor,
        },
      }
    );

    return NextResponse.json({
      data: res.data?.data ?? [],
      nextPageCursor: res.data?.nextPageCursor ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
