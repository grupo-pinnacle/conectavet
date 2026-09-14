import { execSync } from 'child_process';
import path from 'path';
import { logger } from '../shared/logger';

export default async (): Promise<void> => {
  const backendRoot = path.resolve(__dirname, '..', '..');

  const directUrl = process.env.DIRECT_URL || '';
  const separator = directUrl.includes('?') ? '&' : '?';
  const testDirectUrl = `${directUrl}${separator}schema=testing`;

  const dbUrl = process.env.DATABASE_URL || '';
  const dbSeparator = dbUrl.includes('?') ? '&' : '?';
  const testDbUrl = `${dbUrl}${dbSeparator}schema=testing`;

  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: {
        ...process.env,
        DIRECT_URL: testDirectUrl,
        DATABASE_URL: testDbUrl,
      },
      stdio: 'inherit',
      cwd: backendRoot,
    });
  } catch (err) {
    const error = err as Error;
    logger.warn('[global-setup] Schema push falló (se ignora si ya existe o hay error de conexión)', {
      error: error?.message,
    });
  }
};
