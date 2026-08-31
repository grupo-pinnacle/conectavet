import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { z } from "zod";
import { prisma } from "@conectavet/db";
import { pushTokenSchema } from "../../schemas";

export const notificationRouter = createTRPCRouter({
  registerToken: protectedProcedure.input(pushTokenSchema).mutation(async ({ ctx, input }) => {
    await prisma.pushToken.upsert({
      where: { token: input.token },
      create: { userId: ctx.session.id, token: input.token, platform: input.platform },
      update: { userId: ctx.session.id, platform: input.platform },
    });
    return { success: true };
  }),

  unregisterToken: protectedProcedure.input(z.object({ token: z.string() })).mutation(async ({ ctx, input }) => {
    await prisma.pushToken.deleteMany({ where: { token: input.token, userId: ctx.session.id } });
    return { success: true };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const items = await prisma.notification.findMany({
      where: { userId: ctx.session.id },
      orderBy: { createdAt: "desc" },
    });
    const unreadCount = await prisma.notification.count({ where: { userId: ctx.session.id, readAt: null } });
    return { items, unreadCount };
  }),

  markRead: protectedProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    const n = await prisma.notification.findFirst({ where: { id: input.id, userId: ctx.session.id } });
    if (!n) return { success: false };
    await prisma.notification.update({ where: { id: input.id }, data: { readAt: new Date() } });
    return { success: true };
  }),
});
