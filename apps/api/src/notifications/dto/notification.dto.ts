import { IsString, IsOptional, IsEnum, IsObject, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  DELIVERY_READY = 'delivery_ready',
  DELIVERY_CONFIRMED = 'delivery_confirmed',
  TICKET_REPLY = 'ticket_reply',
  TICKET_CREATED = 'ticket_created',
  SYSTEM = 'system',
  COUPON_ISSUED = 'coupon_issued',
  PAYMENT_FAILED = 'payment_failed',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  DISCORD_DM = 'discord_dm',
  ALL = 'all',
}

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ enum: NotificationChannel, default: NotificationChannel.ALL })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}
