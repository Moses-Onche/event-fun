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

        // Checked only after the password is correct, so this message can't be used
        // to discover which emails have accounts.
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Linking by email is safe here because the signIn callback below only lets
            // Google through when Google says the email is verified, and it strips the
            // password from any account whose email was never verified (see there).
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return true;
      const email = user.email.toLowerCase();

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, isActive: true, emailVerified: true, passwordHash: true },
      });
      // Block suspended users from signing in with Google too.
      if (existing && !existing.isActive) return false;

      if (account?.provider === "google") {
        // Only trust Google's email when Google itself says it is verified.
        const googleProfile = profile as unknown as { email_verified?: boolean } | undefined;
        if (!googleProfile?.email_verified) return false;

        // This runs before the account is linked. If a password account exists for this
        // email but its owner never proved the email, someone else may have registered
        // it first. The real owner just proved it via Google, so drop the unproven
        // password and force every old session to end.
        if (existing && !existing.emailVerified) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              emailVerified: new Date(),
              passwordHash: null,
              passwordChangedAt: new Date(),
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.authAt = Date.now();
      }
      if (token.id) {
        // Refresh role/active flag so admin changes take effect quickly.
        const db = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isActive: true, passwordChangedAt: true },
        });
        token.role = db?.role ?? "ATTENDEE";
        token.active = db?.isActive ?? false;

        // A password reset signs out every session that began before it.
        if (db?.passwordChangedAt && (token.authAt ?? 0) < db.passwordChangedAt.getTime()) {
          token.active = false;
        }
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
