const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

module.exports = async () => {
  const tmpFile = path.join(__dirname, '.jest-schema');
  if (!fs.existsSync(tmpFile)) return;

  const schemaName = fs.readFileSync(tmpFile, 'utf-8').trim();
  fs.unlinkSync(tmpFile);

  const directUrl = process.env.DIRECT_URL;
  if (!directUrl || !schemaName) return;

  const directBase = directUrl.split('?')[0];
  const dropUrl = `${directBase}`;

  try {
    execSync(
      `npx prisma db execute --url="${dropUrl}" --stdin`,
      {
        input: `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`,
        stdio: ['pipe', 'inherit', 'inherit'],
        cwd: __dirname,
        env: { ...process.env, DATABASE_URL: dropUrl, DIRECT_URL: dropUrl },
      }
    );
  } catch (err) {
    console.error(`[teardown] Error dropping schema ${schemaName}:`, err.message);
  }
};
