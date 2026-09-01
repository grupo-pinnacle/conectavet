import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas";
import { register, verifyCredentials, revokeSessions } from "../services/auth";
import { signMobileToken } from "../services/mobileToken";
import { TRPCError } from "@trpc/server";
import { prisma } from "@conectavet/db";

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerSchema).mutation(async ({ input }) => {
    const user = await register(input);
    return { user };
  }),

  // El login real lo hace NextAuth (Credentials). Este procedimiento valida
  // credenciales para el callback de NextAuth y devuelve el user o error.
  verify: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const { verifyCredentials } = await import("../services/auth");
    const user = await verifyCredentials(input);
    return { id: user.id, email: user.email, role: user.role, vetStatus: user.vetStatus, tokenVersion: user.tokenVersion };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.id },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        bio: true, specialty: true, role: true, vetStatus: true, isOnline: true,
        isEmailVerified: true, createdAt: true,
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await revokeSessions(ctx.session.id);
    return { success: true };
  }),

  // Login para mobile: recibe credenciales, devuelve JWT firmado.
  // Mobile guarda el JWT y lo manda como Authorization: Bearer ...
  mobileLogin: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const user = await verifyCredentials(input);
    const token = signMobileToken({
      id: user.id,
      role: user.role,
      vetStatus: user.vetStatus,
      tokenVersion: user.tokenVersion,
    });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        vetStatus: user.vetStatus,
        tokenVersion: user.tokenVersion,
      },
    };
  }),

  forgotPassword: publicProcedure.input(forgotPasswordSchema).mutation(async ({ input }) => {
    // Best-effort: no revelar si el email existe.
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: crypto.randomUUID(), passwordResetExpires: new Date(Date.now() + 3600_000) },
      });
    }
    return { success: true };
  }),

  resetPassword: publicProcedure.input(resetPasswordSchema).mutation(async ({ input }) => {
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: input.token, passwordResetExpires: { gt: new Date() } },
    });
    if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido o expirado" });
    const bcrypt = await import("bcryptjs");
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(input.password, 10), passwordResetToken: null, passwordResetExpires: null, tokenVersion: { increment: 1 } },
    });
    return { success: true };
  }),
});

// Re-export para tipos si se usa z fuera.
export const _authSchemas = { registerSchema, loginSchema };
void z;
