import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, authorizedProcedure } from "../../trpc";
import { prisma } from "@conectavet/db";
import { petCreateSchema, petUpdateSchema } from "../../schemas";

export const petRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.pet.findMany({
      where: { ownerId: ctx.session.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }),

  byId: protectedProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ ctx, input }) => {
    const pet = await prisma.pet.findFirst({
      where: { id: input.id, deletedAt: null, ownerId: ctx.session.id },
    });
    if (!pet) throw new TRPCError({ code: "NOT_FOUND", message: "Mascota no encontrada" });
    return pet;
  }),

  create: protectedProcedure.input(petCreateSchema).mutation(async ({ ctx, input }) => {
    return prisma.pet.create({ data: { ...input, ownerId: ctx.session.id } });
  }),

  update: protectedProcedure.input(z.object({ id: z.string().cuid(), data: petUpdateSchema }))
    .mutation(async ({ ctx, input }) => {
      const pet = await prisma.pet.findFirst({ where: { id: input.id, ownerId: ctx.session.id, deletedAt: null } });
      if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.pet.update({ where: { id: input.id }, data: input.data });
    }),

  // Soft delete
  remove: protectedProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    const pet = await prisma.pet.findFirst({ where: { id: input.id, ownerId: ctx.session.id, deletedAt: null } });
    if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
    await prisma.pet.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
    return { success: true };
  }),

  // Restaurar una mascota soft-deleted (solo el dueño, dentro de 30 días)
  restore: protectedProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    const pet = await prisma.pet.findFirst({
      where: { id: input.id, ownerId: ctx.session.id, deletedAt: { not: null } },
    });
    if (!pet) throw new TRPCError({ code: "NOT_FOUND", message: "Mascota no encontrada en papelera" });
    // Ventana de 30 días para restaurar
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (pet.deletedAt && Date.now() - pet.deletedAt.getTime() > thirtyDays) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Pasaron más de 30 días desde la baja" });
    }
    return prisma.pet.update({ where: { id: input.id }, data: { deletedAt: null } });
  }),

  // Listar mascotas eliminadas (papelera)
  trash: protectedProcedure.query(async ({ ctx }) => {
    return prisma.pet.findMany({
      where: { ownerId: ctx.session.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    });
  }),

  // Hard delete permanente (solo admin)
  purge: authorizedProcedure("ADMIN").input(z.object({ id: z.string().cuid() })).mutation(async ({ input }) => {
    await prisma.pet.delete({ where: { id: input.id } });
    return { success: true };
  }),

  // Vet: mascotas que ya atendió (ADR-010, mínima divulgación)
  managed: authorizedProcedure("VET", "ADMIN").query(async ({ ctx }) => {
    return prisma.pet.findMany({
      where: { consultations: { some: { vetId: ctx.session.id } } },
      orderBy: { updatedAt: "desc" },
    });
  }),
});
