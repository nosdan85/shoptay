import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrderPaymentInfoDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'ord_123',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
