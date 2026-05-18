import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService?: WalletService,
  ) {}

  async getStats() {
    const [
      totalUsers,
      totalOrders,
      completedOrders,
      pendingTopups,
      totalProducts,
      activeProducts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.topup.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
    ]);

    const revenueResult = await this.prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { total: true },
    });

    const revenue = parseFloat(revenueResult._sum.total?.toString() || '0');

    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
      },
    });

    return {
      users: { total: totalUsers },
      orders: { total: totalOrders, completed: completedOrders },
      revenue: { total: revenue, currency: 'USD' },
      products: { total: totalProducts, active: activeProducts },
      pending: { topups: pendingTopups },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: parseFloat(o.total.toString()),
        username: o.user.username,
        createdAt: o.createdAt,
      })),
    };
  }

  async getRevenueStats(period = '30d') {
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
      const amount = parseFloat(order.total.toString());
      dailyRevenue[day] = (dailyRevenue[day] || 0) + amount;
      totalRevenue += amount;
    }

    return {
      period,
      startDate,
      endDate: now,
      totalRevenue,
      dailyRevenue,
      orderCount: orders.length,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { discordId: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          discordId: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        ...u,
        orderCount: u._count.orders,
        _count: undefined,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        wallet: {
          include: {
            transactions: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        topups: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true, sessions: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      orderCount: user._count.orders,
      sessionCount: user._count.sessions,
      wallet: user.wallet
        ? {
            id: user.wallet.id,
            balance: parseFloat(user.wallet.balance.toString()),
            balanceCents: Math.round(parseFloat(user.wallet.balance.toString()) * 100),
            recentTransactions: user.wallet.transactions.map((t) => ({
              id: t.id,
              type: t.type,
              amount: parseFloat(t.amount.toString()),
              description: t.description,
              createdAt: t.createdAt,
            })),
          }
        : null,
      recentOrders: user.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: parseFloat(o.totalAmount.toString()),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      })),
      recentTopups: user.topups.map((t) => ({
        id: t.id,
        amount: parseFloat(t.amount.toString()),
        method: t.method,
        status: t.status,
        createdAt: t.createdAt,
      })),
    };
  }

  async updateUser(
    userId: string,
    data: { role?: string; username?: string },
    adminId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};
    if (data.role) {
      updateData.role = data.role;
    }
    if (data.username) {
      updateData.username = data.username;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User ${userId} updated by ${adminId}: ${JSON.stringify(data)}`);

    return { success: true, user: updated };
  }

  async updateUserRole(userId: string, role: string, adminId: string) {
    const validRoles = ['USER', 'MODERATOR', 'ADMIN', 'OWNER'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    this.logger.log(`User ${userId} role updated to ${role} by ${adminId}`);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async getAllTopups(query: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
  }) {
    const { page = 1, limit = 20, status, method } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (method) {
      where.method = method;
    }

    const [topups, total] = await Promise.all([
      this.prisma.topup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, discordId: true } },
        },
      }),
      this.prisma.topup.count({ where }),
    ]);

    return {
      data: topups.map((t) => ({
        id: t.id,
        amount: parseFloat(t.amount.toString()),
        amountCents: Math.round(parseFloat(t.amount.toString()) * 100),
        method: t.method,
        status: t.status,
        referenceCode: `TOP-${t.id.slice(-8).toUpperCase()}`,
        user: t.user,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingTopups(page = 1, limit = 20) {
    return this.getAllTopups({ page, limit, status: 'PENDING' });
  }

  async approveTopup(topupId: string, adminId: string) {
    const topup = await this.prisma.topup.findUnique({
      where: { id: topupId },
      include: { wallet: true },
    });

    if (!topup) {
      throw new NotFoundException('Topup not found');
    }

    const amount = parseFloat(topup.amount.toString());

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: topup.walletId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.topup.update({
        where: { id: topupId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: topup.walletId,
          type: 'TOPUP',
          amount,
          balanceBefore: parseFloat(topup.wallet.balance.toString()),
          balanceAfter: parseFloat(topup.wallet.balance.toString()) + amount,
          description: `Admin approved topup - ${adminId}`,
        },
      }),
    ]);

    this.logger.log(`Topup ${topupId} approved by ${adminId}`);

    return { success: true, message: 'Topup approved and credited' };
  }

  async rejectTopup(topupId: string, adminId: string, reason?: string) {
    await this.prisma.topup.update({
      where: { id: topupId },
      data: { status: 'FAILED', completedAt: new Date() },
    });

    this.logger.log(`Topup ${topupId} rejected by ${adminId}: ${reason || 'No reason'}`);

    return { success: true, message: 'Topup rejected' };
  }

  async getProductsOverview() {
    const [total, active, inactive, outOfStock] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { isActive: false } }),
      this.prisma.product.count({ where: { stock: 0 } }),
    ]);

    return { total, active, inactive, outOfStock };
  }

  async getAuditLog(page = 1, limit = 50, action?: string) {
    const skip = (page - 1) * limit;

    const orders = await this.prisma.order.findMany({
      where: { adminNotes: { not: null } },
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        adminNotes: true,
        updatedAt: true,
        user: { select: { username: true } },
      },
    });

    return {
      data: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        action: 'ADMIN_NOTE',
        description: o.adminNotes,
        username: o.user.username,
        timestamp: o.updatedAt,
      })),
      meta: { page, limit },
    };
  }

  async deleteUser(userId: string, adminId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger.log(`User ${userId} deleted by ${adminId}`);

    return { success: true, message: 'User deleted' };
  }
}
