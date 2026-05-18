import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmDeliveryDto {
  @ApiPropertyOptional({
    description: 'Delivery rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Delivery feedback',
    example: 'Fast delivery, thanks!',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}
