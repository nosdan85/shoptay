import { SetMetadata } from '@nestjs/common';
import { ApiResponseOptions } from '@nestjs/swagger';

export const PAGINATION_METADATA_KEY = 'pagination';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export const ApiPaginatedResponse = <TModel extends { new (...args: any[]): any }>(
  model: TModel,
  description?: string,
): MethodDecorator & ClassDecorator => {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    ApiResponseOptions({
      status: 200,
      description: description || 'Paginated response',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: `#/components/schemas/${model.name}` },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    })(target, propertyKey, descriptor);

    SetMetadata(PAGINATION_METADATA_KEY, true)(target, propertyKey, descriptor);
  };
};
