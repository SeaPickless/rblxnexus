import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const myId = searchParams.get('myId');
  const targetId = searchParams.get('targetId');

  if (!myId || !targetId) {
    return NextResponse.json(
      { error: 'myId and targetId are required' },
      { status: 400 }
    );
  }

  try {
    const [myFriendsRes, targetFriendsRes] = await Promise.all([
      axios.get(`https://friends.roblox.com/v1/users/${myId}/friends`),
      axios.get(`https://friends.roblox.com/v1/users/${targetId}/friends`),
    ]);

    const myFriends: { id: number }[] = myFriendsRes.data?.data ?? [];
    const targetFriends: { id: number }[] = targetFriendsRes.data?.data ?? [];

    const myFriendIds = new Set(myFriends.map((f) => f.id));
    const mutuals = targetFriends.filter((f) => myFriendIds.has(f.id));

    return NextResponse.json({ mutuals });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch mutuals' },
      { status: 500 }
    );
  }
}
