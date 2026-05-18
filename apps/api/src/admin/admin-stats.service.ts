import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminDashboardStats {
  revenue: {
    total: number;
    currency: string;
    completedOrders: number;
  };
  orders: {
    total: number;
    pending: number;
    paid: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  users: {
    total: number;
    linkedDiscord: number;
  };
  pendingTopups: {
    count: number;
    totalAmount: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    discordUsername: string | null;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: Date;
  }>;
  topupStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalAmount: number;
    recentAmount: number;
  };
}

@Injectable()
export class AdminStatsService {
  private readonly logger = new Logger(AdminStatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [
      totalUsers,
      linkedDiscordUsers,
      totalOrders,
      pendingOrders,
      paidOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      pendingTopups,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      revenueResult,
      recentOrders,
      topupStats,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { discordId: { not: null } } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.order.count({ where: { status: 'PROCESSING' } }),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.topup.findMany({
        where: { status: 'PENDING' },
        select: { amount: true },
      }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { stock: 0 } }),
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          discordUsername: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
      this.getTopupStats(),
    ]);

    const pendingTopupAmount = pendingTopups.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0,
    );

    return {
      revenue: {
        total: parseFloat(revenueResult._sum.totalAmount?.toString() || '0'),
        currency: 'USD',
        completedOrders,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        paid: paidOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      },
      users: {
        total: totalUsers,
        linkedDiscord: linkedDiscordUsers,
      },
      pendingTopups: {
        count: pendingTopups.length,
        totalAmount: pendingTopupAmount,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        discordUsername: o.discordUsername,
        total: parseFloat(o.totalAmount.toString()),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      })),
      topupStats,
    };
  }

  private async getTopupStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [counts, recentAmounts, allTimeCompleted] = await Promise.all([
      Promise.all([
        this.prisma.topup.count({ where: { status: 'PENDING' } }),
        this.prisma.topup.count({ where: { status: 'PENDING' } }),
        this.prisma.topup.count({ where: { status: 'COMPLETED' } }),
        this.prisma.topup.count({ where: { status: 'FAILED' } }),
      ]),
      this.prisma.topup.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: sevenDaysAgo },
        },
        _sum: { amount: true },
      }),
      this.prisma.topup.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      pending: counts[0],
      processing: counts[1],
      completed: counts[2],
      failed: counts[3],
      recentAmount: parseFloat(recentAmounts._sum.amount?.toString() || '0'),
      totalAmount: parseFloat(allTimeCompleted._sum.amount?.toString() || '0'),
    };
  }

  async getRevenueByPeriod(
    period: '7d' | '30d' | '90d' | 'all' = '30d',
  ): Promise<{
    period: string;
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    dailyRevenue: Record<string, number>;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate },
      },
      orderBy: { completedAt: 'asc' },
    });

    const dailyRevenue: Record<string, number> = {};
    let totalRevenue = 0;

    for (const order of orders) {
      const day = order.completedAt?.toISOString().split('T')[0] || 'unknown';
      const amount = parseFloat(order.totalAmount.toString());
      dailyRevenue[day] = (dailyRevenue[day] || 0) + amount;
      totalRevenue += amount;
    }

    return {
      period,
      startDate,
      endDate: now,
      totalRevenue,
      orderCount: orders.length,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      dailyRevenue,
    };
  }
}
