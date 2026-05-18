import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectSlotDto {
  @ApiProperty({
    description: 'Delivery slot ID',
    example: 'slot_123',
  })
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({
    description: 'Customer timezone (IANA format)',
    example: 'America/New_York',
  })
  @IsString()
  @IsNotEmpty()
  customerTimezone: string;
}
