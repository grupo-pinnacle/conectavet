import { createPetSchema, updatePetSchema } from '../types';

const BASE = {
  name: 'Firulais',
  species: 'DOG' as const,
  birthDate: new Date().toISOString(),
};

describe('BUG-06 Cerco — weightKg i18n español (mobile)', () => {
  it('feliz: 12.5 y borde 500 pasan', () => {
    expect(createPetSchema.safeParse({ ...BASE, weightKg: 12.5 }).success).toBe(true);
    expect(createPetSchema.safeParse({ ...BASE, weightKg: 500 }).success).toBe(true);
  });

  it('feliz: ausente/opcional pasa (no bloquea alta sin peso)', () => {
    expect(createPetSchema.safeParse({ ...BASE }).success).toBe(true);
  });

  it('inválido: 501 y 1200 se rechazan con mensaje en español (no inglés)', () => {
    for (const v of [501, 1200]) {
      const r = createPetSchema.safeParse({ ...BASE, weightKg: v });
      expect(r.success).toBe(false);
      if (!r.success) {
        const msg = r.error.issues[0]?.message ?? '';
        expect(msg).toMatch(/500 kg/);
        expect(msg).not.toMatch(/Number must be/i);
      }
    }
  });

  it('borde: 0 y negativos se rechazan en español (positive)', () => {
    for (const v of [0, -3]) {
      const r = createPetSchema.safeParse({ ...BASE, weightKg: v });
      expect(r.success).toBe(false);
      if (!r.success) {
        const msg = r.error.issues[0]?.message ?? '';
        expect(msg).not.toMatch(/Number must be/i);
      }
    }
  });

  it('frontera: updatePetSchema hereda el mismo mensaje (partial)', () => {
    const r = updatePetSchema.safeParse({ weightKg: 501 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/500 kg/);
    }
    expect(updatePetSchema.safeParse({ weightKg: 500 }).success).toBe(true);
    expect(updatePetSchema.safeParse({}).success).toBe(true);
  });

  it('frontera: flujo new.tsx — texto "501" → Number() → schema bloquea en español', () => {
    // Replica mobile/app/(app)/pets/new.tsx:206 onChangeText(t => Number(t))
    const raw = '501';
    const value = raw ? Number(raw) : undefined;
    const r = createPetSchema.safeParse({ ...BASE, weightKg: value });
    expect(r.success).toBe(false);
    if (!r.success) {
      // Lo que new.tsx renderiza en <Input error={errors.weightKg?.message}>
      const uiMessage: string = r.error.issues[0]?.message ?? '';
      expect(uiMessage).toBe('El peso no puede superar los 500 kg');
    }
  });
});
