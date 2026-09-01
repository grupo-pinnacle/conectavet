import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { prisma } from "@conectavet/db";
import { registerSchema, loginSchema } from "../schemas";

const SALT_ROUNDS = 10;

export async function register(input: { email: string; password: string; role?: "CLIENT" | "VET"; firstName?: string; lastName?: string }) {
  const data = registerSchema.parse(input);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new TRPCError({ code: "CONFLICT", message: "El email ya está registrado" });
  }
  const password = await bcrypt.hash(data.password, SALT_ROUNDS);
  // ADR-009: auto-registro VET queda PENDING hasta aprobación de ADMIN.
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      vetStatus: data.role === "VET" ? "PENDING" : "APPROVED",
    },
    select: { id: true, email: true, role: true, vetStatus: true, tokenVersion: true },
  });
  return user;
}

export async function verifyCredentials(input: { email: string; password: string }) {
  const data = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciales inválidas" });
  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciales inválidas" });
  return user;
}

// Logout: sube tokenVersion → revoca TODOS los JWT/refresh emitidos antes.
export async function revokeSessions(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
}