import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkRobloxDto {
  @ApiProperty({
    description: 'Roblox username',
    example: 'CoolGamer123',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({
    description: 'Roblox user ID (optional, will be looked up)',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
