import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

export interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
  message?: string;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  static createOptions(options: RateLimitOptions): any {
    return {
      provide: `RATE_LIMIT_${options.keyPrefix.toUpperCase()}`,
      useValue: options,
    };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Skip rate limiting in test environment
    if (process.env['NODE_ENV'] === 'test') {
      return next();
    }

    // Get client identifier (IP address)
    const clientId = this.getClientId(req);
    const keyPrefix = (req as any).rateLimitKey || 'global';

    const result = await this.redisService.checkRateLimit(
      `${keyPrefix}:${clientId}`,
      100, // Default limit
      900, // 15 minutes default
    );

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.remaining + result.current);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt);

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.resetAt - Math.floor(Date.now() / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  private getClientId(req: Request): string {
    // Check for forwarded IP (behind proxy)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    // Check for real IP header
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fall back to connection IP
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
