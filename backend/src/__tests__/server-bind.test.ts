/**
 * BUG-10 Cerco — backend con bind LAN explícito.
 * Sin DB: solo lee server.ts y valida el contrato (misma técnica que
 * consultations-encoding). Corre bajo "integration" por testMatch pero no
 * usa Prisma ni red.
 */
import * as fs from 'fs';
import * as path from 'path';

const SERVER_FILE = path.join(__dirname, '..', 'server.ts');

describe('BUG-10 Cerco — bind explícito 0.0.0.0', () => {
  const src = fs.readFileSync(SERVER_FILE, 'utf8');

  it("feliz: listen con host explícito (alcanzable por LAN, no solo loopback)", () => {
    expect(src).toMatch(/app\.listen\(PORT,\s*'0\.0\.0\.0',/);
  });

  it('frontera: contrato intacto (PORT, app, socket, log, shutdown)', () => {
    expect(src).toContain('const PORT = Number(process.env.PORT) || 3001;');
    expect(src).toContain('setupChatSocket(server);');
    expect(src).toContain('Servidor iniciado en puerto');
    expect(src).not.toMatch(/app\.listen\(PORT,\s*\(\)/);
  });
});
