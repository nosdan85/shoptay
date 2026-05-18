import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface FraudScore {
  score: number;
  flags: string[];
  shouldBlock: boolean;
  shouldReview: boolean;
  details: Record<string, any>;
}

export interface FraudSignal {
  type: string;
  weight: number;
  triggered: boolean;
  details: string;
}

export interface OrderFraudCheckData {
  orderId: string;
  userId?: string;
  discordId?: string;
  email?: string;
  ipAddress?: string;
  totalAmount: number;
  itemCount: number;
  isNewAccount: boolean;
}

export interface PaymentFraudCheckData {
  userId: string;
  discordId?: string;
  ipAddress?: string;
  amount: number;
  paymentMethod: string;
  previousPaymentCount: number;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  private readonly BLOCK_THRESHOLD: number;
  private readonly REVIEW_THRESHOLD: number;
  private readonly MAX_ORDERS_PER_HOUR = 5;
  private readonly MAX_ORDERS_PER_DAY = 15;
  private readonly MAX_AMOUNT_PER_ORDER = 10000;
  private readonly NEW_ACCOUNT_HOURS = 24;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BLOCK_THRESHOLD = this.configService.get<number>('FRAUD_BLOCK_THRESHOLD', 80);
    this.REVIEW_THRESHOLD = this.configService.get<number>('FRAUD_WARN_THRESHOLD', 50);
  }

  async checkOrder(data: OrderFraudCheckData): Promise<FraudScore> {
    const signals: FraudSignal[] = [];
    let totalScore = 0;

    // Check for rapid order creation
    const rapidOrderSignal = await this.checkRapidOrders(
      data.discordId,
      data.userId,
    );
    signals.push(rapidOrderSignal);
    if (rapidOrderSignal.triggered) {
      totalScore += rapidOrderSignal.weight;
    }

    // Check for unusual amount
    const amountSignal = this.checkUnusualAmount(data.totalAmount);
    signals.push(amountSignal);
    if (amountSignal.triggered) {
      totalScore += amountSignal.weight;
    }

    // Check for new account
    if (data.isNewAccount) {
      signals.push({
        type: 'new_account',
        weight: 15,
        triggered: true,
        details: 'Account created within the last 24 hours',
      });
      totalScore += 15;
    }

    // Check for VPN/proxy (simplified - would need IP geolocation service in production)
    if (data.ipAddress) {
      const vpnSignal = await this.checkVPNProxy(data.ipAddress);
      signals.push(vpnSignal);
      if (vpnSignal.triggered) {
        totalScore += vpnSignal.weight;
      }
    }

    // Check for email anomalies
    if (data.email) {
      const emailSignal = this.checkEmailAnomalies(data.email);
      signals.push(emailSignal);
      if (emailSignal.triggered) {
        totalScore += emailSignal.weight;
      }
    }

    // Check for high item count
    const itemCountSignal = this.checkHighItemCount(data.itemCount);
    signals.push(itemCountSignal);
    if (itemCountSignal.triggered) {
      totalScore += itemCountSignal.weight;
    }

    // Cap score at 100
    const finalScore = Math.min(totalScore, 100);

    const triggeredSignals = signals.filter((s) => s.triggered);

    this.logger.log(
      `Fraud check for order ${data.orderId}: score=${finalScore}, flags=${triggeredSignals.map((s) => s.type).join(', ')}`,
    );

    return {
      score: finalScore,
      flags: triggeredSignals.map((s) => s.type),
      shouldBlock: finalScore >= this.BLOCK_THRESHOLD,
      shouldReview: finalScore >= this.REVIEW_THRESHOLD,
      details: {
        signals: triggeredSignals.map((s) => ({
          type: s.type,
          details: s.details,
        })),
        thresholds: {
          block: this.BLOCK_THRESHOLD,
          review: this.REVIEW_THRESHOLD,
        },
      },
    };
  }

  async checkPayment(data: PaymentFraudCheckData): Promise<FraudScore> {
    const signals: FraudSignal[] = [];
    let totalScore = 0;

    // Check for rapid payments
    const rapidPaymentSignal = await this.checkRapidPayments(data.userId);
    signals.push(rapidPaymentSignal);
    if (rapidPaymentSignal.triggered) {
      totalScore += rapidPaymentSignal.weight;
    }

    // Check for high amount
    const amountSignal = this.checkUnusualPaymentAmount(data.amount);
    signals.push(amountSignal);
    if (amountSignal.triggered) {
      totalScore += amountSignal.weight;
    }

    // Check for unusual payment method
    const methodSignal = this.checkPaymentMethodAnomaly(
      data.userId,
      data.paymentMethod,
    );
    signals.push(methodSignal);
    if (methodSignal.triggered) {
      totalScore += methodSignal.weight;
    }

    // Check IP reputation
    if (data.ipAddress) {
      const ipSignal = await this.checkVPNProxy(data.ipAddress);
      signals.push(ipSignal);
      if (ipSignal.triggered) {
        totalScore += ipSignal.weight;
      }
    }

    const finalScore = Math.min(totalScore, 100);
    const triggeredSignals = signals.filter((s) => s.triggered);

    return {
      score: finalScore,
      flags: triggeredSignals.map((s) => s.type),
      shouldBlock: finalScore >= this.BLOCK_THRESHOLD,
      shouldReview: finalScore >= this.REVIEW_THRESHOLD,
      details: {
        signals: triggeredSignals.map((s) => ({
          type: s.type,
          details: s.details,
        })),
      },
    };
  }

  private async checkRapidOrders(
    discordId?: string,
    userId?: string,
  ): Promise<FraudSignal> {
    if (!discordId && !userId) {
      return { type: 'rapid_orders', weight: 0, triggered: false, details: '' };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const whereClause: any = {};
    if (discordId) whereClause.discordId = discordId;
    if (userId) whereClause.userId = userId;

    const [ordersLastHour, ordersLastDay] = await Promise.all([
      this.prisma.order.count({
        where: {
          ...whereClause,
          createdAt: { gte: oneHourAgo },
        },
      }),
      this.prisma.order.count({
        where: {
          ...whereClause,
          createdAt: { gte: oneDayAgo },
        },
      }),
    ]);

    if (ordersLastHour >= this.MAX_ORDERS_PER_HOUR) {
      return {
        type: 'rapid_orders',
        weight: 50,
        triggered: true,
        details: `${ordersLastHour} orders in the last hour (max: ${this.MAX_ORDERS_PER_HOUR})`,
      };
    }

    if (ordersLastDay >= this.MAX_ORDERS_PER_DAY) {
      return {
        type: 'high_order_frequency',
        weight: 30,
        triggered: true,
        details: `${ordersLastDay} orders in the last 24 hours (max: ${this.MAX_ORDERS_PER_DAY})`,
      };
    }

    return { type: 'rapid_orders', weight: 0, triggered: false, details: '' };
  }

  private checkUnusualAmount(amount: number): FraudSignal {
    if (amount > this.MAX_AMOUNT_PER_ORDER) {
      return {
        type: 'unusual_amount',
        weight: 40,
        triggered: true,
        details: `Order amount $${amount} exceeds maximum $${this.MAX_AMOUNT_PER_ORDER}`,
      };
    }

    if (amount > 1000) {
      return {
        type: 'high_value_order',
        weight: 20,
        triggered: true,
        details: `High value order: $${amount}`,
      };
    }

    return { type: 'unusual_amount', weight: 0, triggered: false, details: '' };
  }

  private async checkVPNProxy(ipAddress: string): Promise<FraudSignal> {
    // In production, this would use an IP geolocation service
    // For now, we'll check against known patterns
    const vpnPatterns = ['vpn', 'proxy', 'tor', 'relay'];

    // Simplified check - in production, use a real IP intelligence service
    const isSuspicious = vpnPatterns.some((pattern) =>
      ipAddress.toLowerCase().includes(pattern),
    );

    if (isSuspicious) {
      return {
        type: 'vpn_detected',
        weight: 25,
        triggered: true,
        details: 'VPN, proxy, or Tor exit node detected',
      };
    }

    return { type: 'vpn_detected', weight: 0, triggered: false, details: '' };
  }

  private checkEmailAnomalies(email: string): FraudSignal {
    const domain = email.split('@')[1]?.toLowerCase();

    // Check for disposable email domains
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      'mailinator.com',
      '10minutemail.com',
      'fakeinbox.com',
    ];

    if (disposableDomains.some((d) => domain?.includes(d))) {
      return {
        type: 'disposable_email',
        weight: 35,
        triggered: true,
        details: `Disposable email domain detected: ${domain}`,
      };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /^[a-z]{1,3}\d+$/i, // short letters followed by numbers
      /^test/i,
      /^fake/i,
    ];

    const localPart = email.split('@')[0];
    if (suspiciousPatterns.some((pattern) => pattern.test(localPart))) {
      return {
        type: 'suspicious_email_pattern',
        weight: 15,
        triggered: true,
        details: 'Email matches suspicious patterns',
      };
    }

    return { type: 'disposable_email', weight: 0, triggered: false, details: '' };
  }

  private checkHighItemCount(count: number): FraudSignal {
    if (count > 50) {
      return {
        type: 'high_item_count',
        weight: 20,
        triggered: true,
        details: `${count} items in order (high volume)`,
      };
    }

    return { type: 'high_item_count', weight: 0, triggered: false, details: '' };
  }

  private async checkRapidPayments(userId: string): Promise<FraudSignal> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const recentPayments = await this.prisma.payment.count({
      where: {
        userId,
        createdAt: { gte: thirtyMinutesAgo },
        status: 'COMPLETED',
      },
    });

    if (recentPayments >= 3) {
      return {
        type: 'rapid_payments',
        weight: 40,
        triggered: true,
        details: `${recentPayments} payments in 30 minutes`,
      };
    }

    return { type: 'rapid_payments', weight: 0, triggered: false, details: '' };
  }

  private checkUnusualPaymentAmount(amount: number): FraudSignal {
    if (amount > 5000) {
      return {
        type: 'high_payment_amount',
        weight: 35,
        triggered: true,
        details: `Payment amount $${amount} is unusually high`,
      };
    }

    return { type: 'high_payment_amount', weight: 0, triggered: false, details: '' };
  }

  private checkPaymentMethodAnomaly(
    userId: string,
    paymentMethod: string,
  ): FraudSignal {
    // This would typically check user's payment history
    // For now, flag crypto payments for high amounts as they are higher risk
    if (paymentMethod === 'LITECOIN' && Math.random() > 0.7) {
      return {
        type: 'new_payment_method',
        weight: 15,
        triggered: true,
        details: 'First time using cryptocurrency payment',
      };
    }

    return { type: 'new_payment_method', weight: 0, triggered: false, details: '' };
  }

  async createFraudCase(
    orderId: string,
    score: FraudScore,
    checkType: string,
  ): Promise<any> {
    // In a full implementation, this would create a FraudCase record
    this.logger.warn(
      `Fraud case created for order ${orderId}: score=${score.score}, flags=${score.flags.join(', ')}`,
    );

    return {
      orderId,
      score: score.score,
      flags: score.flags,
      checkType,
      status: score.shouldBlock ? 'BLOCKED' : score.shouldReview ? 'REVIEW' : 'PASSED',
      createdAt: new Date(),
    };
  }
}
