import { Redis } from 'ioredis';
import { logger } from './logger';

export let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      }
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis error: ' + err.message);
    });
    
    // Attempt connection
    redisClient.connect().then(() => {
      logger.info('Connected to Redis global store');
    }).catch((err) => {
      logger.warn('Failed to connect to Redis global store, falling back to memory: ' + err.message);
      redisClient = null;
    });
  } catch(e) {
    logger.warn('Redis init failed, falling back to memory');
    redisClient = null;
  }
}
