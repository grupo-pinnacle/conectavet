import NodeCache from 'node-cache';
import { redisClient } from './redis';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export async function getCached<T>(key: string): Promise<T | undefined> {
  if (redisClient && redisClient.status === 'ready') {
    try {
      const val = await redisClient.get(key);
      if (val) return JSON.parse(val) as T;
      return undefined;
    } catch { /* fallback */ }
  }
  return cache.get<T>(key);
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
  if (redisClient && redisClient.status === 'ready') {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch { /* fallback */ }
  }
  cache.set(key, value, ttlSeconds);
}

export async function clearCache(pattern?: string): Promise<void> {
  if (redisClient && redisClient.status === 'ready') {
    try {
      if (pattern) {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', `${pattern}*`, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await redisClient.del(...keys);
          }
        } while (cursor !== '0');
      } else {
        await redisClient.flushdb();
      }
    } catch { /* fallback */ }
  }
  if (pattern) {
    const keys = cache.keys().filter((k) => k.startsWith(pattern));
    keys.forEach((k) => cache.del(k));
  } else {
    cache.flushAll();
  }
}
