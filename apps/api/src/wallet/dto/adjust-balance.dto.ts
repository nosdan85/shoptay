import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustBalanceDto {
  @ApiProperty({ description: 'User ID to adjust balance for' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount in cents (positive to credit, negative to debit)' })
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  amountCents: number;

  @ApiPropertyOptional({ description: 'Reason for the adjustment' })
  @IsOptional()
  @IsString()
  note?: string;
}
