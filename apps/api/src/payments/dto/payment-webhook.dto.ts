import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentWebhookDto {
  @ApiProperty({ description: 'NOWPayments payment ID' })
  @IsString()
  payment_id: string;

  @ApiProperty({ description: 'Payment status' })
  @IsString()
  payment_status: string;

  @ApiProperty({ description: 'Order ID' })
  @IsString()
  order_id: string;

  @ApiPropertyOptional({ description: 'Actual amount paid' })
  @IsOptional()
  @IsNumber()
  actually_paid?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Transaction hash' })
  @IsOptional()
  @IsString()
  tx_hash?: string;

  @ApiPropertyOptional({ description: 'Additional data' })
  @IsOptional()
  @IsObject()
  additional_data?: Record<string, any>;
}
