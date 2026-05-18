import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'I have completed the payment. Here is my transaction ID.',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Attachment URLs',
    example: ['https://example.com/screenshot.png'],
  })
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}
