import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortByField {
  NAME = 'name',
  PRICE = 'price',
  SORT_ORDER = 'sortOrder',
  CREATED_AT = 'createdAt',
  STOCK = 'stock',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ProductQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by game ID',
    example: 'clx0987654321',
  })
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Search term for product name or description',
    example: 'robux',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: SortByField,
    default: SortByField.SORT_ORDER,
  })
  @IsOptional()
  @IsEnum(SortByField)
  sortBy?: SortByField = SortByField.SORT_ORDER;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter to only show in-stock items',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Include inactive products (owner only)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeInactive?: boolean;
}

export class ProductSearchDto {
  @ApiPropertyOptional({
    description: 'Search query',
    example: 'robux',
  })
  @IsOptional()
  @IsString()
  q?: string;
}

export class ProductStockUpdateDto {
  @ApiPropertyOptional({
    description: 'Stock delta (positive to add, negative to subtract)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delta?: number = 0;
}

export class ProductBulkStockUpdateDto {
  @ApiPropertyOptional({
    description: 'Bulk stock updates',
    type: 'array',
  })
  @IsOptional()
  updates?: { id: string; delta: number }[];
}
