import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }
      if (token.googleId) {
        const user = await prisma.user.findUnique({
          where: { googleId: token.googleId },
          select: { username: true },
        });
        if (user) {
          token.username = user.username;
          token.needsUsername = false;
        } else {
          token.username = null;
          token.needsUsername = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.googleId = token.googleId;
      session.user.username = token.username ?? null;
      session.user.needsUsername = token.needsUsername ?? false;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
