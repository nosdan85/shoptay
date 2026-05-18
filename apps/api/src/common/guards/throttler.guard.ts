import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    throw new ThrottlerException(
      'Too many requests. Please try again later.',
    );
  }

  protected async getTracker(req: Request): Promise<string> {
    // Use user ID if authenticated, otherwise use IP
    const user = req.user as any;
    if (user?.id) {
      return `user:${user.id}`;
    }
    
    // Fallback to IP
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  protected async getLimit(
    req: Request,
  ): Promise<number> {
    const path = req.route?.path || req.path;
    const user = req.user as any;

    // Different limits based on route
    if (path.includes('/checkout')) {
      return 10; // 10 checkout attempts per 15 min
    }
    
    if (path.includes('/auth/discord')) {
      return 5; // 5 auth attempts per 15 min
    }
    
    if (path.includes('/wallet/topup')) {
      return 5; // 5 topup attempts per 15 min
    }

    // Owner/admin endpoints have higher limits
    if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
      return 500; // Higher limit for admins
    }

    return 100; // Default global limit
  }

  protected getHeadersOption(
    context: ExecutionContext,
  ): object {
    const { ttl, limit, remaining } = this.storage;
    return {
      'Retry-After': ttl,
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remaining,
    };
  }
}
