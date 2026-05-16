"use client";
// src/components/ErrorCard.tsx
// Sci-fi animations applied:
//  ✓ Glitch text  — "ERROR" label glitches
//  ✓ Neon flicker — error border flickers red like a broken neon sign
//  ✓ Scan line    — retry button has scan sweep on hover
//  ✓ Glow breathe — error icon box gently pulses red

import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";

interface ErrorCardProps {
  message?:   string;
  onRetry?:   () => void;
  className?: string;
}

export default function ErrorCard({
  message   = "Something went wrong while loading this section.",
  onRetry,
  className = "",
}: ErrorCardProps) {
  return (
    <div
      className={`rn-card ${className}`}
      style={{
        border: "1px solid rgba(239,68,68,0.45)",
        boxShadow: "0 0 16px rgba(239,68,68,0.1)",
        animation: "error-flicker 7s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes error-flicker {
          0%,17%,19%,21%,51%,53%,100% {
            border-color: rgba(239,68,68,0.45);
            box-shadow: 0 0 16px rgba(239,68,68,0.1);
          }
          18%,20%,52% {
            border-color: rgba(239,68,68,0.1);
            box-shadow: none;
          }
        }
        @keyframes error-icon-breathe {
          0%,100% { box-shadow: 0 0 6px rgba(239,68,68,0.3); }
          50%      { box-shadow: 0 0 18px rgba(239,68,68,0.6), 0 0 32px rgba(239,68,68,0.2); }
        }
      `}</style>

      <div className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          {/* Glow-breathing error icon */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.35)",
              animation: "error-icon-breathe 2.5s ease-in-out infinite",
            }}
          >
            <AlertTriangle size={18} color="#EF4444" />
          </div>

          {/* Glitch "ERROR" label */}
          <span
            className="glitch-text font-orbitron text-xs font-bold uppercase tracking-widest"
            data-text="Error"
            style={{ color: "#EF4444" }}
          >
            Error
          </span>
        </div>

        <p
          className="font-rajdhani text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {message}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="scan-line-host flex items-center gap-2 rounded-md px-4 py-2 transition-all duration-200"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#EF4444",
              fontFamily: "var(--font-orbitron),sans-serif",
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)";
              (e.currentTarget as HTMLElement).style.transform  = "scale(1.03)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
              (e.currentTarget as HTMLElement).style.transform  = "scale(1)";
            }}
          >
            <span className="scan-line" aria-hidden="true" />
            <RefreshCw size={13} style={{ position: "relative", zIndex: 1 }} />
            <span style={{ position: "relative", zIndex: 1 }}>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── React ErrorBoundary ───────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string; }
interface EBProps  {
  children:  React.ReactNode;
  onRetry?:  () => void;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, message: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RblxNexus ErrorBoundary]", error, info);
  }
  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    this.props.onRetry?.();
  };
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <ErrorCard
          message={this.state.message || "An unexpected error occurred."}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
