import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface Response<T> {
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in our format, return as is
        if (data && typeof data === 'object' && 'data' in data && 'timestamp' in data) {
          return data;
        }

        // Extract meta if present (for paginated responses)
        let meta: Record<string, any> | undefined;
        let payload = data;

        if (data && typeof data === 'object') {
          if ('meta' in data && 'data' in data) {
            meta = (data as any).meta;
            payload = (data as any).data;
          }
        }

        const response: Response<T> = {
          data: payload as T,
          timestamp: new Date().toISOString(),
        };

        if (meta) {
          response.meta = meta;
        }

        return response;
      }),
    );
  }
}
