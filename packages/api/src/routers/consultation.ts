import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, authorizedProcedure } from "../trpc";
import { prisma } from "@conectavet/db";
import {
  createConsultationSchema, completeConsultationSchema, sendMessageSchema,
  rateSchema, prescriptionCreateSchema,
} from "../schemas";

export const consultationRouter = createTRPCRouter({
  // Dueño crea consulta para una de sus mascotas → estado WAITING
  create: protectedProcedure.input(createConsultationSchema).mutation(async ({ ctx, input }) => {
    const pet = await prisma.pet.findFirst({
      where: { id: input.petId, ownerId: ctx.session.id, deletedAt: null },
    });
    if (!pet) throw new TRPCError({ code: "NOT_FOUND", message: "Mascota no encontrada" });
    return prisma.consultation.create({
      data: {
        clientId: ctx.session.id,
        petId: input.petId,
        status: "WAITING",
        reason: input.reason,
      },
    });
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return prisma.consultation.findMany({
      where: { clientId: ctx.session.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { pet: true, vet: { select: { id: true, firstName: true, lastName: true } } },
    });
  }),

  history: protectedProcedure.query(async ({ ctx }) => {
    return prisma.consultation.findMany({
      where: { clientId: ctx.session.id, status: "COMPLETED", deletedAt: null },
      orderBy: { endedAt: "desc" },
    });
  }),

  // Vets online aprobados (cola de asignación)
  availableVets: protectedProcedure.query(async () => {
    return prisma.user.findMany({
      where: { role: "VET", vetStatus: "APPROVED", isOnline: true },
      select: { id: true, email: true, firstName: true, lastName: true, specialty: true },
    });
  }),

  byId: protectedProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ ctx, input }) => {
    const c = await prisma.consultation.findFirst({
      where: { id: input.id, deletedAt: null,
        OR: [{ clientId: ctx.session.id }, { vetId: ctx.session.id }] },
      include: {
        pet: true,
        vet: { select: { id: true, firstName: true, lastName: true, specialty: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!c) throw new TRPCError({ code: "NOT_FOUND" });
    return c;
  }),

  // Cola de consultas en espera (vet)
  queue: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.role !== "VET" && ctx.session.role !== "ADMIN") return [];
    return prisma.consultation.findMany({
      where: { status: "WAITING", deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        pet: true,
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }),

  // Consultas activas del vet
  active: protectedProcedure.query(async ({ ctx }) => {
    return prisma.consultation.findMany({
      where: { vetId: ctx.session.id, status: "ACTIVE", deletedAt: null },
      orderBy: { startedAt: "desc" },
      include: { pet: true, client: { select: { id: true, firstName: true, lastName: true } } },
    });
  }),

  // Vet (o admin) toma la consulta → ACTIVE. Auto-asignación si hay vet online.
  assign: authorizedProcedure("VET", "ADMIN").input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const c = await prisma.consultation.findUnique({ where: { id: input.id } });
      if (!c || c.deletedAt) throw new TRPCError({ code: "NOT_FOUND" });
      if (c.status !== "WAITING" && c.status !== "PENDING") {
        throw new TRPCError({ code: "CONFLICT", message: "La consulta ya fue tomada" });
      }
      return prisma.consultation.update({
        where: { id: input.id },
        data: { vetId: ctx.session.id, status: "ACTIVE", startedAt: new Date() },
      });
    }),

  decline: authorizedProcedure("VET", "ADMIN").input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return prisma.consultation.update({
        where: { id: input.id }, data: { status: "WAITING", vetId: null },
      });
    }),

  complete: authorizedProcedure("VET", "ADMIN")
    .input(z.object({ id: z.string().cuid(), data: completeConsultationSchema }))
    .mutation(async ({ input }) => {
      return prisma.consultation.update({
        where: { id: input.id },
        data: { status: "COMPLETED", endedAt: new Date(), notes: input.data.notes },
      });
    }),

  messages: protectedProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ ctx, input }) => {
    const c = await prisma.consultation.findFirst({
      where: { id: input.id, deletedAt: null, OR: [{ clientId: ctx.session.id }, { vetId: ctx.session.id }] },
    });
    if (!c) throw new TRPCError({ code: "FORBIDDEN" });
    return prisma.message.findMany({
      where: { consultationId: input.id, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
  }),

  // Envío de mensaje con dedup por clientMsgId + solo en ACTIVE
  sendMessage: protectedProcedure.input(sendMessageSchema).mutation(async ({ ctx, input }) => {
    const c = await prisma.consultation.findFirst({
      where: { id: input.consultationId, deletedAt: null,
        OR: [{ clientId: ctx.session.id }, { vetId: ctx.session.id }] },
    });
    if (!c) throw new TRPCError({ code: "FORBIDDEN" });
    if (c.status !== "ACTIVE") throw new TRPCError({ code: "CONFLICT", message: "La consulta no está activa" });

    // Dedup durable
    if (input.clientMsgId) {
      const dup = await prisma.message.findUnique({ where: { clientMsgId: input.clientMsgId } });
      if (dup) return { message: dup, duplicated: true };
    }
    const hasContent = !!input.content?.trim();
    const hasAttachment = !!input.attachmentUrl;
    if (!hasContent && !hasAttachment) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Mensaje vacío" });
    }
    const message = await prisma.message.create({
      data: {
        consultationId: input.consultationId, senderId: ctx.session.id,
        content: input.content ?? "", attachmentUrl: input.attachmentUrl, clientMsgId: input.clientMsgId,
      },
    });
    return { message, duplicated: false };
  }),

  prescriptions: protectedProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ ctx, input }) => {
    const c = await prisma.consultation.findFirst({
      where: { id: input.id, deletedAt: null, OR: [{ clientId: ctx.session.id }, { vetId: ctx.session.id }] },
    });
    if (!c) throw new TRPCError({ code: "FORBIDDEN" });
    return prisma.prescription.findMany({ where: { consultationId: input.id } });
  }),

  createPrescription: authorizedProcedure("VET", "ADMIN")
    .input(prescriptionCreateSchema).mutation(async ({ ctx, input }) => {
      const c = await prisma.consultation.findUnique({ where: { id: input.consultationId } });
      if (!c || c.vetId !== ctx.session.id) throw new TRPCError({ code: "FORBIDDEN" });
      return prisma.prescription.create({
        data: {
          consultationId: input.consultationId, vetId: ctx.session.id,
          content: input.content, medication: input.medication, dosage: input.dosage,
          frequency: input.frequency, durationDays: input.durationDays, indications: input.indications,
        },
      });
    }),

  rate: protectedProcedure.input(z.object({ id: z.string().cuid(), data: rateSchema }))
    .mutation(async ({ ctx, input }) => {
      const c = await prisma.consultation.findFirst({ where: { id: input.id, clientId: ctx.session.id, status: "COMPLETED" } });
      if (!c) throw new TRPCError({ code: "FORBIDDEN", message: "Solo podés calificar consultas completadas" });
      if (!c.vetId) throw new TRPCError({ code: "BAD_REQUEST" });
      return prisma.review.upsert({
        where: { consultationId: input.id },
        create: { consultationId: input.id, clientId: ctx.session.id, vetId: c.vetId, rating: input.data.rating, comment: input.data.comment },
        update: { rating: input.data.rating, comment: input.data.comment },
      });
    }),
});
