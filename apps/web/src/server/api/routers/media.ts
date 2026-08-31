import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, authorizedProcedure } from "../../trpc";
import { prisma } from "@conectavet/db";
import { getUploadParamsSchema, confirmUploadSchema } from "../../schemas";
import { generateSignedUploadParams, getDeliveryUrl, getThumbnailUrl, deleteResource } from "../../services/media";

const MediaTypeEnum = z.enum(["image", "video", "raw"]);
type MediaType = z.infer<typeof MediaTypeEnum>;

export const mediaRouter = createTRPCRouter({
  getUploadParams: protectedProcedure.input(getUploadParamsSchema).mutation(async ({ input }) => {
    const params = generateSignedUploadParams(input);
    return params;
  }),

  confirmUpload: protectedProcedure.input(confirmUploadSchema).mutation(async ({ ctx, input }) => {
    const deliveryUrl = getDeliveryUrl(input.publicId, input.type);
    const thumbnailUrl = getThumbnailUrl(input.publicId, input.type);

    let consultationId: string | undefined;
    if (input.context?.startsWith("consultation/")) {
      consultationId = input.context.split("/")[1];
      const c = await prisma.consultation.findFirst({
        where: { id: consultationId, deletedAt: null, OR: [{ clientId: ctx.session.id }, { vetId: ctx.session.id }] },
      });
      if (!c) throw new TRPCError({ code: "FORBIDDEN", message: "Consulta no accesible" });
    }

    // Inferir mimeType/size desde format/bytes o usar defaults
    const mimeType = input.format ? `${input.type}/${input.format}` : "application/octet-stream";
    const size = input.bytes ?? 0;

    const attachment = await prisma.attachment.create({
      data: {
        consultationId,
        publicId: input.publicId,
        type: input.type,
        url: deliveryUrl,
        thumbnailUrl,
        mimeType,
        size,
        width: input.width,
        height: input.height,
        format: input.format,
        bytes: input.bytes,
        uploaderId: ctx.session.id,
      },
    });

    if (consultationId) {
      await prisma.message.create({
        data: {
          consultationId,
          senderId: ctx.session.id,
          content: "",
          attachmentUrl: deliveryUrl,
        },
      });
    }

    return { attachment };
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    const att = await prisma.attachment.findUnique({ where: { id: input.id } });
    if (!att) throw new TRPCError({ code: "NOT_FOUND" });
    if (att.uploaderId !== ctx.session.id && ctx.session.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const type = MediaTypeEnum.parse(att.type); // valida que sea image|video|raw
    await deleteResource(att.publicId, type);
    await prisma.attachment.delete({ where: { id: input.id } });
    return { success: true };
  }),

  byConsultation: protectedProcedure.input(z.object({ consultationId: z.string().cuid() })).query(async ({ ctx, input }) => {
    const c = await prisma.consultation.findFirst({
      where: { id: input.consultationId, deletedAt: null, OR: [{ clientId: ctx.session.id }, { vetId: ctx.session.id }] },
    });
    if (!c) throw new TRPCError({ code: "FORBIDDEN" });
    return prisma.attachment.findMany({ where: { consultationId: input.consultationId }, orderBy: { createdAt: "asc" } });
  }),

  adminList: authorizedProcedure("ADMIN").input(z.object({ limit: z.number().int().positive().default(50), cursor: z.string().optional() }))
    .query(async ({ input }) => {
      return prisma.attachment.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });
    }),
});