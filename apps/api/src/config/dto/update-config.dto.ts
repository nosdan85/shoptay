import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiPropertyOptional({
    description: 'Shop name',
    example: 'Nos Market',
  })
  @IsOptional()
  @IsString()
  shopName?: string;

  @ApiPropertyOptional({
    description: 'Shop description',
    example: 'Premium gaming items marketplace',
  })
  @IsOptional()
  @IsString()
  shopDescription?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'support@nosmarket.com',
  })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Discord server URL',
    example: 'https://discord.gg/example',
  })
  @IsOptional()
  @IsString()
  discordServerUrl?: string;
}
