import { Response } from 'express';
import { logger } from '../logger';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tenés permiso para acceder a este recurso') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401);
  }
}

/**
 * Centralized error handler for all controllers.
 * - Known AppErrors → return their status/message.
 * - Unknown errors → log with structured logger + return 500.
 */
export function handleError(error: unknown, res: Response, context = 'controller') {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  const err = error as Error;
  logger.error(`Error en ${context}`, {
    message: err?.message,
    stack: err?.stack?.split('\n').slice(0, 4).join(' | '),
  });
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
}
