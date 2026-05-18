import {
  IsArray,
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SlotDto {
  @ApiProperty({
    description: 'Date for the slot (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({
    description: 'Start time (HH:mm)',
    example: '14:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be in HH:mm format' })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:mm)',
    example: '16:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Maximum deliveries for this slot',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDeliveries?: number;
}

export class BulkCreateSlotsDto {
  @ApiProperty({
    description: 'Slots to create',
    type: [SlotDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Type(() => SlotDto)
  slots: SlotDto[];

  @ApiPropertyOptional({
    description: 'Timezone for the slots',
    default: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
