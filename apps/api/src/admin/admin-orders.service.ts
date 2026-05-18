import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllOrders(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, discordId: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.formatOrder(o, true)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderDetails(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            discordId: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrls: true,
              },
            },
          },
        },
        deliverySlot: true,
        payments: true,
        transactions: {
          include: {
            wallet: {
              include: {
                user: { select: { username: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order, true);
  }

  async markOrderPaid(orderId: string, txnId: string | undefined, note: string | undefined, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'COMPLETED') {
      throw new Error('Order is already paid');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COMPLETED',
        status: 'PROCESSING',
        adminNotes: note ? `${order.adminNotes || ''}\n[${adminId}] Marked paid: ${note}` : order.adminNotes,
      },
    });

    // Create payment record
    await this.prisma.payment.create({
      data: {
        orderId: orderId,
        userId: order.userId,
        method: order.paymentMethod || 'PAYPAL',
        status: 'COMPLETED',
        amount: order.total,
        paypalCaptureId: txnId,
        completedAt: new Date(),
      },
    });

    this.logger.log(`Order ${order.orderNumber} marked as paid by ${adminId}`);

    return {
      success: true,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  }

  async cancelOrder(orderId: string, reason: string | undefined, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
      throw new Error('Cannot cancel order at this stage');
    }

    // Restore stock
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    // Refund wallet if applicable
    if (order.paymentMethod === 'WALLET' && order.paymentStatus === 'COMPLETED') {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: order.userId },
      });

      if (wallet) {
        const amount = parseFloat(order.total.toString());
        await this.prisma.$transaction([
          this.prisma.wallet.update({
            where: { userId: order.userId },
            data: {
              balance: { increment: amount },
            },
          }),
          this.prisma.transaction.create({
            data: {
              walletId: wallet.id,
              orderId: order.id,
              type: 'REFUND',
              amount,
              balanceBefore: parseFloat(wallet.balance.toString()),
              balanceAfter: parseFloat(wallet.balance.toString()) + amount,
              description: `Order cancelled - Refund`,
            },
          }),
        ]);
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        adminNotes: `[${adminId}] Cancelled: ${reason || 'No reason provided'}`,
      },
    });

    this.logger.log(`Order ${order.orderNumber} cancelled by ${adminId}`);

    return {
      success: true,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  }

  async startDelivery(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PROCESSING') {
      throw new Error('Order must be in PROCESSING status to start delivery');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY_FOR_DELIVERY' },
    });

    this.logger.log(`Order ${order.orderNumber} delivery started`);

    return {
      success: true,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  }

  async markDelivered(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'READY_FOR_DELIVERY') {
      throw new Error('Order must be in READY_FOR_DELIVERY status');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' },
    });

    this.logger.log(`Order ${order.orderNumber} marked as delivered`);

    return {
      success: true,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  }

  async updateOrderNotes(orderId: string, notes: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        adminNotes: `[${adminId}] ${new Date().toISOString()}:\n${notes}\n\n${order.adminNotes || ''}`,
      },
    });

    return {
      success: true,
      notes: updated.adminNotes,
    };
  }

  async getOrderCountsByStatus() {
    const counts = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return counts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);
  }

  private formatOrder(order: any, includePrivate = false) {
    const result: any = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: parseFloat(order.subtotal.toString()),
      total: parseFloat(order.total.toString()),
      items: order.items?.map((item: any) => ({
        id: item.id,
        productName: item.product?.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice.toString()),
        totalPrice: parseFloat(item.totalPrice.toString()),
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    if (order.robloxUsername) {
      result.robloxUsername = order.robloxUsername;
    }

    if (order.deliverySlot) {
      result.deliverySlot = {
        date: order.deliverySlot.date,
        startTime: order.deliverySlot.startTime,
        endTime: order.deliverySlot.endTime,
      };
    }

    if (includePrivate) {
      result.user = order.user;
      result.adminNotes = order.adminNotes;
      result.ipAddress = order.ipAddress;
      result.deliveryTime = order.deliveryTime;
      result.customerTimezone = order.customerTimezone;
    }

    return result;
  }
}
