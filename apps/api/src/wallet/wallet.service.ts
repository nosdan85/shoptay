import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopupService } from './topup.service';
import { WalletQueryDto } from './dto/wallet-query.dto';
import { CreateTopupDto } from './dto/create-topup.dto';
import { TopupMethod } from './dto/create-topup.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topupService: TopupService,
  ) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        topups: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          topups: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
    }

    return {
      id: wallet.id,
      balance: parseFloat(wallet.balance.toString()),
      currency: 'USD',
      balanceCents: Math.round(parseFloat(wallet.balance.toString()) * 100),
      transactions: wallet.transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount.toString()),
        balanceBefore: parseFloat(t.balanceBefore.toString()),
        balanceAfter: parseFloat(t.balanceAfter.toString()),
        description: t.description,
        orderId: t.orderId,
        createdAt: t.createdAt,
      })),
      pendingTopups: wallet.topups.map((t: any) => ({
        id: t.id,
        amount: parseFloat(t.amount.toString()),
        method: t.method,
        status: t.status,
        createdAt: t.createdAt,
      })),
    };
  }

  async getTransactions(userId: string, query: WalletQueryDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const { page = 1, limit = 20, type, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { walletId: wallet.id };
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount.toString()),
        balanceBefore: parseFloat(t.balanceBefore.toString()),
        balanceAfter: parseFloat(t.balanceAfter.toString()),
        description: t.description,
        orderId: t.orderId,
        metadata: t.metadata,
        createdAt: t.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createTopup(userId: string, dto: CreateTopupDto) {
    const amountCents = dto.amount;
    if (amountCents < 100) {
      throw new BadRequestException('Minimum topup amount is $1.00');
    }

    const amount = amountCents / 100;

    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }

    const topup = await this.prisma.topup.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        method: dto.method,
        status: 'PENDING',
      },
    });

    const instructions = await this.topupService.generatePaymentInstructions(
      topup.id,
      dto.method,
      amountCents,
    );

    const squareConfig = dto.method === 'CASHAPP' || dto.method === 'SQUARE'
      ? this.topupService.getSquareConfig()
      : undefined;

    this.logger.log(`Topup ${topup.id} created for user ${userId}: $${amount}`);

    return {
      topup: {
        id: topup.id,
        amount,
        method: topup.method,
        status: topup.status,
        createdAt: topup.createdAt,
      },
      instructions,
      squareConfig,
    };
  }

  async completeTopup(topupId: string, squarePaymentId: string | undefined, userId: string) {
    const topup = await this.prisma.topup.findFirst({
      where: { id: topupId, userId },
      include: { wallet: true, user: true },
    });

    if (!topup) {
      throw new NotFoundException('Topup not found');
    }

    if (topup.status !== 'PENDING') {
      throw new BadRequestException('Topup is not pending');
    }

    if (squarePaymentId) {
      await this.prisma.topup.update({
        where: { id: topupId },
        data: { squarePaymentId },
      });
    }

    const wallet = await this.creditTopup(topup.id);

    this.logger.log(`Topup ${topupId} completed by user ${userId}`);

    return {
      success: true,
      topupId: topup.id,
      amount: parseFloat(topup.amount.toString()),
      newBalance: parseFloat(wallet.balance.toString()),
    };
  }

  async creditTopup(topupId: string) {
    const topup = await this.prisma.topup.findUnique({
      where: { id: topupId },
      include: { wallet: true, user: true },
    });

    if (!topup) {
      throw new NotFoundException('Topup not found');
    }

    if (topup.status !== 'PENDING') {
      throw new BadRequestException('Topup is not pending');
    }

    const amount = parseFloat(topup.amount.toString());
    const balanceBefore = parseFloat(topup.wallet.balance.toString());

    const [wallet] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: topup.walletId },
        data: {
          balance: { increment: amount },
        },
      }),
      this.prisma.topup.update({
        where: { id: topupId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: topup.walletId,
          type: 'TOPUP',
          amount,
          balanceBefore,
          balanceAfter: balanceBefore + amount,
          description: `Wallet topup via ${topup.method}`,
          metadata: {
            topupId: topup.id,
            method: topup.method,
            userDiscordId: topup.user.discordId,
          },
        },
      }),
    ]);

    this.logger.log(`Topup ${topupId} completed, credited $${amount} to wallet`);

    return wallet;
  }

  async cancelTopup(topupId: string, userId: string) {
    const topup = await this.prisma.topup.findFirst({
      where: { id: topupId, userId },
    });

    if (!topup) {
      throw new NotFoundException('Topup not found');
    }

    if (topup.status !== 'PENDING') {
      throw new BadRequestException('Cannot cancel completed topup');
    }

    await this.prisma.topup.update({
      where: { id: topupId },
      data: { status: 'FAILED' },
    });

    this.logger.log(`Topup ${topupId} cancelled by user ${userId}`);

    return { success: true, message: 'Topup cancelled' };
  }

  async creditRefund(userId: string, amount: number, orderId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const balanceBefore = parseFloat(wallet.balance.toString());

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: {
          balance: { increment: amount },
        },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          orderId,
          type: 'REFUND',
          amount,
          balanceBefore,
          balanceAfter: balanceBefore + amount,
          description: `Refund for order ${orderId}`,
          metadata: { orderId, reason: 'refund' },
        },
      }),
    ]);

    this.logger.log(`Refund of $${amount} credited to wallet ${wallet.id}`);

    return updatedWallet;
  }

  async debitPurchase(orderId: string, userId: string, amountCents: number) {
    const amount = amountCents / 100;

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const balance = parseFloat(wallet.balance.toString());
    if (balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
        },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          orderId,
          type: 'PURCHASE',
          amount: -amount,
          balanceBefore: balance,
          balanceAfter: balance - amount,
          description: `Purchase - Order ${orderId}`,
          metadata: { orderId, paymentMethod: 'wallet' },
        },
      }),
    ]);

    this.logger.log(`Deducted $${amount} from wallet ${wallet.id} for order ${orderId}`);

    return updatedWallet;
  }

  async adjustBalance(adminId: string, dto: { userId: string; amountCents: number; note?: string }) {
    const { userId, amountCents, note } = dto;
    const amount = amountCents / 100;

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const balanceBefore = parseFloat(wallet.balance.toString());
    const newBalance = amount >= 0 ? balanceBefore + amount : balanceBefore - Math.abs(amount);

    if (newBalance < 0) {
      throw new BadRequestException('Cannot debit below zero balance');
    }

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: {
          balance: amount >= 0 ? { increment: amount } : { decrement: Math.abs(amount) },
        },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DISCOUNT',
          amount,
          balanceBefore,
          balanceAfter: newBalance,
          description: note || `Manual adjustment by admin`,
          metadata: {
            adminId,
            reason: note,
            previousBalance: balanceBefore,
            newBalance,
          },
        },
      }),
    ]);

    this.logger.log(`Admin ${adminId} adjusted wallet ${wallet.id}: ${amount >= 0 ? '+' : ''}${amount}, note: ${note}`);

    return {
      success: true,
      userId,
      previousBalance: balanceBefore,
      adjustment: amount,
      newBalance: parseFloat(updatedWallet.balance.toString()),
      note,
    };
  }

  async getAllPendingTopups(query: { page?: number; limit?: number; method?: string }) {
    const { page = 1, limit = 20, method } = query;
    const skip = (page - 1) * limit;

    const where: any = { status: 'PENDING' };
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
          user: {
            select: { id: true, username: true, discordId: true, avatar: true },
          },
        },
      }),
      this.prisma.topup.count({ where }),
    ]);

    return {
      data: topups.map((t: any) => ({
        id: t.id,
        amount: parseFloat(t.amount.toString()),
        amountCents: Math.round(parseFloat(t.amount.toString()) * 100),
        method: t.method,
        status: t.status,
        referenceCode: `TOP-${t.id.slice(-8).toUpperCase()}`,
        user: t.user,
        squarePaymentId: t.squarePaymentId,
        createdAt: t.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTransactions(query: WalletQueryDto) {
    const { page = 1, limit = 50, type, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            select: {
              user: { select: { id: true, username: true, discordId: true } },
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount.toString()),
        amountCents: Math.round(parseFloat(t.amount.toString()) * 100),
        balanceBefore: parseFloat(t.balanceBefore.toString()),
        balanceAfter: parseFloat(t.balanceAfter.toString()),
        description: t.description,
        orderId: t.orderId,
        metadata: t.metadata,
        user: t.wallet.user,
        createdAt: t.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveTopup(topupId: string, adminId: string) {
    const topup = await this.prisma.topup.findUnique({
      where: { id: topupId },
      include: { wallet: true },
    });

    if (!topup) {
      throw new NotFoundException('Topup not found');
    }

    if (topup.status !== 'PENDING') {
      throw new BadRequestException('Topup is not pending');
    }

    await this.creditTopup(topupId);

    this.logger.log(`Topup ${topupId} approved by admin ${adminId}`);

    return { success: true, message: 'Topup approved and wallet credited' };
  }

  async rejectTopup(topupId: string, adminId: string, reason?: string) {
    const topup = await this.prisma.topup.findFirst({
      where: { id: topupId },
    });

    if (!topup) {
      throw new NotFoundException('Topup not found');
    }

    if (topup.status !== 'PENDING') {
      throw new BadRequestException('Topup is not pending');
    }

    await this.prisma.topup.update({
      where: { id: topupId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    });

    this.logger.log(`Topup ${topupId} rejected by admin ${adminId}: ${reason || 'No reason'}`);

    return { success: true, message: 'Topup rejected' };
  }
}

