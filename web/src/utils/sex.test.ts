import { describe, it, expect } from 'vitest';
import { formatSex } from './sex';

describe('formatSex', () => {
  it('returns "—" for null or undefined inputs', () => {
    expect(formatSex(null)).toBe('—');
    expect(formatSex(undefined)).toBe('—');
  });

  it('returns "—" for empty string', () => {
    expect(formatSex('')).toBe('—');
  });

  it('formats male variants correctly', () => {
    expect(formatSex('male')).toBe('Macho');
    expect(formatSex('MALE')).toBe('Macho');
    expect(formatSex('Male')).toBe('Macho');
    expect(formatSex('macho')).toBe('Macho');
    expect(formatSex('MACHO')).toBe('Macho');
    expect(formatSex('Macho')).toBe('Macho');
  });

  it('formats female variants correctly', () => {
    expect(formatSex('female')).toBe('Hembra');
    expect(formatSex('FEMALE')).toBe('Hembra');
    expect(formatSex('Female')).toBe('Hembra');
    expect(formatSex('hembra')).toBe('Hembra');
    expect(formatSex('HEMBRA')).toBe('Hembra');
    expect(formatSex('Hembra')).toBe('Hembra');
  });

  it('returns "—" for unknown inputs', () => {
    expect(formatSex('other')).toBe('—');
    expect(formatSex('unknown')).toBe('—');
    expect(formatSex('123')).toBe('—');
  });
});
