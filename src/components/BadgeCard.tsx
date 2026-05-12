'use client';

import Image from 'next/image';
import { useState } from 'react';

interface BadgeCardProps {
  iconUrl: string | null;
  name: string;
  gameName: string;
  awardedDate: string;
  description?: string;
}

const formatAwardedDate = (iso: string) => {
  const date = new Date(iso);
  return `Awarded ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export default function BadgeCard({
  iconUrl,
  name,
  gameName,
  awardedDate,
  description,
}: BadgeCardProps) {
  const [showDesc, setShowDesc] = useState(false);

  return (
    <div
      className="relative rounded-xl p-3 flex gap-3 items-start cursor-pointer hover:ring-1 transition-all"
      style={{ background: 'var(--color-surface)', ['--tw-ring-color' as string]: 'var(--color-accent)' }}
      onMouseEnter={() => setShowDesc(true)}
      onMouseLeave={() => setShowDesc(false)}
      onTouchStart={() => setShowDesc((v) => !v)}
    >
      {/* Icon */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
        {iconUrl ? (
          <Image src={iconUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">?</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{name}</p>
        <p className="text-xs text-gray-400 truncate">{gameName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{formatAwardedDate(awardedDate)}</p>
      </div>

      {/* Description tooltip */}
      {showDesc && description && (
        <div
          className="absolute z-10 bottom-full left-0 mb-2 w-60 rounded-lg p-3 text-xs text-gray-200 shadow-lg"
          style={{ background: 'var(--color-elevated)' }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

