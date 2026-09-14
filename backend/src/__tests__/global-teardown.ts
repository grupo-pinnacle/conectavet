import { logger } from '../shared/logger';

export default async (): Promise<void> => {
  const directUrl = process.env.DIRECT_URL || '';
  const separator = directUrl.includes('?') ? '&' : '?';
  const testDirectUrl = `${directUrl}${separator}schema=testing`;

  try {
    const { PrismaClient } = require('@prisma/client');
    const client = new PrismaClient({ datasourceUrl: testDirectUrl });
    await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS testing CASCADE`);
    await client.$disconnect();
  } catch (err) {
    const error = err as Error;
    logger.warn('[global-teardown] No se pudo dropear schema (se ignora)', {
      error: error?.message?.slice(0, 120),
    });
  }
};
