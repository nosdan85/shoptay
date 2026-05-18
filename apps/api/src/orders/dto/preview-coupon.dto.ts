import {
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreviewCouponDto {
  @ApiProperty({
    description: 'Coupon code to preview',
    example: 'SAVE10',
  })
  @IsString()
  couponCode: string;

  @ApiProperty({
    description: 'Order subtotal in cents',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;
}
