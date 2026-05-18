import {
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkPaidDto {
  @ApiProperty({
    description: 'Transaction ID or reference',
    example: 'TXN123456',
  })
  @IsString()
  txnId: string;

  @ApiPropertyOptional({
    description: 'Admin note',
    example: 'Manual PayPal verification',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
