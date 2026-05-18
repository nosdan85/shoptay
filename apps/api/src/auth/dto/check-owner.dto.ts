import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckOwnerDto {
  @ApiProperty({
    description: 'Discord user ID to check ownership for',
    example: '123456789012345678',
  })
  @IsString()
  @IsNotEmpty()
  discordId: string;
}
