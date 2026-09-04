/**
 * BUG-08 Cerco — el saludo de Inicio solo monta con usuario cargado.
 * Sin infra de component-tests en mobile: test de contrato estático sobre el
 * fuente (misma técnica que consultations-encoding). Falla si alguien quita
 * la compuerta y el saludo vuelve a renderizar vacío durante la carga.
 */
import * as fs from 'fs';
import * as path from 'path';

const HOME_FILE = path.join(__dirname, '..', '..', 'app', '(app)', 'index.tsx');

describe('BUG-08 Cerco — saludo de Inicio gateado por usuario', () => {
  const src = fs.readFileSync(HOME_FILE, 'utf8');

  it('feliz: el saludo personalizado existe y vive en la rama con usuario', () => {
    const gated = src.match(/!\s*user \? \([\s\S]*?\) : \([\s\S]*?\{saludo\}, \{user\?\.firstName\}/);
    expect(gated).not.toBeNull();
  });

  it('inválido-antes: no hay render de `{saludo},` fuera de la rama con usuario', () => {
    const occurrences = src.match(/\{saludo\},/g) ?? [];
    // Exactamente una, dentro del `else` del gate `!user ? ... : ...`
    expect(occurrences).toHaveLength(1);
    expect(src).toMatch(/!\s*user \?/);
  });

  it('borde: la rama sin usuario muestra shimmer con el Skeleton existente', () => {
    expect(src).toMatch(/import \{[^}]*\bSkeleton\b[^}]*\} from '@\/components\/ui'/);
    expect(src).toContain('<Skeleton width="60%" height={30} />');
    expect(src).toContain('<Skeleton width="80%" height={16} />');
  });
});
