import { parsePagination, parseMinRating, excludePassword, asyncHandler } from '../shared/utils';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../shared/errors';
import { Request, Response } from 'express';
import globalTeardown from './global-teardown';
import globalSetup from './global-setup';
import { logger } from '../shared/logger';
import { execSync } from 'child_process';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

describe('parsePagination', () => {
  test('valores por defecto', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  test('valores personalizados', () => {
    const result = parsePagination({ page: '3', limit: '10' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(20);
  });

  test('máximo limit respetado', () => {
    const result = parsePagination({ limit: '100' }, 50);
    expect(result.limit).toBe(50);
  });

  test('limit se capa al máximo por defecto (50) sin max explícito', () => {
    const result = parsePagination({ limit: '999' });
    expect(result.limit).toBe(50);
  });

  test('limit se capa al máximo por defecto (50) sin max explícito con page calculado', () => {
    const result = parsePagination({ page: '3', limit: '999' });
    expect(result.limit).toBe(50);
    expect(result.skip).toBe(100);
  });

  test('mínimo limit = 1', () => {
    const result = parsePagination({ limit: '-5' });
    expect(result.limit).toBe(1);
  });

  test('mínimo page = 1', () => {
    const result = parsePagination({ page: '0' });
    expect(result.page).toBe(1);
  });

  test('valores inválidos usan defaults', () => {
    const result = parsePagination({ page: 'abc', limit: 'xyz' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe('parseMinRating', () => {
  test('retorna undefined para undefined o null', () => {
    expect(parseMinRating(undefined)).toBeUndefined();
    expect(parseMinRating(null)).toBeUndefined();
  });

  test('retorna undefined para string vacío o espacios', () => {
    expect(parseMinRating('')).toBeUndefined();
    expect(parseMinRating('   ')).toBeUndefined();
  });

  test('retorna undefined para strings no numéricos', () => {
    expect(parseMinRating('abc')).toBeUndefined();
    expect(parseMinRating('NaN')).toBeUndefined();
  });

  test('retorna undefined para tipos no válidos (arrays, objetos, booleanos)', () => {
    expect(parseMinRating(['4'])).toBeUndefined();
    expect(parseMinRating({ rating: 4 })).toBeUndefined();
    expect(parseMinRating(true)).toBeUndefined();
  });

  test('parsea números válidos dentro de rango [0, 5]', () => {
    expect(parseMinRating('0')).toBe(0);
    expect(parseMinRating('3.5')).toBe(3.5);
    expect(parseMinRating('5')).toBe(5);
    expect(parseMinRating(4)).toBe(4);
  });

  test('clampa valores fuera de rango [0, 5]', () => {
    expect(parseMinRating('-1')).toBe(0);
    expect(parseMinRating('10')).toBe(5);
  });
});

describe('excludePassword', () => {
  test('excluye password del objeto', () => {
    const obj = { id: '1', email: 'test@test.com', password: 'secret', role: 'CLIENT' as const };
    const result = excludePassword(obj);
    expect(result).not.toHaveProperty('password');
    expect(result.id).toBe('1');
    expect(result.email).toBe('test@test.com');
  });

  test('funciona con objeto sin password', () => {
    const obj = { id: '1', email: 'test@test.com' };
    const result = excludePassword(obj);
    expect(result).toEqual(obj);
  });
});

describe('asyncHandler', () => {
  test('envuelve función async y captura errores', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    const handler = asyncHandler(async (_req: import('express').Request, _res: import('express').Response, _next: import('express').NextFunction) => {
      throw new Error('test error');
    });

    await handler(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  test('pasa éxito al next', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    const handler = asyncHandler(async (_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
      next();
    });

    await handler(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('AppError classes', () => {
  test('AppError tiene statusCode', () => {
    const err = new AppError('test', 400);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('test');
  });

  test('NotFoundError tiene statusCode 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Recurso no encontrado');
  });

  test('NotFoundError con mensaje personalizado', () => {
    const err = new NotFoundError('Mascota no encontrada');
    expect(err.message).toBe('Mascota no encontrada');
  });

  test('ForbiddenError tiene statusCode 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  test('ConflictError tiene statusCode 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });
});

describe('globalTeardown y globalSetup', () => {
  test('globalTeardown llama a logger.warn cuando ocurre un error', async () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    await globalTeardown();
    expect(warnSpy).toHaveBeenCalledWith(
      '[global-teardown] No se pudo dropear schema (se ignora)',
      expect.objectContaining({ error: expect.any(String) })
    );
    warnSpy.mockRestore();
  });

  test('globalSetup llama a logger.warn cuando execSync falla', async () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    (execSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Connection refused');
    });

    await globalSetup();

    expect(warnSpy).toHaveBeenCalledWith(
      '[global-setup] Schema push falló (se ignora si ya existe o hay error de conexión)',
      expect.objectContaining({ error: 'Connection refused' })
    );

    warnSpy.mockRestore();
  });
});
