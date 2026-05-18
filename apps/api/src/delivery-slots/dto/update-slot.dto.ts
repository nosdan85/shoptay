import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSlotDto {
  @ApiPropertyOptional({
    description: 'Slot start time (ISO 8601)',
    example: '2024-01-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({
    description: 'Slot end time (ISO 8601)',
    example: '2024-01-15T12:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({
    description: 'Owner timezone',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  ownerTimezone?: string;

  @ApiPropertyOptional({
    description: 'Optional note for this slot',
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
  maxOrders?: number;

  @ApiPropertyOptional({
    description: 'Whether slot is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
