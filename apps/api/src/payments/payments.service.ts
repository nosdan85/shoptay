import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NowPaymentsService } from './providers/nowpayments.service';
import { SquareService } from './providers/square.service';
import { PayPalFFService } from './providers/paypal-ff.service';
import { PaymentAttemptStatus, PaymentMethod } from '@prisma/client';
import { PaymentMethodType } from './dto/create-payment.dto';

export interface PaymentResult {
  paymentId: string;
  instructions: {
    method: string;
    [key: string]: any;
  };
  expiresAt?: Date;
}

export interface LTCPaymentResult extends PaymentResult {
  instructions: {
    method: 'ltc';
    payAddress: string;
    payAmount: string;
    payCurrency: string;
    qrImageUrl?: string;
    memoExpected?: string;
  };
}

export interface PayPalFFResult extends PaymentResult {
  instructions: {
    method: 'paypal_ff';
    email: string;
    memoExpected: string;
    amount: number;
  };
}

export interface CashAppResult extends PaymentResult {
  instructions: {
    method: 'cashapp';
    cashTag: string;
    referenceId: string;
    amountCents: number;
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly discordBotToken: string;
  private readonly discordGuildId: string;
  private readonly discordTicketCategoryId: string;
  private readonly cashAppTag: string;
  private readonly paypalEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly nowPaymentsService: NowPaymentsService,
    private readonly squareService: SquareService,
    private readonly paypalFFService: PayPalFFService,
  ) {
    this.discordBotToken = this.configService.get<string>('DISCORD_BOT_TOKEN') || '';
    this.discordGuildId = this.configService.get<string>('DISCORD_GUILD_ID') || '';
    this.discordTicketCategoryId = this.configService.get<string>('DISCORD_TICKET_CATEGORY_ID') || '';
    this.cashAppTag = this.configService.get<string>('CASHAPP_TAG') || '$yoko276';
    this.paypalEmail = this.configService.get<string>('PAYPAL_EMAIL') || 'paypal@example.com';
  }

