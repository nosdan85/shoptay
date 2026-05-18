import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethodType {
  PAYPAL_FF = 'paypal_ff',
  CASHAPP = 'cashapp',
  LTC = 'ltc',
  WALLET = 'wallet',
  PAYPAL_REST = 'paypal_rest',
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'ord_123abc',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethodType,
    example: 'paypal_ff',
  })
  @IsEnum(PaymentMethodType)
  method: PaymentMethodType;

  @ApiPropertyOptional({
    description: 'Topup amount in cents (for wallet topups)',
  })
  @IsOptional()
  @IsNumber()
  topupAmountCents?: number;
}
