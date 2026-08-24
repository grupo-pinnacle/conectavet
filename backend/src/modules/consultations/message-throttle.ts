import { prisma } from '../../shared/prisma';

// Rate-limit y dedup de mensajes COMPARTIDO entre REST y Socket.io.
// Si REDIS_URL está configurado, ambos se vuelven distribuidos (multi-instancia).

const RATE_LIMIT_WINDOW = 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, number[]>();

const MSG_DEDUP = new Map<string, number>();
const MSG_DEDUP_TTL = 10_000;

let redisClient: any = null;
export function setRedisClient(client: any): void {
  redisClient = client;
}

function checkRateLimitSync(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(key, recent);
  return true;
}

export async function checkRateLimit(key: string): Promise<boolean> {
  if (redisClient) {
    try {
      const count = await redisClient.incr(`ratelimit:${key}`);
      if (count === 1) await redisClient.expire(`ratelimit:${key}`, Math.ceil(RATE_LIMIT_WINDOW / 1000));
      return count <= RATE_LIMIT_MAX;
    } catch {
      // Redis caído -> fallback a in-memory para no bloquear el servicio.
    }
  }
  return checkRateLimitSync(key);
}

export async function isDuplicate(consultationId: string, clientMsgId: string): Promise<boolean> {
  const key = `dedup:${consultationId}:${clientMsgId}`;
  if (redisClient) {
    try {
      const result = await redisClient.set(key, '1', 'NX', 'EX', Math.ceil(MSG_DEDUP_TTL / 1000));
      return result === null; // null => ya existía => duplicado
    } catch {
      // fallback a in-memory
    }
  }
  const dedupeKey = `${consultationId}:${clientMsgId}`;
  if (MSG_DEDUP.has(dedupeKey)) return true;
  MSG_DEDUP.set(dedupeKey, Date.now());
  setTimeout(() => MSG_DEDUP.delete(dedupeKey), MSG_DEDUP_TTL);
  return false;
}
