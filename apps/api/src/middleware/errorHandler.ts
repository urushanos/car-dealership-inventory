import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const message = err?.message || 'Internal server error';

  return res.status(statusCode).json({
    message,
    ...(err?.errors ? { errors: err.errors } : {})
  });
}
