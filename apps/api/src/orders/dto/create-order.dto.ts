import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  @Max(100000)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Cart items',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Coupon code',
    example: 'SAVE10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Discord ID',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  discordId?: string;

  @ApiPropertyOptional({
    description: 'Discord username',
    example: 'username',
  })
  @IsOptional()
  @IsString()
  discordUsername?: string;

  @ApiPropertyOptional({
    description: 'Customer email',
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Customer IP address',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Customer user agent',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
