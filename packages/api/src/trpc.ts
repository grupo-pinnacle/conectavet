// tRPC init compartido. El context es minimal (solo session) porque
// los routers importan prisma directamente desde @conectavet/db.
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Role } from "./auth/roles";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  vetStatus: "PENDING" | "APPROVED";
  tokenVersion: number;
};

const t = initTRPC.context<{ session?: SessionUser }>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export function authorizedProcedure(...roles: Role[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!roles.includes(ctx.session.role) && ctx.session.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Rol no autorizado" });
    }
    if (ctx.session.role === "VET" && ctx.session.vetStatus !== "APPROVED") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Cuenta de veterinario no aprobada" });
    }
    return next({ ctx });
  });
}