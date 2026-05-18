import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { WalletService } from '../wallet/wallet.service';
import { CouponService } from './coupon.service';
import { 
  generateOrderNumber, 
  calculateBulkDiscount, 
  convertToTimezone,
  generateCouponCode 
} from '../common/utils/helpers';
import { Prisma } from '@prisma/client';

export interface LinkRobloxData {
  username: string;
  userId?: string;
  displayName?: string;
}

export interface SelectSlotData {
  slotId: string;
  customerTimezone: string;
}

export interface CreateOrderData {
  items: Array<{ productId: string; quantity: number }>;
  couponCode?: string;
  discordId?: string;
  discordUsername?: string;
  customerEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ItemPricingResult {
  regularUnits: number;
  bulkUnits: number;
  lineTotal: number;
  bulkApplied: boolean;
}

const BULK_DISCOUNT_THRESHOLD = 10;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    private readonly couponService: CouponService,
  ) {}

  async createOrder(dto: CreateOrderData, userId?: string): Promise<{
    orderId: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    discount: number;
    discountPercent?: number;
    couponCode?: string;
    total: number;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    expiresAt: Date;
  }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const validatedItems: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      bulkPrice: number;
      lineTotal: number;
      pricing: ItemPricingResult;
    }> = [];

    let subtotal = 0;

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { category: true },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product "${product.name}" is not available`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        );
      }

      if (item.quantity > 100000) {
        throw new BadRequestException(
          `Maximum quantity for "${product.name}" is 100,000`,
        );
      }

      const regularPrice = parseFloat(product.price.toString());
      const bulkDiscounts = (product.bulkDiscounts as Array<{
        minQuantity: number;
        discountPercent: number;
      }>) || [];

      const pricing = this.calculateItemPricing(
        item.quantity,
        regularPrice,
        bulkDiscounts,
      );

      subtotal += pricing.lineTotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: pricing.bulkApplied ? pricing.lineTotal / item.quantity : regularPrice,
        bulkPrice: regularPrice,
        lineTotal: pricing.lineTotal,
        pricing,
      });
    }

    let discount = 0;
    let discountPercent: number | undefined;
    let couponCode: string | undefined;

    if (dto.couponCode) {
      const couponResult = await this.couponService.validateCoupon(dto.couponCode, {
        userId,
        subtotal,
      });

      if (!couponResult.valid) {
        throw new BadRequestException(couponResult.message);
      }

      discount = couponResult.coupon?.discountAmount || 0;
      discountPercent = couponResult.coupon?.discountPercent;
      couponCode = dto.couponCode.toUpperCase();

      if (couponResult.coupon?.type === 'percent') {
        discount = Math.round((subtotal * couponResult.coupon.discount) / 100);
        discountPercent = couponResult.coupon.discount;
      } else {
        discount = couponResult.coupon?.discount || 0;
      }
    }

    const total = Math.max(0, subtotal - discount);

    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          discordId: dto.discordId,
          discordUsername: dto.discordUsername,
          customerEmail: dto.customerEmail,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotalAmount: subtotal,
          discountAmount: discount,
          discountPercent: discountPercent,
          couponCode,
          totalAmount: total,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      });

      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    this.logger.log(`Order ${orderNumber} created with total $${total}`);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal,
      discount,
      discountPercent,
      couponCode,
      total,
      items: validatedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  async getOrderPaymentInfo(orderId: string, userId?: string): Promise<{
    orderId: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    robloxUsername?: string;
    robloxUserId?: string;
    deliverySlot?: {
      startAt: Date;
      endAt: Date;
      ownerTimezone: string;
      customerTimezone?: string;
      customerStartAt?: Date;
      customerEndAt?: Date;
    };
    channelId?: string;
    channelName?: string;
    ticketStatus: string;
    createdAt: Date;
    expiresAt: Date;
  }> {
    const order = await this.prisma.order.findFirst({
      where: userId ? { id: orderId, OR: [{ userId }, { discordId: userId }] } : { id: orderId },
      include: {
        user: {
          select: { id: true, username: true, discordId: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true },
            },
          },
        },
        deliverySlot: true,
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const result: any = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: parseFloat(order.subtotalAmount.toString()),
      discount: order.discountAmount ? parseFloat(order.discountAmount.toString()) : 0,
      total: parseFloat(order.totalAmount.toString()),
      currency: 'USD',
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice.toString()),
        lineTotal: parseFloat(item.lineTotal.toString()),
      })),
      robloxUsername: order.robloxUsername,
      robloxUserId: order.robloxUserId,
      channelId: order.channelId,
      channelName: order.channelName,
      ticketStatus: order.ticketStatus,
      createdAt: order.createdAt,
      expiresAt: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000),
    };

    if (order.deliverySlot) {
      result.deliverySlot = {
        startAt: order.deliverySlot.startAt,
        endAt: order.deliverySlot.endAt,
        ownerTimezone: order.deliverySlot.ownerTimezone,
        customerTimezone: order.deliveryCustomerTimezone || undefined,
        customerStartAt: order.deliveryCustomerStartAt || undefined,
        customerEndAt: order.deliveryCustomerEndAt || undefined,
      };
    }

    return result;
  }

  async findAll(query: {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, status, paymentStatus, paymentMethod, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { discordUsername: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, discordId: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true },
              },
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

  async findOne(id: string, userId?: string): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: userId ? { id, OR: [{ userId }, { discordId: userId }] } : { id },
      include: {
        user: {
          select: { id: true, username: true, discordId: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, imageUrls: true },
            },
          },
        },
        deliverySlot: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order, true);
  }

  async linkRoblox(orderId: string, dto: LinkRobloxData, userId: string): Promise<{
    success: boolean;
    orderId: string;
    robloxUsername: string;
    robloxUserId?: string;
  }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, OR: [{ userId }, { discordId: userId }] },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.robloxUsername) {
      throw new ConflictException('Roblox account already linked');
    }

    if (!['PENDING', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING'].includes(order.status)) {
      throw new BadRequestException('Cannot link Roblox account at this stage');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        robloxUsername: dto.username,
        robloxUserId: dto.userId,
        robloxDisplayName: dto.displayName,
        robloxVerifiedAt: new Date(),
      },
    });

    this.logger.log(`Roblox account ${dto.username} linked to order ${order.orderNumber}`);

    return {
      success: true,
      orderId: updated.id,
      robloxUsername: updated.robloxUsername!,
      robloxUserId: updated.robloxUserId!,
    };
  }

  async selectDeliverySlot(orderId: string, dto: SelectSlotData, userId: string): Promise<{
    success: boolean;
    slotId: string;
    deliveryOwnerStartAt: Date;
    deliveryOwnerEndAt: Date;
    deliveryCustomerStartAt: Date;
    deliveryCustomerEndAt: Date;
    timezone: string;
  }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, OR: [{ userId }, { discordId: userId }] },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['PAID', 'PROCESSING'].includes(order.status)) {
      throw new BadRequestException('Cannot select delivery slot at this stage');
    }

    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id: dto.slotId },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    if (!slot.isActive) {
      throw new BadRequestException('Delivery slot is not available');
    }

    if (slot.currentOrders >= slot.maxOrders) {
      throw new BadRequestException('Delivery slot is full');
    }

    const customerStartAt = convertToTimezone(slot.startAt, dto.customerTimezone);
    const customerEndAt = convertToTimezone(slot.endAt, dto.customerTimezone);

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          deliverySlotId: dto.slotId,
          deliveryOwnerTimezone: slot.ownerTimezone,
          deliveryOwnerStartAt: slot.startAt,
          deliveryOwnerEndAt: slot.endAt,
          deliveryCustomerTimezone: dto.customerTimezone,
          deliveryCustomerStartAt: customerStartAt,
          deliveryCustomerEndAt: customerEndAt,
        },
      }),
      this.prisma.deliverySlot.update({
        where: { id: dto.slotId },
        data: {
          currentOrders: { increment: 1 },
        },
      }),
    ]);

    this.logger.log(`Delivery slot selected for order ${order.orderNumber}`);

    return {
      success: true,
      slotId: dto.slotId,
      deliveryOwnerStartAt: slot.startAt,
      deliveryOwnerEndAt: slot.endAt,
      deliveryCustomerStartAt: customerStartAt,
      deliveryCustomerEndAt: customerEndAt,
      timezone: dto.customerTimezone,
    };
  }

  async confirmDelivery(
    orderId: string,
    userId: string,
    ip: string,
    ua: string,
  ): Promise<{
    success: boolean;
    orderId: string;
    orderNumber: string;
    confirmedAt: Date;
    discountCoupon?: string;
  }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, OR: [{ userId }, { discordId: userId }] },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'DELIVERED' && order.status !== 'READY_FOR_DELIVERY') {
      throw new BadRequestException('Order has not been delivered yet');
    }

    const discountCode = generateCouponCode();

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        confirmedAt: new Date(),
        confirmIp: ip,
        confirmUa: ua,
        confirmationDiscountCode: discountCode,
      },
    });

    await this.prisma.coupon.create({
      data: {
        code: discountCode,
        type: 'percent',
        discount: 5,
        isActive: true,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Order ${order.orderNumber} confirmed by customer`);

    return {
      success: true,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      confirmedAt: updated.confirmedAt!,
      discountCoupon: discountCode,
    };
  }

  async updateOrderStatus(orderId: string, status: string): Promise<{
    success: boolean;
    orderId: string;
    status: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });

    return {
      success: true,
      orderId: updated.id,
      status: updated.status,
    };
  }

  async markOrderPaid(
    orderId: string,
    dto: { txnId: string; note?: string },
    adminId: string,
  ): Promise<{
    success: boolean;
    orderId: string;
    orderNumber: string;
    status: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'COMPLETED') {
      throw new ConflictException('Order is already paid');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COMPLETED',
        status: 'PAID',
        txnId: dto.txnId,
        paidAt: new Date(),
        manualPaymentNote: dto.note,
        manualPaymentConfirmedBy: adminId,
      },
    });

    await this.prisma.payment.create({
      data: {
        orderId: orderId,
        userId: order.userId || 'unknown',
        method: 'PAYPAL' as any,
        status: 'COMPLETED',
        amount: order.totalAmount,
      },
    });

    this.logger.log(`Order ${order.orderNumber} marked as paid by admin ${adminId}`);

    return {
      success: true,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  }

  async cancelOrder(orderId: string, userId: string): Promise<{
    success: boolean;
    orderId: string;
    orderNumber: string;
    status: string;
  }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, OR: [{ userId }, { discordId: userId }] },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('Cannot cancel order at this stage');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });
    });

    if (order.deliverySlotId) {
      await this.prisma.deliverySlot.update({
        where: { id: order.deliverySlotId },
        data: {
          currentOrders: { decrement: 1 },
        },
      });
    }

    this.logger.log(`Order ${order.orderNumber} cancelled by user ${userId}`);

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'CANCELLED',
    };
  }

  async getRecentPurchases(limit = 30): Promise<Array<{
    orderNumber: string;
    displayName: string;
    productName: string;
    gameName: string;
    quantity: number;
    completedAt: Date;
  }>> {
    const orders = await this.prisma.order.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: limit,
      select: {
        orderNumber: true,
        user: {
          select: { username: true },
        },
        items: {
          select: {
            product: {
              select: {
                name: true,
                game: { select: { name: true } },
              },
            },
            quantity: true,
          },
        },
        completedAt: true,
      },
    });

    return orders.map((order) => ({
      orderNumber: order.orderNumber,
      displayName: this.anonymizeUsername(order.user?.username || 'Customer'),
      productName: order.items[0]?.product.name || 'Unknown',
      gameName: order.items[0]?.product.game?.name || 'Unknown',
      quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      completedAt: order.completedAt!,
    }));
  }

  private calculateItemPricing(
    quantity: number,
    regularPrice: number,
    bulkDiscounts: Array<{ minQuantity: number; discountPercent: number }>,
  ): ItemPricingResult {
    const regularUnits = Math.min(quantity, BULK_DISCOUNT_THRESHOLD);
    const bulkUnits = Math.max(0, quantity - BULK_DISCOUNT_THRESHOLD);

    let bulkPrice = regularPrice;
    if (bulkDiscounts.length > 0) {
      const applicableDiscount = bulkDiscounts
        .filter((d) => quantity >= d.minQuantity)
        .sort((a, b) => b.discountPercent - a.discountPercent)[0];

      if (applicableDiscount) {
        bulkPrice = regularPrice * (1 - applicableDiscount.discountPercent / 100);
      }
    }

    const lineTotal = regularUnits * regularPrice + bulkUnits * bulkPrice;

    return {
      regularUnits,
      bulkUnits,
      lineTotal: Math.round(lineTotal * 100) / 100,
      bulkApplied: bulkUnits > 0,
    };
  }

  private async generateOrderNumber(): Promise<string> {
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

  private formatOrder(order: any, includePrivate = false): any {
    const result: any = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: parseFloat(order.subtotalAmount?.toString() || '0'),
      discount: order.discountAmount ? parseFloat(order.discountAmount.toString()) : 0,
      total: parseFloat(order.totalAmount?.toString() || '0'),
      items: order.items?.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice.toString()),
        lineTotal: parseFloat(item.lineTotal.toString()),
      })) || [],
      robloxUsername: order.robloxUsername,
      robloxUserId: order.robloxUserId,
      robloxDisplayName: order.robloxDisplayName,
      channelId: order.channelId,
      channelName: order.channelName,
      ticketStatus: order.ticketStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
    };

    if (order.deliverySlot || order.deliveryOwnerStartAt) {
      result.delivery = {
        slot: order.deliverySlot ? {
          id: order.deliverySlot.id,
          startAt: order.deliverySlot.startAt,
          endAt: order.deliverySlot.endAt,
          ownerTimezone: order.deliverySlot.ownerTimezone,
        } : {
          startAt: order.deliveryOwnerStartAt,
          endAt: order.deliveryOwnerEndAt,
          ownerTimezone: order.deliveryOwnerTimezone,
        },
        customerTimezone: order.deliveryCustomerTimezone,
        customerStartAt: order.deliveryCustomerStartAt,
        customerEndAt: order.deliveryCustomerEndAt,
      };
    }

    if (includePrivate) {
      result.user = order.user;
      result.discordId = order.discordId;
      result.discordUsername = order.discordUsername;
      result.customerEmail = order.customerEmail;
      result.adminNotes = order.adminNotes;
      result.ipAddress = order.ipAddress;
    }

    return result;
  }

  private anonymizeUsername(username: string): string {
    if (!username || username.length <= 3) {
      return 'C***';
    }
    return username.slice(0, 2) + '***' + username.slice(-1);
  }
}
