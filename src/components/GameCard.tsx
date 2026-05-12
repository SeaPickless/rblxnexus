'use client';

import Image from 'next/image';
import { Users, Eye, ThumbsUp } from 'lucide-react';

interface GameCardProps {
  thumbnailUrl: string | null;
  name: string;
  creator: string;
  activePlayers: number;
  totalVisits: number;
  likes: number;
  dislikes: number;
  onClick?: () => void;
}

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export default function GameCard({
  thumbnailUrl,
  name,
  creator,
  activePlayers,
  totalVisits,
  likes,
  dislikes,
  onClick,
}: GameCardProps) {
  const total = likes + dislikes;
  const likeRatio = total > 0 ? Math.round((likes / total) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="rounded-xl overflow-hidden cursor-pointer hover:ring-2 transition-all"
      style={{
        background: 'var(--color-surface)',
        ['--tw-ring-color' as string]: 'var(--color-accent)',
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-40 bg-gray-800">
        {thumbnailUrl ? (
          <Image src={thumbnailUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-bold text-white truncate">{name}</h3>
        <p className="text-xs text-gray-400 truncate">by {creator}</p>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <Users size={11} />
            {formatNumber(activePlayers)}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {formatNumber(totalVisits)}
          </span>
        </div>

        {/* Like ratio bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ThumbsUp size={11} /> {likeRatio}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${likeRatio}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
