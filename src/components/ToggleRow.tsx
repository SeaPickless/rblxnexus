'use client';

import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface ToggleRowProps {
  icon: LucideIcon;
  name: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function ToggleRow({ icon: Icon, name, description, value, onChange }: ToggleRowProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--color-elevated)' }}
      >
        <Icon size={18} style={{ color: 'var(--color-accent)' }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>

      {/* Toggle switch */}
      <button
        onClick={() => onChange(!value)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
          value ? 'bg-[var(--color-accent)]' : 'bg-gray-600'
        )}
        aria-checked={value}
        role="switch"
      >
        <span
          className={clsx(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
            value ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
