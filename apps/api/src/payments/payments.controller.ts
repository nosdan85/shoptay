import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Logger,
  Ip,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { TicketService } from './providers/ticket.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IsPublic } from '../common/decorators/is-public.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreatePaymentDto, PaymentMethodType } from './dto/create-payment.dto';
import { CompleteCashAppDto } from './dto/complete-cashapp.dto';

@ApiTags('payments')
@Controller({ path: 'shop', version: '1' })
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ticketService: TicketService,
  ) {}

  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment for an order' })
  @ApiResponse({ status: 200, description: 'Payment created successfully' })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUserId() userId: string,
  ) {
    return this.paymentsService.createPayment(dto.orderId, dto.method, userId, dto.topupAmountCents);
  }

  @Get('payments/order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payments for an order' })
  @ApiResponse({ status: 200, description: 'Order payments retrieved' })
  async getOrderPayments(
    @Param('orderId') orderId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.paymentsService.getOrderPayments(orderId);
  }

  @Get('payments/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async getPaymentStatus(
    @Param('paymentId') paymentId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }

  @Post('payments/cashapp/:paymentId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete CashApp payment with Square source ID' })
  @ApiResponse({ status: 200, description: 'Payment completed' })
  async completeCashAppPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: CompleteCashAppDto,
    @CurrentUserId() userId: string,
  ) {
    return this.paymentsService.completeCashAppPayment(
      paymentId,
      dto.sourceId,
      dto.idempotencyKey,
    );
  }

  @Post('create-ticket')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create CashApp Discord ticket' })
  @ApiResponse({ status: 200, description: 'Ticket created' })
  async createCashAppTicket(
    @Body() dto: CreatePaymentDto,
    @CurrentUserId() userId: string,
  ) {
    return this.ticketService.createCashAppTicket(dto.orderId, userId);
  }

  @Post('create-ticket-paypal-ff')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create PayPal Discord ticket' })
  @ApiResponse({ status: 200, description: 'Ticket created' })
  async createPayPalTicket(
    @Body() dto: CreatePaymentDto,
    @CurrentUserId() userId: string,
  ) {
    return this.ticketService.createPayPalTicket(dto.orderId, userId);
  }

  @Post('create-ticket-ltc')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create LTC Discord ticket' })
  @ApiResponse({ status: 200, description: 'Ticket created' })
  async createLtcTicket(
    @Body() dto: CreatePaymentDto,
    @CurrentUserId() userId: string,
  ) {
    return this.ticketService.createLtcTicket(dto.orderId, userId);
  }

  @Post('coupon/preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview coupon discount' })
  @ApiResponse({ status: 200, description: 'Coupon preview' })
  async previewCoupon(
    @Body() body: { couponCode: string; subtotalCents: number },
  ) {
    return this.paymentsService.previewCoupon(body.couponCode, body.subtotalCents);
  }

  @Get('payment-providers')
  @IsPublic()
  @ApiOperation({ summary: 'Get available payment providers' })
  @ApiResponse({ status: 200, description: 'Payment providers list' })
  async getPaymentProviders() {
    return this.paymentsService.getAvailablePaymentMethods();
  }

  @Get('payments/square/config')
  @IsPublic()
  @ApiOperation({ summary: 'Get Square configuration for client-side tokenization' })
  @ApiResponse({ status: 200, description: 'Square config' })
  async getSquareConfig() {
    return this.paymentsService.getSquareConfig();
  }

  @Post('webhook/nowpayments')
  @IsPublic()
  @ApiOperation({ summary: 'NOWPayments LTC IPN webhook' })
  @ApiHeader({ name: 'x-nowpayments-sig', description: 'Webhook signature', required: false })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleNowPaymentsWebhook(
    @Body() payload: any,
    @Headers('x-nowpayments-sig') signature: string,
    @Ip() ip: string,
  ) {
    this.logger.log(`NOWPayments webhook from IP: ${ip}`);
    return this.paymentsService.processNowPaymentsWebhook(payload, signature);
  }

  @Post('webhook/square')
  @IsPublic()
  @ApiOperation({ summary: 'Square webhook' })
  @ApiHeader({ name: 'x-square-signature', description: 'Webhook signature', required: false })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleSquareWebhook(
    @Body() payload: any,
    @Headers('x-square-signature') signature: string,
    @Ip() ip: string,
  ) {
    this.logger.log(`Square webhook from IP: ${ip}`);
    return this.paymentsService.processSquareWebhook(payload, signature);
  }

  @Post('webhook/paypal-ipn')
  @IsPublic()
  @ApiOperation({ summary: 'PayPal IPN webhook (legacy)' })
  @ApiResponse({ status: 200, description: 'IPN processed' })
  async handlePayPalIPN(
    @Body() payload: any,
    @Ip() ip: string,
  ) {
    this.logger.log(`PayPal IPN from IP: ${ip}`);
    return { received: true };
  }
}
