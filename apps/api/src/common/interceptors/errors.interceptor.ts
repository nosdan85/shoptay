import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ZodError } from 'zod';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  correlationId: string;
  errors?: any[];
}

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorsInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const correlationId = (request.headers['x-correlation-id'] as string) || 
                             request.correlationId ||
                             this.generateCorrelationId();

        let errorResponse: ErrorResponse;

        if (error instanceof ZodError) {
          errorResponse = {
            statusCode: 400,
            message: 'Validation failed',
            error: 'ValidationError',
            timestamp: new Date().toISOString(),
            path: request.url,
            correlationId,
            errors: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          };
        } else {
          errorResponse = {
            statusCode: error.status || 500,
            message: error.message || 'Internal server error',
            error: error.name || 'Error',
            timestamp: new Date().toISOString(),
            path: request.url,
            correlationId,
          };
        }

        this.logger.error(
          `Error: ${errorResponse.message}`,
          error.stack,
          {
            correlationId,
            path: request.url,
            method: request.method,
            statusCode: errorResponse.statusCode,
          },
        );

        return throwError(() => error);
      }),
    );
  }

  private generateCorrelationId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
