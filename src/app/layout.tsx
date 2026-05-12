// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Toast } from "@/components/Toast";
import { ThemeScript } from "@/lib/theme.tsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rblx Nexus — Your Roblox command center.",
  description:
    "RblxNexus — Your Roblox command center. Everything you need, right where you need it.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        ThemeScript injects a tiny inline <script> that reads rn_theme and
        rn_toggles from localStorage and sets data-theme + body classes
        BEFORE the first paint — preventing any flash of wrong theme.
      */}
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} rblx-body`}>
        {/* Toast portal — rendered above everything */}
        <Toast />

        {/* App shell: sidebar + main column */}
        <div className="rblx-shell">
          <Sidebar />

          <div className="rblx-main-col">
            <Topbar />

            {/* Page content */}
            <main className="rblx-content">{children}</main>
          </div>
        </div>

        {/*
          Global layout styles live in globals.css (Tailwind base +
          CSS custom properties for every theme).  The classes below
          are defined there rather than as inline Tailwind utilities so
          that the theme CSS-variable system can reach them easily.
        */}
      </body>
    </html>
  );
}