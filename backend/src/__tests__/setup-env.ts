import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

(() => {
  const tmpFile = join(__dirname, '..', '..', '.jest-schema');
  if (!existsSync(tmpFile)) return;

  const schema = readFileSync(tmpFile, 'utf-8').trim();
  const directUrl = process.env.DIRECT_URL;
  if (directUrl) {
    const base = directUrl.split('?')[0];
    process.env.DATABASE_URL = `${base}?schema=${schema}`;
    process.env.DIRECT_URL = `${base}?schema=${schema}`;
  }
})();
