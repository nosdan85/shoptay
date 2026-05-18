import {
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SelectDeliverySlotDto {
  @ApiPropertyOptional({
    description: 'Delivery slot ID',
    example: 'slot_abc123',
  })
  @IsString()
  slotId: string;

  @ApiPropertyOptional({
    description: 'Customer timezone',
    example: 'America/New_York',
  })
  @IsString()
  customerTimezone: string;
}
