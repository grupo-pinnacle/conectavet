import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: error.issues[0]?.message || 'Datos inválidos',
        });
      }
      next(error);
    }
  };
};
