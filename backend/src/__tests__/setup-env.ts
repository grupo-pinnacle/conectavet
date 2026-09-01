import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

process.env.EXPO_PUSH_DISABLED = 'true';

(() => {
  const tmpFile = join(__dirname, '..', '..', '.jest-schema');
  if (!existsSync(tmpFile)) return;

  const schema = readFileSync(tmpFile, 'utf-8').trim();
  const directUrl = process.env.DIRECT_URL;
  if (directUrl) {
    const base = directUrl.split('?')[0];
    process.env.DATABASE_URL = `${base}?schema=${schema}&connection_limit=5`;
    process.env.DIRECT_URL = `${base}?schema=${schema}&connection_limit=5`;
  }
})();
