import { IsString, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TicketTypeEnum {
  PAYMENT = 'PAYMENT',
  DELIVERY = 'DELIVERY',
  GENERAL = 'GENERAL',
  DISPUTE = 'DISPUTE',
  REFUND = 'REFUND',
}

export class CreateTicketDto {
  @ApiProperty({
    description: 'Ticket type',
    enum: TicketTypeEnum,
  })
  @IsEnum(TicketTypeEnum)
  type: TicketTypeEnum;

  @ApiProperty({
    description: 'Ticket subject',
    example: 'Payment issue with order ORD-00001',
  })
  @IsString()
  subject: string;

  @ApiPropertyOptional({
    description: 'Ticket description',
    example: 'I paid but my order status is still pending...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Order ID if related to an order',
  })
  @IsOptional()
  @IsString()
  orderId?: string;
}
