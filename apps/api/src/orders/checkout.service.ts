import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { generateOrderNumber, calculateBulkDiscount, calculateCouponDiscount } from '../common/utils/helpers';

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async processCheckout(
    userId: string,
    items: CheckoutItem[],
    couponCode?: string,
    paymentMethod?: string,
    context?: CheckoutContext,
  ): Promise<any> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate all items and calculate totals
    const validatedItems: Array<{
      product: any;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      discount: number;
    }> = [];

    let subtotal = 0;

    for (const item of items) {
      const product = await this.productsService.getProductById(item.productId);

      if (!product.isActive) {
        throw new BadRequestException(`Product "${product.name}" is not available`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        );
      }

      if (item.quantity > product.maxPerOrder) {
        throw new BadRequestException(
          `Maximum quantity for "${product.name}" is ${product.maxPerOrder}`,
        );
      }

      // Calculate bulk discount
      const price = parseFloat(product.price.toString());
      const bulkDiscounts = product.bulkDiscounts as Array<{
        minQuantity: number;
        discountPercent: number;
      }> | null;

      const { discount, finalPrice } = calculateBulkDiscount(
        item.quantity,
        price,
        bulkDiscounts || [],
      );

      const totalPrice = finalPrice * item.quantity;
      subtotal += totalPrice;

      validatedItems.push({
        product,
        quantity: item.quantity,
        unitPrice: finalPrice,
        totalPrice,
        discount,
      });
    }

    // Apply coupon if provided
    let discount = 0;
    let coupon = null;
    
    if (couponCode) {
      coupon = await this.prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (!coupon) {
        throw new BadRequestException('Invalid coupon code');
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

      const couponResult = calculateCouponDiscount(
        subtotal,
        {
          type: coupon.type,
          value: parseFloat(coupon.value.toString()),
          minOrderAmount: coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount.toString()) : undefined,
        },
      );

      if (!couponResult) {
        throw new BadRequestException(
          `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`,
        );
      }

      discount = couponResult.discount;
    }

    const total = Math.max(0, subtotal - discount);

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          subtotal,
          discount,
          couponCode: couponCode?.toUpperCase(),
          couponDiscount: discount,
          total,
          paymentMethod: paymentMethod as any || 'PAYPAL',
          paymentStatus: 'PENDING',
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
        },
      });

      // Create order items and deduct stock
      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });

        // Deduct stock
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Update coupon usage
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      return newOrder;
    });

    // Update order status based on payment method
    let initialStatus = 'PENDING';
    if (paymentMethod === 'WALLET') {
      // For wallet, check balance immediately
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      const balance = parseFloat(wallet?.balance.toString() || '0');
      if (balance >= total) {
        initialStatus = 'AWAITING_PAYMENT'; // Will be converted to PAID after wallet deduction
      } else {
        throw new BadRequestException('Insufficient wallet balance');
      }
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: initialStatus as any },
    });

    this.logger.log(`Order ${orderNumber} created for user ${userId} with total $${total}`);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: initialStatus,
      subtotal,
      discount,
      total,
      paymentMethod: paymentMethod || 'PAYPAL',
      items: validatedItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      couponCode: couponCode?.toUpperCase(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
    };
  }

  private async generateOrderNumber(): Promise<string> {
    // Get and increment sequence
    const sequence = await this.prisma.$transaction(async (tx) => {
      const seq = await tx.orderSequence.upsert({
        where: { id: 'order_seq' },
        update: { value: { increment: 1 } },
        create: { id: 'order_seq', value: 1 },
      });
      return seq.value;
    });

    return generateOrderNumber(sequence);
  }

  async validateCart(items: CheckoutItem[]): Promise<{
    valid: boolean;
    errors: Array<{ productId: string; message: string }>;
    validItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      available: number;
    }>;
  }> {
    const errors: Array<{ productId: string; message: string }> = [];
    const validItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      available: number;
    }> = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, price: true, stock: true, maxPerOrder: true, isActive: true },
      });

      if (!product) {
        errors.push({ productId: item.productId, message: 'Product not found' });
        continue;
      }

      if (!product.isActive) {
        errors.push({ productId: item.productId, message: 'Product is not available' });
        continue;
      }

      if (product.stock < item.quantity) {
        errors.push({
          productId: item.productId,
          message: `Only ${product.stock} available`,
        });
        continue;
      }

      if (item.quantity > product.maxPerOrder) {
        errors.push({
          productId: item.productId,
          message: `Maximum ${product.maxPerOrder} per order`,
        });
        continue;
      }

      validItems.push({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price.toString()),
        quantity: item.quantity,
        available: product.stock,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      validItems,
    };
  }

  async previewCoupon(couponCode: string, subtotal: number) {
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

    const result = calculateCouponDiscount(
      subtotal,
      {
        type: coupon.type,
        value: parseFloat(coupon.value.toString()),
        minOrderAmount: coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount.toString()) : undefined,
      },
    );

    if (!result) {
      return {
        valid: false,
        message: `Minimum order of $${coupon.minOrderAmount} required`,
        discount: 0,
        finalTotal: subtotal,
      };
    }

    return {
      valid: true,
      message: `Coupon applied: ${coupon.type === 'PERCENTAGE' ? `${coupon.value}% off` : `$${coupon.value} off`}`,
      discount: result.discount,
      finalTotal: result.finalTotal,
      couponCode: coupon.code,
    };
  }
}
