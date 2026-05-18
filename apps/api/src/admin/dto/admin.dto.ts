import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AdminRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export class AdminUpdateUserRoleDto {
  @ApiPropertyOptional({
    description: 'New role for user',
    enum: AdminRole,
  })
  @IsEnum(AdminRole)
  role: AdminRole;
}

export class AdminCreateCouponDto {
  @ApiPropertyOptional({ description: 'Coupon code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Discount type' })
  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT'])
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @ApiPropertyOptional({ description: 'Discount value' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Minimum order amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum uses' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;
}
