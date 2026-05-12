'use client';

import clsx from 'clsx';

interface ThemeCardProps {
  themeKey: string;
  name: string;
  description: string;
  base: string;
  surface: string;
  accent: string;
  isActive: boolean;
  onSelect: (key: string) => void;
}

export default function ThemeCard({
  themeKey,
  name,
  description,
  base,
  surface,
  accent,
  isActive,
  onSelect,
}: ThemeCardProps) {
  return (
    <button
      onClick={() => onSelect(themeKey)}
      className={clsx(
        'rounded-xl p-4 text-left w-full transition-all border-2',
        isActive ? 'border-[var(--color-accent)]' : 'border-transparent'
      )}
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Color swatches */}
      <div className="flex gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg border border-white/10" style={{ background: base }} />
        <div className="w-8 h-8 rounded-lg border border-white/10" style={{ background: surface }} />
        <div className="w-8 h-8 rounded-lg border border-white/10" style={{ background: accent }} />
      </div>

      {/* Name & description */}
      <p className="text-sm font-semibold text-white">{name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>

      {/* Active indicator */}
      {isActive && (
        <p className="text-xs mt-2 font-semibold" style={{ color: accent }}>
          ✓ Active
        </p>
      )}
    </button>
  );
}
