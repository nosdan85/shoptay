import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethodEnum {
  PAYPAL = 'PAYPAL',
  CASHAPP = 'CASHAPP',
  LITECOIN = 'LITECOIN',
  WALLET = 'WALLET',
  SQUARE = 'SQUARE',
}

export class CheckoutItemDto {
  @ApiProperty({ description: 'Product ID', example: 'prod_123' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CheckoutDto {
  @ApiProperty({
    description: 'Cart items',
    type: [CheckoutItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiPropertyOptional({
    description: 'Coupon code',
    example: 'SAVE10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethodEnum,
  })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;

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
