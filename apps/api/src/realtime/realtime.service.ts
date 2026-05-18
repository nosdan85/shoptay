import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async markNotificationsRead(userId: string, notificationIds: string[]) {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        isRead: false,
      },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async getNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async notifyOrderUpdate(orderId: string, userId: string, status: string, message: string) {
    await this.createNotification({
      userId,
      type: 'ORDER_UPDATE',
      title: 'Order Update',
      message,
      data: { orderId, status },
    });
  }

  async notifyPaymentReceived(orderId: string, userId: string, amount: number) {
    await this.createNotification({
      userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `Your payment of $${amount} has been received`,
      data: { orderId },
    });
  }

  async notifyDeliveryReady(orderId: string, userId: string) {
    await this.createNotification({
      userId,
      type: 'DELIVERY_READY',
      title: 'Delivery Ready',
      message: 'Your order is ready for delivery!',
      data: { orderId },
    });
  }

  async notifyDeliveryComplete(orderId: string, userId: string, discountCode?: string) {
    const message = discountCode 
      ? `Delivery complete! Here's a ${discountCode} coupon for your next order!`
      : 'Thank you for your purchase! Your order has been delivered.';

    await this.createNotification({
      userId,
      type: 'DELIVERY_COMPLETE',
      title: 'Order Delivered',
      message,
      data: { orderId, discountCode },
    });
  }
}
