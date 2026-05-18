import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    type: string;
    discount: number;
    discountPercent?: number;
    discountAmount?: number;
  };
  message?: string;
  finalTotal?: number;
}

export interface CouponValidationContext {
  userId?: string;
  subtotal?: number;
  isFirstOrder?: boolean;
}

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validateCoupon(
    code: string,
    context?: CouponValidationContext,
  ): Promise<CouponValidationResult> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return {
        valid: false,
        message: 'Invalid coupon code',
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        message: 'Coupon is no longer active',
      };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return {
        valid: false,
        message: 'Coupon has expired',
      };
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        message: 'Coupon usage limit reached',
      };
    }

    if (coupon.minOrderAmount) {
      const minAmount = parseFloat(coupon.minOrderAmount.toString());
      if (context?.subtotal !== undefined && context.subtotal < minAmount) {
        return {
          valid: false,
          message: `Minimum order amount of $${minAmount.toFixed(2)} required`,
        };
      }
    }

    if (coupon.firstOrderOnly && context?.userId) {
      const existingOrders = await this.prisma.order.count({
        where: { userId: context.userId },
      });
      if (existingOrders > 0) {
        return {
          valid: false,
          message: 'This coupon is only valid for first-time orders',
        };
      }
    }

    const discount = parseFloat(coupon.discount.toString());
    let discountAmount = 0;
    let discountPercent: number | undefined;

    if (coupon.type === 'percent') {
      discountPercent = Math.round(discount);
      if (context?.subtotal !== undefined) {
        discountAmount = Math.round((context.subtotal * discount) / 100);
      }
    } else {
      discountAmount = discount;
      if (context?.subtotal !== undefined) {
        discountPercent = Math.round((discount / context.subtotal) * 100);
      }
    }

    const finalTotal = context?.subtotal !== undefined 
      ? Math.max(0, context.subtotal - discountAmount)
      : undefined;

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discount,
        discountPercent,
        discountAmount,
      },
      message: coupon.type === 'percent'
        ? `${discountPercent}% discount applied`
        : `$${discount.toFixed(2)} discount applied`,
      finalTotal,
    };
  }

  async applyCoupon(code: string, subtotal: number): Promise<{
    discountAmount: number;
    finalTotal: number;
    discountPercent: number;
  }> {
    const result = await this.validateCoupon(code, { subtotal });

    if (!result.valid || !result.coupon) {
      throw new BadRequestException(result.message || 'Invalid coupon');
    }

    return {
      discountAmount: result.coupon.discountAmount || 0,
      finalTotal: result.finalTotal || subtotal,
      discountPercent: result.coupon.discountPercent || 0,
    };
  }

  async redeemCoupon(code: string): Promise<void> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usedCount: { increment: 1 },
      },
    });

    this.logger.log(`Coupon ${code} redeemed`);
  }

  async createCoupon(data: {
    code: string;
    type: 'percent' | 'fixed';
    discount: number;
    minOrderAmount?: number;
    maxUses?: number;
    expiresAt?: Date;
    firstOrderOnly?: boolean;
  }): Promise<{ id: string; code: string }> {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        discount: data.discount,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
        firstOrderOnly: data.firstOrderOnly || false,
        isActive: true,
        usedCount: 0,
      },
    });

    return { id: coupon.id, code: coupon.code };
  }

  async getCouponByCode(code: string) {
    return this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  async deactivateCoupon(code: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { isActive: false },
    });
  }

  async getCouponStats(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      code: coupon.code,
      type: coupon.type,
      discount: parseFloat(coupon.discount.toString()),
      usedCount: coupon.usedCount,
      maxUses: coupon.maxUses,
      remaining: coupon.maxUses ? coupon.maxUses - coupon.usedCount : null,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt,
    };
  }
}
