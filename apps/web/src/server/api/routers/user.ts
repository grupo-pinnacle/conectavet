import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, authorizedProcedure } from "../../trpc";
import { prisma } from "@conectavet/db";

export const userRouter = createTRPCRouter({
  // Perfil propio
  updateMe: protectedProcedure
    .input(z.object({
      firstName: z.string().optional(), lastName: z.string().optional(),
      phone: z.string().optional(), bio: z.string().optional(), specialty: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({ where: { id: ctx.session.id }, data: input });
    }),

  // Vet pone online/offline (dispara auto-asignación de cola en consultation.assign)
  setAvailability: authorizedProcedure("VET", "ADMIN")
    .input(z.object({ isOnline: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({ where: { id: ctx.session.id }, data: { isOnline: input.isOnline } });
    }),

  // Lista de veterinarios APROBADOS (respeta vetStatus)
  listVets: protectedProcedure.query(async () => {
    return prisma.user.findMany({
      where: { role: "VET", vetStatus: "APPROVED" },
      select: { id: true, email: true, firstName: true, lastName: true, specialty: true, isOnline: true, bio: true },
    });
  }),

  getVet: protectedProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ input }) => {
    const vet = await prisma.user.findUnique({
      where: { id: input.id },
      select: { id: true, email: true, firstName: true, lastName: true, specialty: true, isOnline: true, bio: true, vetStatus: true },
    });
    if (!vet) throw new TRPCError({ code: "NOT_FOUND" });
    return vet;
  }),

  // Favoritos
  listFavorites: protectedProcedure.query(async ({ ctx }) => {
    return prisma.favoriteVet.findMany({
      where: { clientId: ctx.session.id },
      include: { vet: { select: { id: true, firstName: true, lastName: true, specialty: true, isOnline: true } } },
    });
  }),
  addFavorite: protectedProcedure.input(z.object({ vetId: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    return prisma.favoriteVet.upsert({
      where: { clientId_vetId: { clientId: ctx.session.id, vetId: input.vetId } },
      create: { clientId: ctx.session.id, vetId: input.vetId },
      update: {},
    });
  }),
  removeFavorite: protectedProcedure.input(z.object({ vetId: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    await prisma.favoriteVet.deleteMany({ where: { clientId: ctx.session.id, vetId: input.vetId } });
    return { success: true };
  }),

  // Admin: crear usuario y aprobar vet
  adminCreate: authorizedProcedure("ADMIN").input(z.object({
    email: z.string().email(), password: z.string().min(6), role: z.enum(["CLIENT", "VET", "ADMIN"]),
  })).mutation(async ({ input }) => {
    const bcrypt = await import("bcryptjs");
    return prisma.user.create({
      data: { email: input.email, password: await bcrypt.hash(input.password, 10), role: input.role,
        vetStatus: input.role === "VET" ? "PENDING" : "APPROVED" },
    });
  }),
  approveVet: authorizedProcedure("ADMIN").input(z.object({ id: z.string().cuid() })).mutation(async ({ input }) => {
    return prisma.user.update({ where: { id: input.id }, data: { vetStatus: "APPROVED" } });
  }),
});
