import { getCached, setCache, clearCache } from '../shared/cache';

describe('Cache', () => {
  afterEach(async () => {
    await clearCache();
  });

  test('set y get funcionan', async () => {
    await setCache('test:key', { foo: 'bar' });
    const result = await getCached<{ foo: string }>('test:key');
    expect(result).toEqual({ foo: 'bar' });
  });

  test('get de key inexistente devuelve undefined', async () => {
    const result = await getCached('test:nonexistent');
    expect(result).toBeUndefined();
  });

  test('clearCache sin patrón limpia todo', async () => {
    await setCache('a:1', 'value1');
    await setCache('b:2', 'value2');
    await clearCache();
    expect(await getCached('a:1')).toBeUndefined();
    expect(await getCached('b:2')).toBeUndefined();
  });

  test('clearCache con patrón limpia solo keys que coinciden', async () => {
    await setCache('vets:available', 'vets');
    await setCache('other:key', 'other');
    await clearCache('vets:');
    expect(await getCached('vets:available')).toBeUndefined();
    expect(await getCached('other:key')).toBe('other');
  });
});
