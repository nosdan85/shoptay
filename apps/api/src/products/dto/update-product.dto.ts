import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: '500 Robux',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Product slug',
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

  @ApiPropertyOptional({
    description: 'Product price in USD',
    example: 4.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  price?: number;

  @ApiPropertyOptional({
    description: 'Original price string for display',
    example: '$5.00',
  })
  @IsOptional()
  @IsString()
  originalPriceString?: string;

  @ApiPropertyOptional({
    description: 'Bulk price in cents',
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

  @ApiPropertyOptional({
    description: 'Primary product image URL',
    example: '/images/products/robux-500.png',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'Additional product images',
    type: [String],
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

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Game ID',
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
    description: 'Is digital product',
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
