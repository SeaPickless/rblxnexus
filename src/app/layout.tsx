import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Toast } from "@/components/Toast";
import { ThemeScript } from "@/lib/theme";
import { SessionProvider } from "next-auth/react";

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
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} rblx-body`}>
        <SessionProvider>
          <Toast />
          <div className="rblx-shell">
            <Sidebar />
            <div className="rblx-main-col">
              <Topbar />
              <main className="rblx-content">{children}</main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
