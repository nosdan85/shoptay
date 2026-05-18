import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getHealth() {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'unknown');
    const version = process.env.npm_package_version || '1.0.0';

    return {
      status: 'ok',
      service: 'nosmarket-api',
      version,
      environment: nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }

  getPing() {
    return {
      pong: true,
      timestamp: Date.now(),
    };
  }

  async getDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
