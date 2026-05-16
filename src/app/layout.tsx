// src/app/layout.tsx
// Root layout — wraps entire app in SessionProvider so useSession()
// works on the login page. Hub pages get their OWN SessionProvider
// inside src/app/hub/layout.tsx.

import type { Metadata } from "next";
import { Orbitron, Rajdhani, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RblxNexus — Your Roblox Command Center",
  description: "RblxNexus is a futuristic Roblox command center.",
  icons: { icon: "/favicon.ico" },
};

const themeInitScript = `
(function(){
  try{
    var VALID=["nexus-dark","midnight-blue","cyber-green","sunset-red","oled-black","light-mode"];
    var saved=localStorage.getItem("rn_theme");
    var theme=VALID.includes(saved)?saved:"nexus-dark";
    document.documentElement.setAttribute("data-theme",theme);
    var raw=localStorage.getItem("rn_toggles");
    if(raw){
      var t=JSON.parse(raw);
      if(t.disableAnimations) document.body.classList.add("no-animations");
      if(t.compactSidebar)    document.body.classList.add("compact-sidebar");
    }
  }catch(_){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`
          ${orbitron.variable} ${rajdhani.variable} ${jetbrainsMono.variable}
          font-rajdhani bg-[var(--color-base)] text-[var(--color-text-primary)]
          antialiased min-h-screen overflow-x-hidden
        `}
      >
        {/* Scanline overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[9998]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(var(--color-accent-rgb),0.015) 2px,rgba(var(--color-accent-rgb),0.015) 4px)",
          }}
        />
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-0 right-0 z-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3"
          style={{
            background: "radial-gradient(circle,rgba(var(--color-accent-rgb),0.07) 0%,transparent 70%)",
          }}
        />

        <SessionProvider>
          <div className="relative z-10">{children}</div>
        </SessionProvider>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background:    "var(--color-elevated)",
              color:         "var(--color-text-primary)",
              border:        "1px solid rgba(var(--color-accent-rgb),0.4)",
              borderRadius:  "6px",
              fontFamily:    "var(--font-rajdhani),sans-serif",
              fontSize:      "14px",
              letterSpacing: "0.03em",
              boxShadow:     "0 0 16px rgba(var(--color-accent-rgb),0.2)",
            },
          }}
        />
      </body>
    </html>
  );
}
