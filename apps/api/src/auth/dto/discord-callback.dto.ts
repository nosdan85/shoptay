import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class DiscordCallbackDto {
  @ApiProperty({
    description: 'Discord OAuth authorization code',
    example: 'OAUTH_CODE_HERE',
  })
  @IsString()
  @IsNotEmpty({ message: 'Authorization code is required' })
  @Transform(({ value }) => value?.trim())
  code: string;

  @ApiProperty({
    description: 'Redirect URI used in the OAuth flow',
    required: false,
    example: 'http://localhost:3000/auth/discord/callback',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Redirect URI must be a valid URL' })
  redirectUri?: string;
}
