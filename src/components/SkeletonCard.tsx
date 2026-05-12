// src/components/SkeletonCard.tsx
// Flexible skeleton loader — use while hub data is fetching.
//
// Usage examples:
//   <SkeletonCard />                          — default single card
//   <SkeletonCard lines={3} showAvatar />     — card with avatar + 3 lines
//   <SkeletonCard count={6} grid />           — 6 cards in a CSS grid

interface SkeletonCardProps {
  /** Number of skeleton cards to render (default: 1) */
  count?: number;
  /** Show a circular avatar placeholder at top-left (default: false) */
  showAvatar?: boolean;
  /** Number of text-line shimmer bars (default: 2) */
  lines?: number;
  /** Show a rectangular thumbnail block at top (default: false) */
  showThumb?: boolean;
  /** Wrap cards in a responsive grid (default: false) */
  grid?: boolean;
  /** Extra Tailwind classes on the wrapper */
  className?: string;
}

function SingleSkeleton({
  showAvatar,
  lines = 2,
  showThumb,
}: Pick<SkeletonCardProps, "showAvatar" | "lines" | "showThumb">) {
  return (
    <div className="sk-card" aria-hidden="true">
      {/* Thumbnail */}
      {showThumb && <div className="sk-thumb shimmer" />}

      {/* Header row (avatar + short line) */}
      {showAvatar && (
        <div className="sk-header">
          <div className="sk-avatar shimmer" />
          <div className="sk-line shimmer" style={{ width: "55%", height: "13px" }} />
        </div>
      )}

      {/* Text lines */}
      <div className="sk-lines">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="sk-line shimmer"
            style={{
              width: i === lines - 1 ? "62%" : "100%",
              height: "12px",
            }}
          />
        ))}
      </div>

      <style jsx>{`
        .sk-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }

        /* Shimmer animation */
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .shimmer {
          border-radius: 6px;
          background: linear-gradient(
            90deg,
            var(--elevated) 25%,
            var(--surface)  50%,
            var(--elevated) 75%
          );
          background-size: 800px 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        /* Thumbnail */
        .sk-thumb {
          width: 100%;
          height: 120px;
          border-radius: 8px;
        }

        /* Header row */
        .sk-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sk-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Lines */
        .sk-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sk-line { border-radius: 4px; }
      `}</style>
    </div>
  );
}

export function SkeletonCard({
  count = 1,
  showAvatar = false,
  lines = 2,
  showThumb = false,
  grid = false,
  className = "",
}: SkeletonCardProps) {
  const cards = Array.from({ length: count }, (_, i) => (
    <SingleSkeleton key={i} showAvatar={showAvatar} lines={lines} showThumb={showThumb} />
  ));

  if (grid) {
    return (
      <div
        className={`sk-grid ${className}`}
        aria-label="Loading..."
        aria-busy="true"
      >
        {cards}
        <style jsx>{`
          .sk-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`sk-stack ${className}`}
      aria-label="Loading..."
      aria-busy="true"
    >
      {cards}
      <style jsx>{`
        .sk-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
