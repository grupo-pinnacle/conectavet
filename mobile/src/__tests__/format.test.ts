import { calculateAge, formatAge, formatDuration, speciesDisplay, truncate } from '../utils/format';

describe('Format Utilities — Cálculos y Formateo Clínico', () => {
  it('calculateAge calcula correctamente años y meses', () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const age = calculateAge(twoYearsAgo.toISOString());
    expect(age.years).toBe(2);
  });

  it('formatAge maneja cachorros menores a 1 mes', () => {
    const today = new Date().toISOString();
    expect(formatAge(today)).toBe('Menos de 1 mes');
  });

  it('formatDuration convierte segundos en formato legible', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(65)).toBe('1m 05s');
    expect(formatDuration(180)).toBe('3m 00s');
  });

  it('speciesDisplay devuelve nombres en español para especies veterinarias', () => {
    expect(speciesDisplay('DOG')).toBe('Perro');
    expect(speciesDisplay('CAT')).toBe('Gato');
    expect(speciesDisplay('BIRD')).toBe('Ave');
  });

  it('truncate corta textos con elipsis cuando superan el límite', () => {
    expect(truncate('Hola', 10)).toBe('Hola');
    expect(truncate('Consulta veterinaria urgente', 10)).toBe('Consulta…');
  });
});
