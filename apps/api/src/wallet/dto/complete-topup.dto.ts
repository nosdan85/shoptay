import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteTopupDto {
  @ApiPropertyOptional({
    description: 'Square payment ID',
  })
  @IsOptional()
  @IsString()
  squarePaymentId?: string;
}
