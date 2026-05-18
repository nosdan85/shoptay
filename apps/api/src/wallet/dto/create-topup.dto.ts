import { IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TopupMethod {
  PAYPAL = 'PAYPAL',
  CASHAPP = 'CASHAPP',
  SQUARE = 'SQUARE',
  LITECOIN = 'LITECOIN',
}

export class CreateTopupDto {
  @ApiProperty({
    description: 'Topup amount in cents (e.g., 1000 = $10.00)',
    example: 5000,
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  @Max(1000000)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: TopupMethod,
  })
  @IsEnum(TopupMethod)
  method: TopupMethod;
}
