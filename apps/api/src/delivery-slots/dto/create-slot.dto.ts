import {
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSlotDto {
  @ApiProperty({
    description: 'Slot start time (ISO 8601)',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDateString()
  startAt: string;

  @ApiProperty({
    description: 'Slot end time (ISO 8601)',
    example: '2024-01-15T12:00:00Z',
  })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({
    description: 'Owner timezone',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  ownerTimezone?: string;

  @ApiPropertyOptional({
    description: 'Optional note for this slot',
    example: 'Morning delivery batch',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Maximum orders for this slot',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxOrders?: number = 10;
}

export class BulkCreateSlotRangeDto {
  @ApiProperty({
    description: 'Slot start time (ISO 8601)',
  })
  @IsDateString()
  startAt: string;

  @ApiProperty({
    description: 'Slot end time (ISO 8601)',
  })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({
    description: 'Optional note for this slot',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class BulkCreateSlotsDto {
  @ApiProperty({
    description: 'Array of slot ranges to create',
    type: [BulkCreateSlotRangeDto],
  })
  @IsDateString({ each: true })
  slots: BulkCreateSlotRangeDto[];

  @ApiPropertyOptional({
    description: 'Owner timezone for all slots',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  ownerTimezone?: string;
}
