const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
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
    console.warn('[global-setup] Schema push falló (se ignora si ya existe o hay error de conexión):', err.message);
  }
};
