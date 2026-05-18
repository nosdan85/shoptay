import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac } from 'crypto';

export interface SquareChargeResult {
  paymentId: string;
  status: string;
  receiptUrl?: string;
}

export interface SquareClientConfig {
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
}

@Injectable()
export class SquareService {
  private readonly logger = new Logger(SquareService.name);
  private readonly applicationId: string;
  private readonly accessToken: string;
  private readonly locationId: string;
  private readonly environment: 'sandbox' | 'production';
  private readonly webhookSignatureKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.applicationId = this.configService.get<string>('SQUARE_APPLICATION_ID') || '';
    this.accessToken = this.configService.get<string>('SQUARE_ACCESS_TOKEN') || '';
    this.locationId = this.configService.get<string>('SQUARE_LOCATION_ID') || '';
    this.environment = (this.configService.get<string>('SQUARE_ENVIRONMENT') || 'sandbox') as 'sandbox' | 'production';
    this.webhookSignatureKey = this.configService.get<string>('SQUARE_WEBHOOK_SIGNATURE_KEY') || '';

    this.baseUrl = this.environment === 'production'
      ? 'https://connect.squareup.com/v2'
      : 'https://connect.squareupsandbox.com/v2';
  }

  getClientConfig(): SquareClientConfig {
    return {
      applicationId: this.applicationId,
      locationId: this.locationId,
      environment: this.environment,
    };
  }

  async createCashAppPayment(orderId: string, amountCents: number): Promise<{
    applicationId: string;
    locationId: string;
    referenceId: string;
    environment: string;
  }> {
    this.logger.log(`Creating CashApp payment for order ${orderId}: ${amountCents} cents`);

    return {
      applicationId: this.applicationId,
      locationId: this.locationId,
      referenceId: `NOS-${orderId}`,
      environment: this.environment,
    };
  }

  async chargeCard(params: {
    sourceId: string;
    amountCents: number;
    currency: string;
    idempotencyKey: string;
    orderId?: string;
    referenceId?: string;
  }): Promise<SquareChargeResult> {
    if (!this.accessToken) {
      this.logger.warn('Square access token not configured, returning mock result');
      return {
        paymentId: `mock_sq_${Date.now()}`,
        status: 'COMPLETED',
        receiptUrl: `https://squareup.com/receipt/mock/${params.idempotencyKey}`,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          source_id: params.sourceId,
          idempotency_key: params.idempotencyKey,
          amount_money: {
            amount: params.amountCents,
            currency: params.currency,
          },
          location_id: this.locationId,
          reference_id: params.referenceId || params.orderId,
          note: params.orderId ? `Nos Market Order ${params.orderId}` : 'Nos Market Payment',
          autocomplete: true,
        },
        {
          headers: {
            'Square-Version': '2024-01-18',
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const payment = response.data.payment;

      this.logger.log(`Square payment created: ${payment.id} for order ${params.orderId}`);

      return {
        paymentId: payment.id,
        status: payment.status,
        receiptUrl: payment.receipt_url,
      };
    } catch (error: any) {
      this.logger.error(`Square payment error: ${error.response?.data || error.message}`);

      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        throw new Error(`Payment failed: ${errors.map((e: any) => e.detail).join(', ')}`);
      }

      throw new Error('Payment processing failed. Please try again.');
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    if (!this.accessToken) {
      return { id: paymentId, status: 'COMPLETED' };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/payments/${paymentId}`,
        {
          headers: {
            'Square-Version': '2024-01-18',
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      return response.data.payment;
    } catch (error) {
      this.logger.error(`Failed to get Square payment: ${error}`);
      return null;
    }
  }

  async createPaymentLink(params: {
    amountCents: number;
    currency: string;
    description: string;
    orderId: string;
  }): Promise<{ id: string; url: string }> {
    if (!this.accessToken) {
      return {
        id: `mock_link_${Date.now()}`,
        url: `https://square.link/mock?order=${params.orderId}`,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/online-checkout/payment-links`,
        {
          idempotency_key: `link_${params.orderId}_${Date.now()}`,
          amount_money: {
            amount: params.amountCents,
            currency: params.currency,
          },
          note: params.description,
          reference_id: params.orderId,
        },
        {
          headers: {
            'Square-Version': '2024-01-18',
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        id: response.data.payment_link.id,
        url: response.data.payment_link.url,
      };
    } catch (error) {
      this.logger.error(`Square payment link error: ${error}`);
      throw new Error('Failed to create payment link');
    }
  }

  verifyWebhookSignature(payload: string | object, signature: string): boolean {
    if (!this.webhookSignatureKey) {
      this.logger.warn('Square webhook signature key not configured, skipping verification');
      return true;
    }

    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const combined = payloadString + this.webhookSignatureKey;
      const expectedSignature = createHmac('sha256', this.webhookSignatureKey)
        .update(combined)
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`Square signature verification error: ${error}`);
      return false;
    }
  }

  verifySignature(body: string, signature: string): boolean {
    return this.verifyWebhookSignature(body, signature);
  }
}
