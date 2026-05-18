import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TicketStatusEnum {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriorityEnum {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'Ticket status',
    enum: TicketStatusEnum,
  })
  @IsOptional()
  @IsEnum(TicketStatusEnum)
  status?: TicketStatusEnum;

  @ApiPropertyOptional({
    description: 'Ticket priority',
    enum: TicketPriorityEnum,
  })
  @IsOptional()
  @IsEnum(TicketPriorityEnum)
  priority?: TicketPriorityEnum;

  @ApiPropertyOptional({
    description: 'Ticket subject',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Ticket description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
