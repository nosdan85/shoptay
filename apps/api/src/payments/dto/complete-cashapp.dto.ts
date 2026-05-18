import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteCashAppDto {
  @ApiProperty({
    description: 'Square source ID from CashApp tokenization',
    example: 'cnon:card-nonce-ok',
  })
  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @ApiPropertyOptional({
    description: 'Payment ID from our system',
  })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Idempotency key for preventing duplicate charges',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
