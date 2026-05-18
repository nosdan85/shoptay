import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Logger,
  Ip,
  UserAgent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { IsPublic } from '../common/decorators/is-public.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { LinkRobloxDto } from './dto/link-roblox.dto';
import { SelectDeliverySlotDto } from '../delivery-slots/dto/select-delivery-slot.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { PreviewCouponDto } from './dto/preview-coupon.dto';

@ApiTags('orders')
@Controller({ path: 'shop', version: '1' })
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly couponService: CouponService,
  ) {}

  // Public endpoints
  @Get('recent-purchases')
  @IsPublic()
  @ApiOperation({ summary: 'Get recent purchases for ticker' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent purchases' })
  async getRecentPurchases(@Query('limit') limit?: number) {
    return this.ordersService.getRecentPurchases(limit || 30);
  }

  @Post('coupon/preview')
  @IsPublic()
  @ApiOperation({ summary: 'Preview coupon discount' })
  @ApiResponse({ status: 200, description: 'Coupon preview' })
  async previewCoupon(@Body() dto: PreviewCouponDto) {
    const result = await this.couponService.validateCoupon(dto.couponCode, {
      subtotal: dto.subtotal,
    });

    return {
      valid: result.valid,
      discount: result.coupon?.discountAmount || 0,
      discountPercent: result.coupon?.discountPercent || 0,
      finalTotal: result.finalTotal,
      message: result.message,
      couponCode: dto.couponCode.toUpperCase(),
    };
  }

  @Get('orders/:id/payment-info')
  @IsPublic()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get order payment info' })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiResponse({ status: 200, description: 'Order payment info' })
  async getOrderPaymentInfo(
    @Param('id') id: string,
    @Query('orderId') orderId: string,
    @CurrentUserId() userId?: string,
  ) {
    return this.ordersService.getOrderPaymentInfo(orderId || id, userId);
  }

  // Authenticated user endpoints
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 900000 } }) // 10 requests per 15 minutes
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async checkout(
    @Body() dto: CreateOrderDto,
    @CurrentUserId() userId: string,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.ordersService.createOrder(
      {
        items: dto.items,
        couponCode: dto.couponCode,
        discordId: dto.discordId,
        discordUsername: dto.discordUsername,
        customerEmail: dto.customerEmail,
        ipAddress: ip,
        userAgent: ua,
      },
      userId,
    );
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user orders' })
  @ApiResponse({ status: 200, description: 'User orders' })
  async getUserOrders(
    @CurrentUserId() userId: string,
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findAll({
      ...query,
      search: query.search,
    });
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order details' })
  async getOrder(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.ordersService.findOne(id, userId);
  }

  @Post('orders/:id/link-roblox')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Roblox account to order' })
  @ApiResponse({ status: 200, description: 'Roblox account linked' })
  async linkRoblox(
    @Param('id') id: string,
    @Body() dto: LinkRobloxDto,
    @CurrentUserId() userId: string,
  ) {
    return this.ordersService.linkRoblox(id, dto, userId);
  }

  @Post('orders/:id/delivery-slot')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select delivery slot for order' })
  @ApiResponse({ status: 200, description: 'Delivery slot selected' })
  async selectDeliverySlot(
    @Param('id') id: string,
    @Body() dto: SelectDeliverySlotDto,
    @CurrentUserId() userId: string,
  ) {
    return this.ordersService.selectDeliverySlot(id, dto, userId);
  }

  @Post('orders/:id/confirm-delivery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm delivery received' })
  @ApiResponse({ status: 200, description: 'Delivery confirmed' })
  async confirmDelivery(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.ordersService.confirmDelivery(id, userId, ip, ua);
  }

  @Put('orders/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.ordersService.cancelOrder(id, userId);
  }

  // Owner only endpoints
  @Get('orders')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all orders (owner)' })
  @ApiResponse({ status: 200, description: 'All orders' })
  async getAllOrders(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('owner/confirmed-orders')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List confirmed orders (owner)' })
  @ApiResponse({ status: 200, description: 'Confirmed orders' })
  async getConfirmedOrders(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll({
      ...query,
      status: 'COMPLETED',
    });
  }

  @Put('orders/:id/status')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (owner)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.ordersService.updateOrderStatus(id, body.status);
  }

  @Post('orders/:id/mark-paid')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark order as paid (owner)' })
  @ApiResponse({ status: 200, description: 'Order marked as paid' })
  async markOrderPaid(
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUserId() adminId: string,
  ) {
    return this.ordersService.markOrderPaid(id, dto, adminId);
  }

  @Put('orders/:id/cancel')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order (owner)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  async cancelOrderOwner(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUserId() adminId: string,
  ) {
    return this.ordersService.cancelOrder(id, adminId);
  }
}
