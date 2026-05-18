import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NowPaymentsService } from './nowpayments.service';
import { SquareService } from './square.service';
import { createHmac } from 'crypto';
import { WebhookStatus } from '@prisma/client';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly nowPaymentsIPNSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly nowPaymentsService: NowPaymentsService,
    private readonly squareService: SquareService,
  ) {
    this.nowPaymentsIPNSecret = this.configService.get<string>('NOWPAYMENTS_IPN_SECRET') || '';
  }

  async processNowPaymentsWebhook(payload: any, signature: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const isValid = this.verifyNowPaymentsSignature(payload, signature);
    if (!isValid) {
      this.logger.warn('Invalid NOWPayments webhook signature');
      await this.logWebhook('nowpayments', 'invalid_signature', payload, signature, 'Invalid signature');
      return { success: false, error: 'Invalid signature' };
    }

    await this.logWebhook('nowpayments', payload.payment_status || 'unknown', payload, signature);

    const { payment_id, payment_status, order_id, actually_paid, currency, tx_hash } = payload;

    this.logger.log(`NOWPayments webhook: ${payment_id} - ${payment_status} for order ${order_id}`);

    try {
      const payment = await this.prisma.paymentAttempt.findFirst({
        where: { providerReference: payment_id },
        include: { order: true },
      });

      if (!payment) {
        this.logger.warn(`Payment not found for NOWPayments: ${payment_id}`);
        await this.markWebhookProcessed(payload.payment_id);
        return { success: true };
      }

      if (payment_status === 'finished' || payment_status === 'partially_paid') {
        await this.prisma.paymentAttempt.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            providerReference: tx_hash || payment_id,
            completedAt: new Date(),
          },
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

        this.logger.log(`NOWPayments payment confirmed: ${payment_id}`);
      } else if (payment_status === 'failed' || payment_status === 'expired') {
        await this.prisma.paymentAttempt.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
          },
        });

        this.logger.log(`NOWPayments payment failed: ${payment_id}`);
      }

      await this.markWebhookProcessed(payment_id);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing NOWPayments webhook: ${error}`);
      await this.logWebhook('nowpayments', payment_status, payload, signature, String(error));
      return { success: false, error: 'Processing error' };
    }
  }

  async processSquareWebhook(payload: any, signature: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const isValid = this.verifySquareWebhookSignature(payload, signature);
    if (!isValid) {
      this.logger.warn('Invalid Square webhook signature');
      await this.logWebhook('square', 'invalid_signature', payload, signature, 'Invalid signature');
      return { success: false, error: 'Invalid signature' };
    }

    const eventType = payload.type || 'unknown';
    await this.logWebhook('square', eventType, payload, signature);

    this.logger.log(`Square webhook: ${eventType}`);

    try {
      if (eventType === 'payment.completed') {
        const squarePaymentId = payload.data?.object?.payment?.id;

        if (squarePaymentId) {
          const payment = await this.prisma.paymentAttempt.findFirst({
            where: { providerReference: squarePaymentId },
            include: { order: true },
          });

          if (payment) {
            await this.prisma.paymentAttempt.update({
              where: { id: payment.id },
              data: {
                status: 'SUCCESS',
                completedAt: new Date(),
              },
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

            this.logger.log(`Square payment completed: ${squarePaymentId}`);
          }
        }
      }

      await this.markWebhookProcessed(eventType);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing Square webhook: ${error}`);
      await this.logWebhook('square', eventType, payload, signature, String(error));
      return { success: false, error: 'Processing error' };
    }
  }

  verifyNowPaymentsSignature(payload: string | object, signature: string): boolean {
    if (!this.nowPaymentsIPNSecret) {
      this.logger.warn('NOWPayments IPN secret not configured, skipping verification');
      return true;
    }

    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = createHmac('sha256', this.nowPaymentsIPNSecret)
        .update(payloadString)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`NOWPayments signature verification error: ${error}`);
      return false;
    }
  }

  verifySquareWebhookSignature(payload: string | object, signature: string): boolean {
    return this.squareService.verifyWebhookSignature(payload, signature);
  }

  async logWebhook(
    provider: string,
    eventType: string,
    payload: any,
    signature?: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.webhookLog.create({
        data: {
          provider,
          eventType,
          payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
          signature,
          status: errorMessage ? 'FAILED' : 'RECEIVED',
          errorMessage,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log webhook: ${error}`);
    }
  }

  private async markWebhookProcessed(referenceId: string): Promise<void> {
    try {
      await this.prisma.webhookLog.updateMany({
        where: {
          provider: 'nowpayments',
          payload: { contains: referenceId },
          status: 'RECEIVED',
        },
        data: {
          status: 'PROCESSED' as WebhookStatus,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to mark webhook as processed: ${error}`);
    }
  }

  async getWebhookLogs(limit = 100): Promise<any[]> {
    const logs = await this.prisma.webhookLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      provider: log.provider,
      eventType: log.eventType,
      status: log.status,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
      processedAt: log.processedAt,
    }));
  }

  async retryWebhook(webhookId: string): Promise<{ success: boolean; error?: string }> {
    const webhook = await this.prisma.webhookLog.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    if (webhook.status === 'PROCESSED') {
      return { success: false, error: 'Webhook already processed' };
    }

    try {
      const payload = JSON.parse(webhook.payload);

      if (webhook.provider === 'nowpayments') {
        return await this.processNowPaymentsWebhook(payload, webhook.signature || '');
      } else if (webhook.provider === 'square') {
        return await this.processSquareWebhook(payload, webhook.signature || '');
      }

      return { success: false, error: 'Unknown provider' };
    } catch (error) {
      this.logger.error(`Webhook retry error: ${error}`);
      return { success: false, error: String(error) };
    }
  }
}
