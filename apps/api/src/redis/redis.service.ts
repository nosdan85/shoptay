import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;
  private readonly isConnected: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed, operating without cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      // Attempt connection
      this.redis.connect().catch(() => {
        this.logger.warn('Redis not available, caching disabled');
      });
    } catch (error) {
      this.logger.warn('Redis initialization failed, operating without cache');
    }
  }

  // Basic cache operations
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.warn(`Redis set failed for key ${key}: ${error.message}`);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      this.logger.warn(`Redis get failed for key ${key}: ${error.message}`);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.warn(`Redis del failed for key ${key}: ${error.message}`);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        return await this.redis.del(...keys);
      }
      return 0;
    } catch (error) {
      this.logger.warn(`Redis delPattern failed for pattern ${pattern}: ${error.message}`);
      return 0;
    }
  }

  // Counter operations
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.warn(`Redis incr failed for key ${key}: ${error.message}`);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.warn(`Redis decr failed for key ${key}: ${error.message}`);
      return 0;
    }
  }

  // Rate limiting
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    current: number;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `rate:${key}:${Math.floor(now / windowSeconds)}`;
    const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

    try {
      const current = await this.redis.incr(windowKey);

      // Set expiry on first request
      if (current === 1) {
        await this.redis.expire(windowKey, windowSeconds * 2);
      }

      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;

      return {
        allowed,
        remaining,
        resetAt,
        current,
      };
    } catch (error) {
      this.logger.warn(`Rate limit check failed for ${key}: ${error.message}`);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: limit,
        resetAt,
        current: 0,
      };
    }
  }

  // Sliding window rate limiter (more accurate)
  async slidingWindowRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}`;
    const clearBefore = now - windowSeconds * 1000;

    try {
      const pipeline = this.redis.pipeline();

      // Remove old entries
      pipeline.zremrangebyscore(windowKey, 0, clearBefore);

      // Count current requests
      pipeline.zcard(windowKey);

      // Add current request
      pipeline.zadd(windowKey, now.toString(), `${now}-${Math.random()}`);

      // Set expiry
      pipeline.expire(windowKey, windowSeconds);

      const results = await pipeline.exec();
      const current = results?.[1]?.[1] as number || 0;

      const remaining = Math.max(0, limit - current - 1);
      const allowed = current < limit;
      const resetAt = now + windowSeconds * 1000;

      return {
        allowed,
        remaining,
        resetAt,
      };
    } catch (error) {
      this.logger.warn(`Sliding window rate limit failed for ${key}: ${error.message}`);
      return {
        allowed: true,
        remaining: limit,
        resetAt: now + windowSeconds * 1000,
      };
    }
  }

  // Cache key generators
  static keys = {
    products: {
      all: () => 'cache:products:all',
      byGame: (gameId: string) => `cache:products:game:${gameId}`,
      byCategory: (categoryId: string) => `cache:products:category:${categoryId}`,
      single: (productId: string) => `cache:products:single:${productId}`,
    },
    games: {
      all: () => 'cache:games:all',
    },
    config: {
      shop: () => 'cache:config:shop',
      banners: () => 'cache:config:banners',
      bestSellers: () => 'cache:config:best-sellers',
    },
    rateLimit: {
      checkout: (ip: string) => `rate:checkout:${ip}`,
      api: (ip: string) => `rate:api:${ip}`,
      auth: (ip: string) => `rate:auth:${ip}`,
      payment: (ip: string) => `rate:payment:${ip}`,
    },
  };

  // TTL constants (in seconds)
  static TTL = {
    PRODUCTS: 300, // 5 minutes
    GAMES: 600, // 10 minutes
    CONFIG: 300, // 5 minutes
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
  };
}
