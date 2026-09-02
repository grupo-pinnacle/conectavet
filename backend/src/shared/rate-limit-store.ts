import type { Store, IncrementResponse, Options } from 'express-rate-limit';
import { redisClient } from './redis.js';

interface MemoryEntry {
  hits: number;
  resetTime: number;
}

export class CustomRedisStore implements Store {
  options!: Options;
  prefix: string;
  private memoryFallback: Map<string, MemoryEntry> = new Map();

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.options = options;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const fullKey = `${this.prefix}${key}`;

    if (!redisClient || redisClient.status !== 'ready') {
      const now = Date.now();
      const existing = this.memoryFallback.get(fullKey);

      if (!existing || now > existing.resetTime) {
        const resetTime = now + this.options.windowMs;
        this.memoryFallback.set(fullKey, { hits: 1, resetTime });
        return { totalHits: 1, resetTime: new Date(resetTime) };
      }

      existing.hits += 1;
      return { totalHits: existing.hits, resetTime: new Date(existing.resetTime) };
    }
    
    const multi = redisClient.multi();
    multi.incr(fullKey);
    multi.pttl(fullKey);
    const results = await multi.exec();
    
    if (!results) {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.options.windowMs) };
    }
    
    const totalHits = results[0][1] as number;
    let ttl = results[1][1] as number;
    
    if (totalHits === 1 || ttl === -1) {
      await redisClient.pexpire(fullKey, this.options.windowMs);
      ttl = this.options.windowMs;
    }
    
    return {
      totalHits,
      resetTime: new Date(Date.now() + ttl),
    };
  }

  async decrement(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.decr(fullKey);
    } else {
      const existing = this.memoryFallback.get(fullKey);
      if (existing && existing.hits > 0) {
        existing.hits -= 1;
      }
    }
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.del(fullKey);
    } else {
      this.memoryFallback.delete(fullKey);
    }
  }
}
