const path = require('path');

module.exports = async () => {
  const backendRoot = path.resolve(__dirname, '..', '..');

  const directUrl = process.env.DIRECT_URL || '';
  const separator = directUrl.includes('?') ? '&' : '?';
  const testDirectUrl = `${directUrl}${separator}schema=testing`;

  try {
    const { PrismaClient } = require('@prisma/client');
    const client = new PrismaClient({ datasourceUrl: testDirectUrl });
    await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS testing CASCADE`);
    await client.$disconnect();
  } catch (err) {
    console.warn('[global-teardown] No se pudo dropear schema (se ignora):', err.message.slice(0, 120));
  }
};
