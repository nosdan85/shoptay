import { Module } from '@nestjs/common';
import { FraudDetectionService } from './fraud-detection.service';
import { SanitizeService } from './sanitize.service';
import { SanitizeMiddleware } from './sanitize.middleware';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [FraudDetectionService, SanitizeService, SanitizeMiddleware, RateLimitMiddleware],
  exports: [FraudDetectionService, SanitizeService, SanitizeMiddleware, RateLimitMiddleware],
})
export class SecurityModule {}
