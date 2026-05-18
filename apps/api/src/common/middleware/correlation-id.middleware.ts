import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTime: number;
    }
  }
}

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Generate or use existing correlation ID
  const existingId = req.headers['x-correlation-id'] as string;
  const correlationId = existingId || `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Attach to request
  req.correlationId = correlationId;
  req.startTime = Date.now();

  // Set response header
  res.setHeader('X-Correlation-ID', correlationId);

  // Log incoming request
  if (req.method !== 'OPTIONS') {
    const logger = console;
    logger.debug(`Incoming request: ${req.method} ${req.url} [${correlationId}]`);
  }

  next();
}
