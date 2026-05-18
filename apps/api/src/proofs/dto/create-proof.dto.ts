import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProofItemDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Aura Chest',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Pack quantity',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  packQuantity?: number;

  @ApiPropertyOptional({
    description: 'Delivered label',
    example: '1x Aura Chest',
  })
  @IsOptional()
  @IsString()
  deliveredLabel?: string;

  @ApiProperty({
    description: 'Line total in dollars',
    example: 5.00,
  })
  @IsNumber()
  lineTotal: number;
}

export class CreateProofDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'clx1234567890',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Image URLs',
    example: ['https://example.com/proof1.png'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiProperty({
    description: 'Items in the delivery',
    type: [ProofItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProofItemDto)
  items: ProofItemDto[];

  @ApiPropertyOptional({
    description: 'Source of the proof',
    enum: ['auto_vouch', 'manual', 'admin'],
    default: 'manual',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Vouch message ID from Discord',
  })
  @IsOptional()
  @IsString()
  vouchMessageId?: string;

  @ApiPropertyOptional({
    description: 'Discord ID of the customer',
  })
  @IsOptional()
  @IsString()
  discordId?: string;

  @ApiPropertyOptional({
    description: 'Discord username of the customer',
  })
  @IsOptional()
  @IsString()
  discordUsername?: string;
}
