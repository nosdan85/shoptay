import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      log:
        configService.get<string>('app.nodeEnv') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      logOptions: {
        emit: 'event',
        levels: ['query', 'info', 'warn', 'error'],
      },
    });

    // Set connection pool settings
    this.$connect().catch((err) => {
      this.logger.error('Failed to connect to database on startup', err);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  // Soft delete mixin
  async softDelete<T>(
    model: keyof PrismaClient,
    where: any,
  ): Promise<any> {
    const now = new Date();
    return (this[model] as any).update({
      where,
      data: {
        deletedAt: now,
      },
    });
  }

  // Find many with soft delete filter
  async findManyWithDeleted<T>(
    model: keyof PrismaClient,
    args: any,
  ): Promise<any[]> {
    const modelName = model.charAt(0).toUpperCase() + model.slice(1) as any;
    const where = args.where || {};
    
    // Check if model has deletedAt field
    const hasDeletedAt = ['Product', 'User', 'Order', 'Payment'].includes(modelName);
    
    if (hasDeletedAt && !args.withDeleted) {
      where.deletedAt = where.deletedAt || null;
    }

    return (this[model as keyof PrismaClient] as any).findMany({
      ...args,
      where,
    });
  }

  // Transaction helper
  async transaction<T>(
    fn: (prisma: PrismaService) => Promise<T>,
    options?: {
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.$transaction(fn, {
      timeout: options?.timeout,
      isolationLevel: options?.isolationLevel,
    });
  }

  // Execute with retry
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
