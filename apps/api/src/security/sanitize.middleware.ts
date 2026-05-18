import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SanitizeService, SANITIZATION_PRESETS } from './sanitize.service';

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SanitizeMiddleware.name);
  private readonly sanitizeService = new SanitizeService();

  // Fields that should be sanitized from request body
  private readonly bodyFieldsToSanitize: Record<string, keyof typeof SANITIZATION_PRESETS> = {
    name: 'name',
    username: 'username',
    email: 'email',
    description: 'description',
    shortDescription: 'name',
    title: 'name',
    subject: 'name',
    message: 'description',
    content: 'description',
    bio: 'description',
    note: 'description',
  };

  use(req: Request, res: Response, next: NextFunction): void {
    // Only sanitize in development or when explicitly enabled
    if (process.env['SANITIZE_INPUT'] !== 'true' && process.env['NODE_ENV'] === 'production') {
      return next();
    }

    try {
      // Sanitize body
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeRequestBody(req.body);
      }

      // Sanitize query params
      if (req.query && typeof req.query === 'object') {
        req.query = this.sanitizeService.sanitizeObject(req.query);
      }

      // Sanitize URL params
      if (req.params && typeof req.params === 'object') {
        req.params = this.sanitizeService.sanitizeObject(req.params);
      }
    } catch (error) {
      this.logger.error(`Sanitization error: ${error.message}`);
    }

    next();
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(body)) {
      // Skip internal fields
      if (key.startsWith('_') || key === 'password' || key === 'token' || key === 'secret') {
        sanitized[key] = value;
        continue;
      }

      if (typeof value === 'string') {
        const preset = this.bodyFieldsToSanitize[key];
        const options = preset ? SANITIZATION_PRESETS[preset] : SANITIZATION_PRESETS.name;
        sanitized[key] = this.sanitizeService.sanitizeString(value, options);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeRequestBody(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
