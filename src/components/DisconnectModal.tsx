'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AlertTriangle } from 'lucide-react';

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOCAL_STORAGE_KEYS = [
  'rn_theme',
  'rn_toggles',
  'rn_watchlist',
  'rn_bookmarks',
  'rn_ping_log',
  'rn_auto_refresh',
];

export default function DisconnectModal({ isOpen, onClose }: DisconnectModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      // 1. Clear Roblox session
      await fetch('/api/auth/roblox/signout', { method: 'POST' });

      // 2. Clear localStorage
      LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

      // 3. Sign out Google session and redirect
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Disconnect error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-xl"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-white text-center">Are you sure you want to disconnect?</h2>

        {/* Description */}
        <p className="text-sm text-gray-400 text-center">
          This will sign you out of both your Google and Roblox accounts on RblxNexus. You can reconnect at any time.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Disconnecting...' : 'Yes, Disconnect'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-gray-300 font-semibold text-sm hover:text-white transition-colors"
            style={{ background: 'var(--color-elevated)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
