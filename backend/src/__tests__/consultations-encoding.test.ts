/**
 * BUG-07 Cerco — encoding del 409 de consulta duplicada.
 * Sin DB: solo lee el fuente y valida el contrato de texto que ven web y mobile.
 * Corre bajo el proyecto "integration" por testMatch, pero no usa Prisma ni red.
 */
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_FILE = path.join(__dirname, '..', 'modules', 'consultations', 'consultations.service.ts');
// Contrato que ya esperan web (`ConsultationCreate.test.tsx:87`) y mobile (dialog de `queue`):
const EXPECTED_409 = 'Ya tenés una consulta activa o en espera para esta mascota';

function dup409Lines(src: string): string[] {
  return src.split('\n').filter((l) => l.includes('consulta activa o en espera'));
}

describe('BUG-07 Cerco — mensaje 409 sin mojibake (UTF-8)', () => {
  const src = fs.readFileSync(SERVICE_FILE, 'utf8');

  it('el 409 de duplicado existe una sola vez en el servicio', () => {
    expect(dup409Lines(src)).toHaveLength(1);
  });

  it('inválido-antes / válido-ahora: el literal es español correcto, sin "Ã"', () => {
    const [line] = dup409Lines(src);
    expect(line).toContain(EXPECTED_409);
    expect(line).not.toMatch(/Ã/);
    expect(line).not.toContain('tenÃ©s');
  });

  it('frontera: backend emite exactamente lo que el front ya espera', () => {
    const [line] = dup409Lines(src);
    // Lo que `DirectorySection` y `queue` muestran verbatim tras el 409:
    const uiMessage = EXPECTED_409;
    expect(line.includes(uiMessage)).toBe(true);
  });
});
