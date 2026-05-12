'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ExternalLink, Lock, Globe } from 'lucide-react';

interface GroupCardProps {
  iconUrl: string | null;
  name: string;
  memberCount: number;
  ownerUsername: string;
  ownerAvatarUrl?: string | null;
  description?: string;
  isPublic: boolean;
  shout?: {
    body: string;
    poster: { username: string };
    created: string;
  } | null;
  groupId: number;
}

export default function GroupCard({
  iconUrl,
  name,
  memberCount,
  ownerUsername,
  ownerAvatarUrl,
  description,
  isPublic,
  shout,
  groupId,
}: GroupCardProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
          {iconUrl ? (
            <Image src={iconUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white truncate">{name}</h2>
            <span
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-elevated)', color: isPublic ? '#22c55e' : '#9ca3af' }}
            >
              {isPublic ? <Globe size={11} /> : <Lock size={11} />}
              {isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          <p className="text-sm text-gray-400">{memberCount.toLocaleString()} members</p>
        </div>
      </div>

      {/* Owner */}
      <div className="flex items-center gap-2">
        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
          {ownerAvatarUrl ? (
            <Image src={ownerAvatarUrl} alt={ownerUsername} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-white">
              {ownerUsername.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-400">Owner: <span className="text-white">@{ownerUsername}</span></p>
      </div>

      {/* Description */}
      {description && (
        <div>
          <p className={`text-sm text-gray-300 whitespace-pre-wrap ${!descExpanded ? 'line-clamp-3' : ''}`}>
            {description}
          </p>
          {description.length > 100 && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-xs mt-1"
              style={{ color: 'var(--color-accent)' }}
            >
              {descExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Shout */}
      {shout && (
        <div className="rounded-lg p-3 space-y-1" style={{ background: 'var(--color-elevated)' }}>
          <p className="text-xs text-gray-400 font-semibold">📢 Shout by @{shout.poster.username}</p>
          <p className="text-sm text-gray-200">{shout.body}</p>
          <p className="text-xs text-gray-500">
            {new Date(shout.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* View on Roblox */}
      <a
        href={`https://www.roblox.com/groups/${groupId}`}
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
