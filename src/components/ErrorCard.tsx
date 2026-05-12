// src/components/ErrorCard.tsx
// Inline error boundary card — displayed when an API call fails.
// Shows a friendly message + optional retry button.
//
// Usage:
//   <ErrorCard message="Could not load friends list." onRetry={refetch} />
//   <ErrorCard message="Roblox API unavailable." />   ← no retry button

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorCardProps {
  /** Human-readable error description shown to the user */
  message: string;
  /** If provided, renders a Retry button that calls this function */
  onRetry?: () => void;
  /** Optional extra Tailwind classes */
  className?: string;
}

export function ErrorCard({ message, onRetry, className = "" }: ErrorCardProps) {
  return (
    <div className={`ec-wrap ${className}`} role="alert">
      {/* Icon */}
      <div className="ec-icon-wrap">
        <AlertCircle size={22} className="ec-icon" />
      </div>

      {/* Text */}
      <div className="ec-body">
        <p className="ec-title">Something went wrong</p>
        <p className="ec-message">{message}</p>
      </div>

      {/* Retry */}
      {onRetry && (
        <button className="ec-retry" onClick={onRetry} type="button">
          <RefreshCw size={14} />
          Retry
        </button>
      )}

      <style jsx>{`
        .ec-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 10px;
          background: color-mix(in srgb, #EF4444 8%, var(--surface));
          border: 1px solid color-mix(in srgb, #EF4444 30%, transparent);
        }

        .ec-icon-wrap {
          flex-shrink: 0;
        }
        .ec-icon {
          color: #EF4444;
        }

        .ec-body {
          flex: 1 1 auto;
          min-width: 0;
        }
        .ec-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .ec-message {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .ec-retry {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 7px;
          background: var(--elevated);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .ec-retry:hover {
          background: var(--accent-muted);
          color: var(--accent);
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
