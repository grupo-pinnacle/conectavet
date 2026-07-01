const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

module.exports = async () => {
  const tmpFile = path.join(__dirname, '.jest-schema');
  if (!fs.existsSync(tmpFile)) {
    console.warn('[teardown] No .jest-schema file found — nothing to clean up');
    return;
  }

  let schemaName;
  try {
    schemaName = fs.readFileSync(tmpFile, 'utf-8').trim();
    fs.unlinkSync(tmpFile);
  } catch (err) {
    console.error('[teardown] Error reading/removing .jest-schema file:', err.message);
    return;
  }

  const directUrl = process.env.DIRECT_URL;
  if (!directUrl || !schemaName) {
    console.warn('[teardown] DIRECT_URL not set or schemaName empty — skipping cleanup');
    return;
  }

  const directBase = directUrl.split('?')[0];
  const dropUrl = directBase;

  try {
    execSync(
      `npx prisma db execute --url="${dropUrl}" --stdin`,
      {
        input: `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`,
        stdio: ['pipe', 'inherit', 'inherit'],
        cwd: __dirname,
        env: { ...process.env, DATABASE_URL: dropUrl, DIRECT_URL: dropUrl },
        timeout: 15000,
      }
    );
    console.log(`[teardown] Schema "${schemaName}" dropped successfully`);
  } catch (err) {
    console.error(`[teardown] Error dropping schema "${schemaName}":`, err.message);
    console.warn('[teardown] You may need to manually drop this schema via Supabase SQL editor');
  }
};
