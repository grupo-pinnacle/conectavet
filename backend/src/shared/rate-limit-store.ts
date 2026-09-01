import type { Store, IncrementResponse, Options } from 'express-rate-limit';
import { redisClient } from './redis.js';

export class CustomRedisStore implements Store {
  options!: Options;
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.options = options;
  }

  async increment(key: string): Promise<IncrementResponse> {
    if (!redisClient || redisClient.status !== 'ready') {
      // Fail-open si no hay Redis (o podramos implementar un MemoryStore real de fallback)
      return { totalHits: 1, resetTime: new Date(Date.now() + this.options.windowMs) };
    }
    
    const fullKey = `${this.prefix}${key}`;
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
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.decr(`${this.prefix}${key}`);
    }
  }

  async resetKey(key: string): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.del(`${this.prefix}${key}`);
    }
  }
}
