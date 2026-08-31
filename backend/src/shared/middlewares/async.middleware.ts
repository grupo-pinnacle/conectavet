import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler to automatically catch rejections and pass them to next().
 */
export const asyncHandler = (
  fn: (req: Request | any, res: Response, next: NextFunction) => Promise<any> | any
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
