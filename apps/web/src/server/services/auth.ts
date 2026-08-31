import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@conectavet/db";
import { registerSchema, loginSchema } from "../schemas";

const SALT_ROUNDS = 10;

export async function register(input: z.infer<typeof registerSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new TRPCError({ code: "CONFLICT", message: "El email ya está registrado" });
  }
  const password = await bcrypt.hash(input.password, SALT_ROUNDS);
  // ADR-009: auto-registro VET queda PENDING hasta aprobación de ADMIN.
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role, // CLIENT | VET (ADMIN nunca por registro)
      vetStatus: input.role === "VET" ? "PENDING" : "APPROVED",
    },
    select: { id: true, email: true, role: true, vetStatus: true, tokenVersion: true },
  });
  return user;
}

export async function verifyCredentials(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciales inválidas" });
  const ok = await bcrypt.compare(input.password, user.password);
  if (!ok) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciales inválidas" });
  return user;
}

// Logout: sube tokenVersion → revoca TODOS los JWT/refresh emitidos antes.
export async function revokeSessions(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
}
