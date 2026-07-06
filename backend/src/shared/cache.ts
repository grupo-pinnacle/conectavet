import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCache<T>(key: string, value: T, ttlSeconds = 60): void {
  cache.set(key, value, ttlSeconds);
}

export function clearCache(pattern?: string): void {
  if (pattern) {
    const keys = cache.keys().filter((k) => k.startsWith(pattern));
    keys.forEach((k) => cache.del(k));
  } else {
    cache.flushAll();
  }
}
