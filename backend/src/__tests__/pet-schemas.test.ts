/**
 * BUG-05 Cerco — schemas de alta/edición: casos felices, inválidos y borde.
 * Puro Zod, sin DB: corre sin globalSetup.
 */
import { createPetSchema, updatePetSchema } from '../modules/pets/pets.schemas';

const BASE = { name: 'Andy', species: 'Perro', breed: 'Labrador', age: 3, weight: 12.5 };

describe('BUG-05 Cerco — createPetSchema', () => {
  it('caso feliz: payload válido pasa y sanea (trim)', () => {
    const r = createPetSchema.safeParse({ ...BASE, name: '  Andy  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe('Andy');
  });

  it('inválido: raza "?" se rechaza con mensaje claro', () => {
    const r = createPetSchema.safeParse({ ...BASE, breed: '?' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/al menos 2 caracteres/);
    }
  });

  it('inválido: microchip largo/no numérico se rechaza (label: 15 dígitos)', () => {
    expect(createPetSchema.safeParse({ ...BASE, microchip: '123456789masdigitos' }).success).toBe(false);
    expect(createPetSchema.safeParse({ ...BASE, microchip: '12345' }).success).toBe(false);
    const ok = createPetSchema.safeParse({ ...BASE, microchip: '123456789012345' });
    expect(ok.success).toBe(true);
  });

  it('inválido: peso 1200 se rechaza (tope 500)', () => {
    const r = createPetSchema.safeParse({ ...BASE, weight: 1200 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/500/);
    }
    expect(createPetSchema.safeParse({ ...BASE, weight: 500 }).success).toBe(true);
    expect(createPetSchema.safeParse({ ...BASE, weightKg: 1200 }).success).toBe(false);
  });

  it('borde: raza "" equivale a ausente (no bloquea a mobile que la envía vacía)', () => {
    const r = createPetSchema.safeParse({ ...BASE, breed: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.breed).toBeUndefined();
  });

  it('borde: nombre de 51 caracteres y arrays desmedidos se rechazan', () => {
    expect(createPetSchema.safeParse({ ...BASE, name: 'A'.repeat(51) }).success).toBe(false);
    expect(
      createPetSchema.safeParse({ ...BASE, allergies: Array.from({ length: 21 }, (_, i) => `alergia-${i}`) }).success
    ).toBe(false);
    expect(createPetSchema.safeParse({ ...BASE, color: 'C'.repeat(51) }).success).toBe(false);
  });
});

describe('BUG-05 Cerco — updatePetSchema (mismas reglas, todo opcional)', () => {
  it('caso feliz: patch parcial válido pasa', () => {
    expect(updatePetSchema.safeParse({ name: 'Andy II' }).success).toBe(true);
    expect(updatePetSchema.safeParse({}).success).toBe(true);
  });

  it('inválido: "?", microchip largo y peso 1200 también se rechazan en update', () => {
    expect(updatePetSchema.safeParse({ breed: '?' }).success).toBe(false);
    expect(updatePetSchema.safeParse({ microchip: '123456789masdigitos' }).success).toBe(false);
    expect(updatePetSchema.safeParse({ weight: 1200 }).success).toBe(false);
  });

  it('borde: "" en update equivale a omitir (el service lo salta)', () => {
    const r = updatePetSchema.safeParse({ breed: '' });
    expect(r.success).toBe(true);
    if (r.success) expect((r.data as Record<string, unknown>).breed).toBeUndefined();
  });
});
