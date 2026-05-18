import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookVerifyDto {
  @ApiProperty({
    description: 'Raw request body as string for signature verification',
    example: '{"payment_id": "123", "payment_status": "finished"}',
  })
  @IsString()
  @IsNotEmpty()
  rawBody: string;

  @ApiPropertyOptional({
    description: 'Webhook signature from header',
  })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({
    description: 'Webhook signature version',
  })
  @IsOptional()
  @IsString()
  signatureVersion?: string;
}
