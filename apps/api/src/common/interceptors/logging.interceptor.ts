import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const correlationId = (request.headers['x-correlation-id'] as string) || 
                         (request as any).correlationId;
    
    const userId = request.userId || request.user?.id || 'anonymous';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms - ${userId}${correlationId ? ` [${correlationId}]` : ''}`,
            {
              method,
              url,
              statusCode,
              duration,
              ip,
              userAgent,
              userId,
              correlationId,
            },
          );
        },
        error: (error) => {
          const statusCode = error.status || 500;
          const duration = Date.now() - startTime;

          this.logger.error(
            `${method} ${url} ${statusCode} - ${duration}ms - ${error.message || 'Unknown error'}`,
            error.stack,
            {
              method,
              url,
              statusCode,
              duration,
              ip,
              userAgent,
              userId,
              correlationId,
            },
          );
        },
      }),
    );
  }
}
