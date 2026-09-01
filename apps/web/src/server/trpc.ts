// tRPC init del web. Acepta sesión de NextAuth (cookie) o Bearer token (mobile).
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@conectavet/db";
import { verifyMobileToken, type Role } from "@conectavet/api";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  vetStatus: "PENDING" | "APPROVED";
  tokenVersion: number;
}

export interface TRPCContextOpts {
  headers: Headers;
  // Sesión de NextAuth (cookie-based)
  session?: SessionUser;
}

async function resolveSession(opts: TRPCContextOpts): Promise<SessionUser | undefined> {
  // 1. Si ya hay session de NextAuth, esa gana
  if (opts.session?.id) return opts.session;

  // 2. Si no, intentar con Bearer token (mobile)
  const authHeader = opts.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyMobileToken(token);
    if (payload) {
      // Validar contra DB (revocación por tokenVersion)
      const db = await prisma.user.findUnique({ where: { id: payload.id } });
      if (db && db.tokenVersion === payload.tokenVersion) {
        return {
          id: db.id,
          email: db.email,
          role: db.role as Role,
          vetStatus: db.vetStatus as "PENDING" | "APPROVED",
          tokenVersion: db.tokenVersion,
        };
      }
    }
  }

  return undefined;
}

export async function createTRPCContext(opts: TRPCContextOpts) {
  const session = await resolveSession(opts);
  return { prisma, session, headers: opts.headers };
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