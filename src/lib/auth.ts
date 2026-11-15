import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Deliberately NOT linking Google to existing email/password accounts:
            // emails from password signup are unverified, so auto-linking would let
            // someone pre-register a victim's email and keep access after they sign in.
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      // Block suspended users from signing in with Google too.
      if (user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { isActive: true },
        });
        if (existing && !existing.isActive) return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      if (token.id) {
        // Refresh role/active flag so admin changes take effect quickly.
        const db = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isActive: true },
        });
        token.role = db?.role ?? "ATTENDEE";
        token.active = db?.isActive ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ATTENDEE" | "ORGANIZER" | "ADMIN";
        session.user.active = Boolean(token.active);
      }
      return session;
    },
  },
};