  async createPayment(
    orderId: string,
    method: PaymentMethodType,
    userId: string,
    topupAmountCents?: number,
  ): Promise<PaymentResult | LTCPaymentResult | PayPalFFResult | CashAppResult> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: {
          select: { id: true, discordId: true, discordUsername: true },
        },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order is already paid');
    }

    const amountCents = topupAmountCents || order.total;
    const amount = amountCents / 100;
    const memoExpected = `NOS-${order.orderId}`;

    switch (method) {
      case PaymentMethodType.PAYPAL_FF:
        return this.createPayPalFFPayment(order, amount, memoExpected);
      case PaymentMethodType.CASHAPP:
        return this.createCashAppPayment(order, amountCents, memoExpected);
      case PaymentMethodType.LTC:
        return this.createLTCPayment(order, amount, memoExpected);
      case PaymentMethodType.WALLET:
        return this.createWalletPayment(order, amountCents, userId);
      default:
        throw new BadRequestException(`Unsupported payment method: ${method}`);
    }
  }

  private async createPayPalFFPayment(
    order: any,
    amount: number,
    memoExpected: string,
  ): Promise<PayPalFFResult> {
    const instructions = this.paypalFFService.generatePaymentInstructions(
      order.orderId,
      amount,
    );

    const payment = await this.prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        method: 'PAYPAL_FF' as PaymentMethod,
        status: 'PENDING' as PaymentAttemptStatus,
        amountCents: Math.round(amount * 100),
        currency: 'USD',
        memoExpected,
        providerReference: `PPFF-${order.orderId}`,
      },
    });

    this.logger.log(`PayPal F&F payment created: ${payment.id} for order ${order.orderId}`);

    return {
      paymentId: payment.id,
      instructions: {
        method: 'paypal_ff',
        email: instructions.email,
        memoExpected: instructions.memoExpected,
        amount,
        channelId: order.paypalTicketChannelId,
      },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }

  private async createCashAppPayment(
    order: any,
    amountCents: number,
    memoExpected: string,
  ): Promise<CashAppResult> {
    const payment = await this.prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        method: 'CASHAPP' as PaymentMethod,
        status: 'PENDING' as PaymentAttemptStatus,
        amountCents,
        currency: 'USD',
        memoExpected,
      },
    });

    this.logger.log(`CashApp payment record created: ${payment.id} for order ${order.orderId}`);

    return {
      paymentId: payment.id,
      instructions: {
        method: 'cashapp',
        cashTag: this.cashAppTag,
        referenceId: `NOS-${order.orderId}`,
        amountCents,
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  private async createLTCPayment(
    order: any,
    amountUSD: number,
    memoExpected: string,
  ): Promise<LTCPaymentResult> {
    try {
      const ltcPayment = await this.nowPaymentsService.createInvoice({
        orderId: order.id,
        amount: amountUSD,
        currency: 'USD',
      });

      const payment = await this.prisma.paymentAttempt.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          method: 'LTC' as PaymentMethod,
          status: 'PENDING' as PaymentAttemptStatus,
          amountCents: Math.round(amountUSD * 100),
          currency: 'USD',
          providerReference: ltcPayment.invoiceId,
          providerResponse: JSON.stringify(ltcPayment),
          memoExpected,
        },
      });

      this.logger.log(`LTC payment created: ${payment.id} for order ${order.orderId}`);

      return {
        paymentId: payment.id,
        instructions: {
          method: 'ltc',
          payAddress: ltcPayment.walletAddress,
          payAmount: ltcPayment.cryptoAmount,
          payCurrency: ltcPayment.currency,
          qrImageUrl: ltcPayment.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ltc:${ltcPayment.walletAddress}?amount=${ltcPayment.cryptoAmount}`,
          memoExpected,
        },
        expiresAt: ltcPayment.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create LTC payment: ${error}`);
      throw new BadRequestException('Failed to create LTC payment. Please try again.');
    }
  }

  private async createWalletPayment(
    order: any,
    amountCents: number,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.walletBalanceCents < amountCents) {
      throw new BadRequestException(
        `Insufficient wallet balance. You have $${(user.walletBalanceCents / 100).toFixed(2)} but need $${(amountCents / 100).toFixed(2)}`,
      );
    }

    const payment = await this.prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        userId,
        method: 'WALLET' as PaymentMethod,
        status: 'SUCCESS' as PaymentAttemptStatus,
        amountCents,
        currency: 'USD',
        completedAt: new Date(),
      },
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          walletBalanceCents: { decrement: amountCents },
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amountCents,
          balanceBeforeCents: user.walletBalanceCents,
          balanceAfterCents: user.walletBalanceCents - amountCents,
          method: 'WALLET',
          status: 'COMPLETED',
          orderId: order.id,
          discordId: order.discordId,
          discordUsername: order.discordUsername,
          direction: 'DEBIT',
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'WALLET',
          paidAt: new Date(),
        },
      }),
    ]);

    this.logger.log(`Wallet payment completed: ${payment.id} for order ${order.orderId}`);

    return {
      paymentId: payment.id,
      instructions: {
        method: 'wallet',
        deductedAmount: amountCents / 100,
        newBalance: (user.walletBalanceCents - amountCents) / 100,
      },
    };
  }

  async createCashAppPaymentRecord(
    orderId: string,
    amountCents: number,
    referenceId: string,
    userId: string,
  ) {
    const payment = await this.prisma.paymentAttempt.create({
      data: {
        orderId,
        userId,
        method: 'CASHAPP' as PaymentMethod,
        status: 'PENDING' as PaymentAttemptStatus,
        amountCents,
        currency: 'USD',
        providerReference: referenceId,
        memoExpected: `NOS-${referenceId}`,
      },
    });

    return payment;
  }

  async completeCashAppPayment(paymentId: string, sourceId: string, idempotencyKey?: string) {
    const payment = await this.prisma.paymentAttempt.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'SUCCESS') {
      return { success: true, message: 'Payment already completed' };
    }

    try {
      const result = await this.squareService.chargeCard({
        sourceId,
        amountCents: payment.amountCents || 0,
        currency: payment.currency || 'USD',
        idempotencyKey: idempotencyKey || `cashapp_${paymentId}_${Date.now()}`,
      });

      await this.prisma.paymentAttempt.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESS' as PaymentAttemptStatus,
          providerReference: result.paymentId,
          completedAt: new Date(),
        },
      });

      if (payment.orderId && payment.order) {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            paymentMethod: 'CASHAPP',
            paidAt: new Date(),
          },
        });
      }

      this.logger.log(`CashApp payment completed: ${paymentId} with Square ${result.paymentId}`);

      return {
        success: true,
        paymentId,
        providerReference: result.paymentId,
      };
    } catch (error) {
      this.logger.error(`CashApp payment failed: ${error}`);

      await this.prisma.paymentAttempt.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED' as PaymentAttemptStatus,
          failedAt: new Date(),
          providerResponse: JSON.stringify({ error: String(error) }),
        },
      });

      throw new BadRequestException('Payment failed. Please try again.');
    }
  }

  async markPaymentCompleted(paymentId: string, providerRef?: string) {
    const payment = await this.prisma.paymentAttempt.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCESS' as PaymentAttemptStatus,
        providerReference: providerRef,
        completedAt: new Date(),
      },
      include: { order: true },
    });

    if (payment.orderId && payment.order) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });
    }

    this.logger.log(`Payment marked as completed: ${paymentId}`);

    return payment;
  }

  async markPaymentFailed(paymentId: string, reason?: string) {
    const payment = await this.prisma.paymentAttempt.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED' as PaymentAttemptStatus,
        failedAt: new Date(),
        providerResponse: reason ? JSON.stringify({ error: reason }) : undefined,
      },
    });

    this.logger.log(`Payment marked as failed: ${paymentId}. Reason: ${reason}`);

    return payment;
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.paymentAttempt.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      paymentId: payment.id,
      status: payment.status,
      method: payment.method,
      amountCents: payment.amountCents,
      currency: payment.currency,
      providerReference: payment.providerReference,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      failedAt: payment.failedAt,
    };
  }

  async getOrderPayments(orderId: string) {
    const payments = await this.prisma.paymentAttempt.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      paymentId: p.id,
      status: p.status,
      method: p.method,
      amountCents: p.amountCents,
      currency: p.currency,
      providerReference: p.providerReference,
      createdAt: p.createdAt,
      completedAt: p.completedAt,
      failedAt: p.failedAt,
    }));
  }

  async processNowPaymentsWebhook(payload: any, signature: string) {
    const isValid = this.nowPaymentsService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      this.logger.warn('Invalid NOWPayments webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const { payment_id, payment_status, order_id, actually_paid, currency, tx_hash } = payload;

    this.logger.log(`NOWPayments webhook: ${payment_id} - ${payment_status} for order ${order_id}`);

    const payment = await this.prisma.paymentAttempt.findFirst({
      where: { providerReference: payment_id },
      include: { order: true },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for NOWPayments: ${payment_id}`);
      await this.logWebhook('nowpayments', payment_status, payload, signature);
      return { received: true };
    }

    if (payment_status === 'finished' || payment_status === 'partially_paid') {
      await this.markPaymentCompleted(payment.id, tx_hash);
    } else if (payment_status === 'failed' || payment_status === 'expired') {
      await this.markPaymentFailed(payment.id, `NOWPayments status: ${payment_status}`);
    }

    await this.logWebhook('nowpayments', payment_status, payload, signature);

    return { success: true, status: payment_status };
  }

  async processSquareWebhook(payload: any, signature: string) {
    const isValid = this.squareService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      this.logger.warn('Invalid Square webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const { type, data } = payload;

    this.logger.log(`Square webhook: ${type}`);

    if (type === 'payment.completed') {
      const squarePaymentId = data?.object?.payment?.id;

      if (squarePaymentId) {
        const payment = await this.prisma.paymentAttempt.findFirst({
          where: { providerReference: squarePaymentId },
        });

        if (payment) {
          await this.markPaymentCompleted(payment.id, squarePaymentId);
        }
      }
    }

    await this.logWebhook('square', type, payload, signature);

    return { success: true };
  }

  async getSquareConfig() {
    const config = this.squareService.getClientConfig();

    return {
      applicationId: config.applicationId,
      locationId: config.locationId,
      environment: config.environment,
    };
  }

  private async logWebhook(provider: string, eventType: string, payload: any, signature?: string) {
    try {
      await this.prisma.webhookLog.create({
        data: {
          provider,
          eventType,
          payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
          signature,
          status: 'RECEIVED',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log webhook: ${error}`);
    }
  }

  async getAvailablePaymentMethods() {
    return {
      methods: [
        {
          id: 'paypal_ff',
          name: 'PayPal',
          description: 'Friends & Family',
          requiresTicket: true,
          icon: 'paypal',
        },
        {
          id: 'cashapp',
          name: 'Cash App',
          description: '+10% conversion fee',
          requiresTicket: true,
          icon: 'cashapp',
        },
        {
          id: 'ltc',
          name: 'Litecoin',
          description: 'Crypto payment',
          requiresTicket: false,
          icon: 'crypto',
        },
        {
          id: 'wallet',
          name: 'Wallet Balance',
          description: 'Use your wallet funds',
          requiresTicket: false,
          icon: 'wallet',
        },
      ],
    };
  }

  async previewCoupon(couponCode: string, subtotalCents: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is no longer active');
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const minOrder = coupon.minOrderCents || 0;
    if (subtotalCents < minOrder) {
      throw new BadRequestException(`Minimum order of $${(minOrder / 100).toFixed(2)} required`);
    }

    let discountCents = 0;
    if (coupon.discountType === 'PERCENT') {
      discountCents = Math.round((subtotalCents * coupon.discountValue) / 100);
    } else {
      discountCents = coupon.discountValue;
    }

    if (coupon.maxDiscountCents && discountCents > coupon.maxDiscountCents) {
      discountCents = coupon.maxDiscountCents;
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountCents,
      finalTotalCents: Math.max(0, subtotalCents - discountCents),
    };
  }
}
