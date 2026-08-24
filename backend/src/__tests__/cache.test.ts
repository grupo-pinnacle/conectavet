import { getCached, setCache, clearCache } from '../shared/cache';

describe('Cache', () => {
  afterEach(() => {
    clearCache();
  });

  test('set y get funcionan', () => {
    setCache('test:key', { foo: 'bar' });
    const result = getCached<{ foo: string }>('test:key');
    expect(result).toEqual({ foo: 'bar' });
  });

  test('get de key inexistente devuelve undefined', () => {
    const result = getCached('test:nonexistent');
    expect(result).toBeUndefined();
  });

  test('clearCache sin patrón limpia todo', () => {
    setCache('a:1', 'value1');
    setCache('b:2', 'value2');
    clearCache();
    expect(getCached('a:1')).toBeUndefined();
    expect(getCached('b:2')).toBeUndefined();
  });

  test('clearCache con patrón limpia solo keys que coinciden', () => {
    setCache('vets:available', 'vets');
    setCache('other:key', 'other');
    clearCache('vets:');
    expect(getCached('vets:available')).toBeUndefined();
    expect(getCached('other:key')).toBe('other');
  });
});
