'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accentColor?: string;
}

export default function StatCard({ label, value, icon: Icon, accentColor }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: 'var(--color-surface)' }}
    >
      {Icon && (
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accentColor ? `${accentColor}22` : 'var(--color-elevated)' }}
        >
          <Icon size={18} style={{ color: accentColor ?? 'var(--color-accent)' }} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-400 truncate">{label}</p>
        <p className="text-base font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}
