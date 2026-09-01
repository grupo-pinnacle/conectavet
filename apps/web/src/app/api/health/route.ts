// Health check endpoint — usado por Vercel/load balancers para verificar que
// el servicio está vivo y la DB responde. Retorna 200 si todo OK, 503 si no.
import { prisma } from "@conectavet/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // DB check
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    checks.database = { ok: false, error: e?.message ?? "DB unreachable" };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 200 : 503;

  return Response.json(
    {
      ok: allOk,
      service: "conectavet-web",
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString(),
      totalMs: Date.now() - startedAt,
      checks,
    },
    { status }
  );
}