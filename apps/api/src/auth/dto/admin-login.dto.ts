import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin password',
    example: 'securePassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'Access token for admin session',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for admin session',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
  })
  expiresIn: number;
}
