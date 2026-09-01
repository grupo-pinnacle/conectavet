import { parsePagination, excludePassword, asyncHandler } from '../shared/utils';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../shared/errors';
import { Request, Response } from 'express';

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
