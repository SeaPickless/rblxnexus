"use client";

// src/components/Toast.tsx
// Thin wrapper around react-hot-toast that applies RblxNexus theme variables.
// Drop this once into layout.tsx — no other setup needed.
// Usage anywhere in the app:
//   import toast from "react-hot-toast";
//   toast.success("Done!") / toast.error("Failed") / toast("Info")

import { Toaster } from "react-hot-toast";

export function Toast() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default auto-dismiss: 3 seconds
        duration: 3000,

        // Base styles applied to every toast
        style: {
          background:  "var(--elevated)",
          color:       "var(--text-primary)",
          border:      "1px solid var(--border)",
          borderRadius:"10px",
          fontSize:    "13.5px",
          fontWeight:  "500",
          boxShadow:   "var(--shadow)",
          padding:     "10px 14px",
          maxWidth:    "340px",
        },

        // Success toasts — green left border
        success: {
          duration: 3000,
          iconTheme: {
            primary:   "#22C55E",
            secondary: "var(--elevated)",
          },
          style: {
            background:   "var(--elevated)",
            color:        "var(--text-primary)",
            border:       "1px solid var(--border)",
            borderLeft:   "3px solid #22C55E",
            borderRadius: "10px",
            fontSize:     "13.5px",
            fontWeight:   "500",
            boxShadow:    "var(--shadow)",
            padding:      "10px 14px",
          },
        },

        // Error toasts — red left border
        error: {
          duration: 4000,
          iconTheme: {
            primary:   "#EF4444",
            secondary: "var(--elevated)",
          },
          style: {
            background:   "var(--elevated)",
            color:        "var(--text-primary)",
            border:       "1px solid var(--border)",
            borderLeft:   "3px solid #EF4444",
            borderRadius: "10px",
            fontSize:     "13.5px",
            fontWeight:   "500",
            boxShadow:    "var(--shadow)",
            padding:      "10px 14px",
          },
        },

        // Loading toasts (used with toast.promise)
        loading: {
          iconTheme: {
            primary:   "var(--accent)",
            secondary: "var(--elevated)",
          },
          style: {
            background:   "var(--elevated)",
            color:        "var(--text-secondary)",
            border:       "1px solid var(--border)",
            borderLeft:   "3px solid var(--accent)",
            borderRadius: "10px",
            fontSize:     "13.5px",
            fontWeight:   "500",
            boxShadow:    "var(--shadow)",
            padding:      "10px 14px",
          },
        },
      }}
    />
  );
}
