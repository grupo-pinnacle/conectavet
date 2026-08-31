import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@conectavet/db";
import { verifyCredentials } from "../services/auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        let user;
        try {
          user = await verifyCredentials({ email: creds.email, password: creds.password });
        } catch {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          vetStatus: user.vetStatus,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    // Revocación global: si tokenVersion cambió (logout en otro lado), fuerza re-login.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.vetStatus = user.vetStatus;
        token.tokenVersion = user.tokenVersion;
      } else {
        const db = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (!db || db.tokenVersion !== (token.tokenVersion as number)) {
          return {}; // sesión revocada
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id) return { ...session, user: undefined };
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as "CLIENT" | "VET" | "ADMIN",
        vetStatus: token.vetStatus as "PENDING" | "APPROVED",
        tokenVersion: token.tokenVersion as number,
      };
      return session;
    },
  },
  pages: { signIn: "/login" },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: "CLIENT" | "VET" | "ADMIN";
      vetStatus: "PENDING" | "APPROVED";
      tokenVersion: number;
    };
  }
  interface User {
    id: string;
    email: string;
    role: "CLIENT" | "VET" | "ADMIN";
    vetStatus: "PENDING" | "APPROVED";
    tokenVersion: number;
  }
  interface JWT {
    id: string;
    role: "CLIENT" | "VET" | "ADMIN";
    vetStatus: "PENDING" | "APPROVED";
    tokenVersion: number;
  }
}
