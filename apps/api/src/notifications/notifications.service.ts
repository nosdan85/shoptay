import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  NotificationType,
  NotificationChannel,
} from './dto/notification.dto';
import { Notification } from '@prisma/client';

export interface NotificationWithUser extends Notification {
  user?: {
    id: string;
    username: string;
    discordId: string;
  } | null;
}

export interface PaginatedNotifications {
  data: NotificationWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly configService: ConfigService,
  ) {}

  async createNotification(
    userId: string | null,
    dto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data || null,
        channel: dto.channel || NotificationChannel.ALL,
        isRead: false,
        sentAt: dto.channel !== NotificationChannel.IN_APP ? new Date() : null,
      },
    });

    this.logger.log(`Notification created: ${notification.id} for user ${userId || 'system'}`);

    // Emit realtime event if user is specified
    if (userId && dto.channel !== NotificationChannel.EMAIL) {
      await this.emitNotificationEvent(userId, notification);
    }

    // Send Discord DM if requested
    if (userId && (dto.channel === NotificationChannel.DISCORD_DM || dto.channel === NotificationChannel.ALL)) {
      await this.sendDiscordDM(userId, notification);
    }

    return notification;
  }

  async createBulkNotifications(
    userIds: string[],
    dto: CreateNotificationDto,
  ): Promise<{ count: number }> {
    const notifications = userIds.map((userId) => ({
      userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dto.data || null,
      channel: dto.channel || NotificationChannel.ALL,
      isRead: false,
      sentAt: dto.channel !== NotificationChannel.IN_APP ? new Date() : null,
    }));

    const result = await this.prisma.notification.createMany({
      data: notifications,
    });

    this.logger.log(`Bulk notifications created: ${result.count} for ${userIds.length} users`);

    // Emit realtime events
    for (const userId of userIds) {
      if (dto.channel !== NotificationChannel.EMAIL) {
        const userNotifications = await this.prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });
        if (userNotifications.length > 0) {
          await this.emitNotificationEvent(userId, userNotifications[0]);
        }
      }
    }

    return { count: result.count };
  }

  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedNotifications> {
    const { page = 1, limit = 20, unreadOnly = false } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              discordId: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total,
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    this.logger.log(`All notifications marked as read for user ${userId}`);

    return { count: result.count };
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    this.logger.log(`Notification ${notificationId} deleted by user ${userId}`);
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Deleted ${result.count} old notifications (older than ${daysOld} days)`);

    return { count: result.count };
  }

  // Event handlers for order lifecycle
  async onOrderCreated(order: any): Promise<void> {
    // Notify staff about new order
    const staffUsers = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'OWNER', 'MODERATOR'] },
      },
    });

    if (staffUsers.length > 0) {
      await this.createBulkNotifications(
        staffUsers.map((u) => u.id),
        {
          type: NotificationType.ORDER_CREATED,
          title: 'New Order Received',
          message: `New order ${order.orderNumber} for $${order.totalAmount} received`,
          data: { orderId: order.id, orderNumber: order.orderNumber, total: order.totalAmount },
          channel: NotificationChannel.IN_APP,
        },
      );
    }
  }

  async onPaymentConfirmed(order: any): Promise<void> {
    // Notify customer
    if (order.userId) {
      await this.createNotification(order.userId, {
        type: NotificationType.PAYMENT_CONFIRMED,
        title: 'Payment Confirmed',
        message: `Your payment for order ${order.orderNumber} has been confirmed. We're preparing your order now!`,
        data: { orderId: order.id, orderNumber: order.orderNumber },
        channel: NotificationChannel.ALL,
      });
    }

    // Notify staff
    const staffUsers = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'OWNER', 'MODERATOR'] } },
    });

    if (staffUsers.length > 0) {
      await this.createBulkNotifications(
        staffUsers.map((u) => u.id),
        {
          type: NotificationType.PAYMENT_CONFIRMED,
          title: 'Payment Received',
          message: `Payment confirmed for order ${order.orderNumber}`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
          channel: NotificationChannel.IN_APP,
        },
      );
    }
  }

  async onDeliveryReady(order: any): Promise<void> {
    if (order.userId) {
      await this.createNotification(order.userId, {
        type: NotificationType.DELIVERY_READY,
        title: 'Ready for Delivery',
        message: `Your order ${order.orderNumber} is ready for delivery! Please check the delivery schedule.`,
        data: { orderId: order.id, orderNumber: order.orderNumber },
        channel: NotificationChannel.ALL,
      });
    }
  }

  async onDeliveryConfirmed(order: any, couponCode?: string): Promise<void> {
    // Notify staff
    const staffUsers = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'OWNER'] } },
    });

    if (staffUsers.length > 0) {
      await this.createBulkNotifications(
        staffUsers.map((u) => u.id),
        {
          type: NotificationType.DELIVERY_CONFIRMED,
          title: 'Delivery Confirmed',
          message: `Customer confirmed delivery for order ${order.orderNumber}${couponCode ? '. Coupon issued.' : ''}`,
          data: { orderId: order.id, orderNumber: order.orderNumber, couponCode },
          channel: NotificationChannel.IN_APP,
        },
      );
    }

    // Notify customer with coupon
    if (order.userId && couponCode) {
      await this.createNotification(order.userId, {
        type: NotificationType.COUPON_ISSUED,
        title: 'Thank You! Here\'s a Discount',
        message: `Thanks for confirming your delivery! Use code ${couponCode} for 5% off your next order.`,
        data: { orderId: order.id, couponCode, discountPercent: 5 },
        channel: NotificationChannel.ALL,
      });
    }
  }

  async onTicketReply(ticket: any, message: string): Promise<void> {
    if (ticket.userId) {
      await this.createNotification(ticket.userId, {
        type: NotificationType.TICKET_REPLY,
        title: 'New Reply on Your Ticket',
        message: `You have a new reply: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
        data: { ticketId: ticket.id, channelId: ticket.channelId },
        channel: NotificationChannel.ALL,
      });
    }
  }

  async onTicketCreated(ticket: any): Promise<void> {
    // Notify staff about new ticket
    const staffUsers = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'OWNER', 'MODERATOR'] } },
    });

    if (staffUsers.length > 0) {
      await this.createBulkNotifications(
        staffUsers.map((u) => u.id),
        {
          type: NotificationType.TICKET_CREATED,
          title: 'New Support Ticket',
          message: `New ${ticket.type} ticket from ${ticket.discordUsername || 'Unknown'}`,
          data: { ticketId: ticket.id, channelId: ticket.channelId, type: ticket.type },
          channel: NotificationChannel.IN_APP,
        },
      );
    }
  }

  private async emitNotificationEvent(userId: string, notification: Notification): Promise<void> {
    try {
      await this.realtimeService.emitToUser(userId, {
        type: 'NOTIFICATION',
        notification,
      });
    } catch (error) {
      this.logger.warn(`Failed to emit notification event: ${error.message}`);
    }
  }

  private async sendDiscordDM(userId: string, notification: Notification): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true },
    });

    if (!user?.discordId) {
      return;
    }

    // In production, this would use the Discord Bot API to send a DM
    // For now, we'll just log it
    this.logger.log(
      `Would send Discord DM to ${user.discordId}: ${notification.title} - ${notification.message}`,
    );

    // TODO: Implement actual Discord DM sending via Bot API
    // This would typically make an API call to the bot service
  }
}
