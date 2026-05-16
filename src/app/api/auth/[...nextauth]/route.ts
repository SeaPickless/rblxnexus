// src/app/api/auth/[...nextauth]/route.ts
// NextAuth v4 — Google OAuth only.
// Roblox OAuth is a separate PKCE flow in /api/auth/roblox/*.
// This file NEVER calls any roblox.com URL — CORS safe by design.

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn:  "/",       // redirect unauthenticated users to landing page
    error:   "/",       // auth errors also go back to landing
  },

  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth provider name into the token on first sign-in
      if (account) {
        token.provider    = account.provider;
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose non-sensitive fields to the client session
      (session as { provider?: unknown }).provider = token.provider;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Always redirect to the bootstrap screen after sign-in
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/bootstrap`;
    },
  },
};

const handler = NextAuth(authOptions);

// Next.js App Router requires named exports for each HTTP method
export { handler as GET, handler as POST };
