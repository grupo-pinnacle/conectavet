const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

module.exports = async () => {
  const schemaName = `test_${Date.now()}`;
  const tmpFile = path.join(__dirname, '.jest-schema');
  fs.writeFileSync(tmpFile, schemaName, 'utf-8');

  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.warn('⚠️ DIRECT_URL no está definida en .env. Se omitirá el setup de la base de datos de tests.');
    process.env.SKIP_INTEGRATION_TESTS = 'true';
    return;
  }

  const directBase = directUrl.split('?')[0];
  process.env.DATABASE_URL = `${directBase}?schema=${schemaName}`;
  process.env.DIRECT_URL = `${directBase}?schema=${schemaName}`;

  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    cwd: __dirname,
    env: process.env,
  });
};
