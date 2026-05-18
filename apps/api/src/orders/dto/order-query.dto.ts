import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderStatusFilter {
  PENDING = 'PENDING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatusFilter {
  PENDING = 'PENDING',
  AWAITING = 'AWAITING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PaymentMethodFilter {
  PAYPAL = 'PAYPAL',
  CASHAPP = 'CASHAPP',
  LITECOIN = 'LITECOIN',
  WALLET = 'WALLET',
  SQUARE = 'SQUARE',
}

export class OrderQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatusFilter,
  })
  @IsOptional()
  @IsEnum(OrderStatusFilter)
  status?: OrderStatusFilter;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatusFilter,
  })
  @IsOptional()
  @IsEnum(PaymentStatusFilter)
  paymentStatus?: PaymentStatusFilter;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethodFilter,
  })
  @IsOptional()
  @IsEnum(PaymentMethodFilter)
  paymentMethod?: PaymentMethodFilter;

  @ApiPropertyOptional({
    description: 'Search by order number, email, or username',
    example: 'NOS-ABC123',
  })
  @IsOptional()
  @IsString()
  search?: string;

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
}
