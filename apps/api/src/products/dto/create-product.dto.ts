import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkDiscountDto {
  @ApiProperty({ description: 'Minimum quantity for bulk discount', example: 5 })
  @IsNumber()
  @Min(1)
  minQuantity: number;

  @ApiProperty({ description: 'Discount percentage', example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: '500 Robux',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Product slug (auto-generated if not provided)',
    example: '500-robux',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Get 500 Robux instantly delivered to your account.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Short description for listings',
    example: 'Instant delivery',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @ApiProperty({
    description: 'Product price in USD',
    example: 4.99,
  })
  @IsNumber()
  @Min(0.01)
  price: number;

  @ApiPropertyOptional({
    description: 'Original price string for display',
    example: '$5.00',
  })
  @IsOptional()
  @IsString()
  originalPriceString?: string;

  @ApiPropertyOptional({
    description: 'Bulk price in cents (for qty > threshold)',
    example: 400,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bulkPriceCents?: number;

  @ApiPropertyOptional({
    description: 'Bulk price string for display',
    example: '$4.00',
  })
  @IsOptional()
  @IsString()
  bulkPriceString?: string;

  @ApiProperty({
    description: 'Primary product image URL',
    example: '/images/products/robux-500.png',
  })
  @IsString()
  @MinLength(1)
  image: string;

  @ApiPropertyOptional({
    description: 'Additional product images',
    type: [String],
    example: ['/images/products/robux-500-1.png', '/images/products/robux-500-2.png'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({
    description: 'Current stock quantity (-1 for unlimited)',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  stock?: number;

  @ApiPropertyOptional({
    description: 'Maximum quantity per order',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPerOrder?: number;

  @ApiProperty({
    description: 'Category ID',
    example: 'clx1234567890',
  })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Game ID (optional)',
    example: 'clx0987654321',
  })
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({
    description: 'Is product active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Is digital product (no delivery slot needed)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;

  @ApiPropertyOptional({
    description: 'Delivery information',
    example: 'Delivered within 24 hours',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryInfo?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
