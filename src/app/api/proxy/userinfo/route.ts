import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const res = await axios.get(
      `https://users.roblox.com/v1/users/${userId}`
    );

    const u = res.data;

    return NextResponse.json({
      id: u.id,
      name: u.name,
      displayName: u.displayName,
      description: u.description,
      created: u.created,
      isBanned: u.isBanned,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    );
  }
}
