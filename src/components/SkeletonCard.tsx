// src/components/SkeletonCard.tsx
// Sci-fi animations applied:
//  ✓ Data stream — skeleton lines pulse with staggered timing (feels like data loading)
//  ✓ Scan line   — card has built-in scan line via .rn-card CSS class

interface SkeletonCardProps {
  lines?:      number;
  showAvatar?: boolean;
  showHeader?: boolean;
  className?:  string;
}

export default function SkeletonCard({
  lines      = 3,
  showAvatar = false,
  showHeader = true,
  className  = "",
}: SkeletonCardProps) {
  return (
    <div
      className={`rn-card ${className}`}
      aria-busy="true"
      aria-label="Loading…"
      style={{ pointerEvents: "none" }}
    >
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          {/* Pulse rings on avatar skeleton */}
          <div className="pulse-ring-wrap flex-shrink-0" style={{ borderRadius: "50%" }}>
            <SkeletonCircle size={40} />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <SkeletonLine width="55%" height={12} delay={0} />
            <SkeletonLine width="35%" height={10} delay={150} />
          </div>
        </div>
      )}

      {showHeader && (
        <div className="mb-4">
          <SkeletonLine width="45%" height={14} delay={0} />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            height={10}
            width={i === lines - 1 ? "60%" : `${88 - i * 6}%`}
            delay={i * 80}
          />
        ))}
      </div>
    </div>
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────

export function SkeletonLine({
  width  = "100%",
  height = 10,
  delay  = 0,
}: {
  width?:  string | number;
  height?: number;
  delay?:  number;
}) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: 4,
        // Stagger the pulse animation so lines feel like data streaming in
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return (
    <div
      className="skeleton rounded-full flex-shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonBlock({
  width  = "100%",
  height = 80,
}: {
  width?:  string | number;
  height?: number;
}) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 8 }} />
  );
}
