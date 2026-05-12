'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface UserCardProps {
  avatarUrl: string | null;
  displayName: string;
  username: string;
  userId: number;
  presence?: {
    userPresenceType: number;
    lastLocation?: string;
  };
  joinDate?: string;
  friends?: number;
  followers?: number;
  following?: number;
  bio?: string;
  isBanned?: boolean;
  showUserIds?: boolean;
}

const presenceLabel = (type: number, location?: string) => {
  switch (type) {
    case 0: return { label: 'Offline', color: 'bg-gray-500' };
    case 1: return { label: 'Online', color: 'bg-green-500' };
    case 2: return { label: `In-Game${location ? `: ${location}` : ''}`, color: 'bg-blue-500' };
    case 3: return { label: 'In Studio', color: 'bg-yellow-500' };
    default: return { label: 'Unknown', color: 'bg-gray-500' };
  }
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
  const days = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
  return {
    formatted: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    age: `${years}y ${days}d`,
  };
};

export default function UserCard({
  avatarUrl,
  displayName,
  username,
  userId,
  presence,
  joinDate,
  friends,
  followers,
  following,
  bio,
  isBanned,
  showUserIds,
}: UserCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const presenceInfo = presence ? presenceLabel(presence.userPresenceType, presence.lastLocation) : null;
  const dateInfo = joinDate ? formatDate(joinDate) : null;

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white truncate">{displayName}</h2>
            {isBanned && (
              <span className="flex items-center gap-1 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                <ShieldAlert size={12} /> Banned
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">@{username}</p>
          {showUserIds && <p className="text-xs text-gray-500">ID: {userId}</p>}
        </div>
      </div>

      {/* Presence */}
      {presenceInfo && (
        <div className="flex items-center gap-2">
          <span className={clsx('w-2.5 h-2.5 rounded-full', presenceInfo.color)} />
          <span className="text-sm text-gray-300">{presenceInfo.label}</span>
        </div>
      )}

      {/* Stats */}
      {(friends !== undefined || followers !== undefined || following !== undefined) && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Friends', value: friends },
            { label: 'Followers', value: followers },
            { label: 'Following', value: following },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-2" style={{ background: 'var(--color-elevated)' }}>
              <p className="text-sm font-bold text-white">{value?.toLocaleString() ?? '—'}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Join Date */}
      {dateInfo && (
        <p className="text-xs text-gray-400">
          Joined {dateInfo.formatted} · {dateInfo.age} old
        </p>
      )}

      {/* Bio */}
      {bio && (
        <div>
          <p className={clsx('text-sm text-gray-300 whitespace-pre-wrap', !bioExpanded && 'line-clamp-3')}>
            {bio}
          </p>
          {bio.length > 100 && (
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="text-xs mt-1"
              style={{ color: 'var(--color-accent)' }}
            >
              {bioExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* View on Roblox */}
      <a
        href={`https://www.roblox.com/users/${userId}/profile`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--color-accent)' }}
      >
        View on Roblox <ExternalLink size={14} />
      </a>
    </div>
  );
}
