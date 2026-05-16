// src/components/Toast.tsx
// Sci-fi animations applied:
//  ✓ Neon flicker — toast border briefly flickers on appear
//  ✓ Glow breathe — success/error glow pulses while toast is visible

import toast from "react-hot-toast";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import React from "react";

function baseStyle(extraBorder?: string, extraShadow?: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "var(--color-elevated)",
    color: "var(--color-text-primary)",
    border: extraBorder ?? "1px solid rgba(var(--color-accent-rgb),0.5)",
    borderRadius: "6px",
    fontFamily: "var(--font-rajdhani),sans-serif",
    fontSize: "14px",
    letterSpacing: "0.04em",
    padding: "10px 14px",
    boxShadow: extraShadow ?? "0 0 16px rgba(var(--color-accent-rgb),0.25), 0 0 32px rgba(var(--color-accent-rgb),0.08)",
    maxWidth: "360px",
    animation: "neon-flicker-box 6s ease-in-out 1",
  };
}

export function toastSuccess(message: string) {
  return toast.custom(
    () => (
      <div style={baseStyle()}>
        <CheckCircle size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </div>
    ),
    { duration: 3000 }
  );
}

export function toastError(message: string) {
  return toast.custom(
    () => (
      <div style={baseStyle(
        "1px solid rgba(239,68,68,0.55)",
        "0 0 16px rgba(239,68,68,0.3), 0 0 32px rgba(239,68,68,0.1)"
      )}>
        <XCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </div>
    ),
    { duration: 3000 }
  );
}

export function toastWarning(message: string) {
  return toast.custom(
    () => (
      <div style={baseStyle(
        "1px solid rgba(234,179,8,0.5)",
        "0 0 16px rgba(234,179,8,0.25)"
      )}>
        <AlertTriangle size={16} color="#EAB308" style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </div>
    ),
    { duration: 3000 }
  );
}

export function toastInfo(message: string) {
  return toast.custom(
    () => (
      <div style={baseStyle()}>
        <Info size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </div>
    ),
    { duration: 3000 }
  );
}

export function toastLoading(message: string) {
  return toast.custom(
    () => (
      <div style={baseStyle()}>
        <Loader2
          size={16}
          color="var(--color-accent)"
          style={{ flexShrink: 0, animation: "spin 1s linear infinite" }}
        />
        <span>{message}</span>
      </div>
    ),
    { duration: Infinity }
  );
}

export { toast };
