import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProofQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 48,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 48;

  @ApiPropertyOptional({
    description: 'Filter by Discord ID',
  })
  @IsOptional()
  discordId?: string;

  @ApiPropertyOptional({
    description: 'Filter by source',
    enum: ['auto_vouch', 'manual', 'admin'],
  })
  @IsOptional()
  source?: string;
}
