import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@conectavet/db";
import type { Role } from "./auth/roles";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  vetStatus: "PENDING" | "APPROVED";
  tokenVersion: number;
}

export interface TRPCContextOpts {
  headers: Headers;
  session?: SessionUser;
}

export async function createTRPCContext(opts: TRPCContextOpts) {
  return { prisma, session: opts.session, headers: opts.headers };
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
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

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
  }
  return next({ ctx: { session: ctx.session } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

export function authorizedProcedure(...roles: Role[]) {
  return t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (ctx.session.role !== "ADMIN" && !roles.includes(ctx.session.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Sin permiso" });
    }
    return next({ ctx: { session: ctx.session } });
  });
}
