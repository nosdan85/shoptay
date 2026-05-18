import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac } from 'crypto';

export interface LtcInvoiceResult {
  invoiceId: string;
  walletAddress: string;
  cryptoAmount: string;
  currency: string;
  qrImageUrl?: string;
  invoiceUrl?: string;
  expiresAt: Date;
}

export interface NowPaymentsPayment {
  paymentId: string;
  paymentStatus: string;
  payAddress: string;
  payAmount: string;
  payCurrency: string;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NowPaymentsService {
  private readonly logger = new Logger(NowPaymentsService.name);
  private readonly apiKey: string;
  private readonly ipnSecret: string;
  private readonly sandbox: boolean;
  private readonly ipnCallbackUrl: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('NOWPAYMENTS_API_KEY') || '';
    this.ipnSecret = this.configService.get<string>('NOWPAYMENTS_IPN_SECRET') || '';
    this.sandbox = this.configService.get<string>('NOWPAYMENTS_SANDBOX') !== 'false';
    this.ipnCallbackUrl = this.configService.get<string>('NOWPAYMENTS_IPN_CALLBACK_URL') ||
      `http://localhost:3001/api/shop/webhook/nowpayments`;

    this.baseUrl = this.sandbox
      ? 'https://api-sandbox.nowpayments.io/v1'
      : 'https://api.nowpayments.io/v1';
  }

  async createInvoice(params: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<LtcInvoiceResult> {
    if (!this.apiKey) {
      this.logger.warn('NOWPayments API key not configured, returning mock invoice');
      return this.createMockInvoice(params);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/payment`,
        {
          price_amount: params.amount,
          price_currency: params.currency.toLowerCase(),
          pay_currency: 'ltc',
          order_id: params.orderId,
          order_description: `Nos Market Order ${params.orderId}`,
          ipn_callback_url: this.ipnCallbackUrl,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const data = response.data;

      this.logger.log(`NOWPayments invoice created: ${data.id} for order ${params.orderId}`);

      return {
        invoiceId: data.id,
        walletAddress: data.pay_address,
        cryptoAmount: data.pay_amount,
        currency: data.pay_currency,
        qrImageUrl: this.generateQRUrl(data.pay_address, data.pay_amount),
        invoiceUrl: data.invoice_url,
        expiresAt: new Date(data.payment_expiry_url || Date.now() + 60 * 60 * 1000),
      };
    } catch (error: any) {
      this.logger.error(`NOWPayments API error: ${error.response?.data || error.message}`);
      throw new Error('Failed to create payment invoice. Please try again.');
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    amountPaid?: string;
    actualAmount?: string;
  }> {
    if (!this.apiKey) {
      return { status: 'unknown' };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/payment/${paymentId}`,
        {
          headers: {
            'x-api-key': this.apiKey,
          },
          timeout: 15000,
        },
      );

      return {
        status: response.data.payment_status,
        amountPaid: response.data.actually_paid,
        actualAmount: response.data.pay_amount,
      };
    } catch (error) {
      this.logger.error(`NOWPayments status check error: ${error}`);
      return { status: 'error' };
    }
  }

  async getMinimumPaymentAmount(currency: string = 'LTC'): Promise<number> {
    if (!this.apiKey) {
      return 2;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/min-amount?currency_from=${currency}`,
        {
          headers: {
            'x-api-key': this.apiKey,
          },
        },
      );

      return response.data.min_amount || 2;
    } catch (error) {
      this.logger.error(`NOWPayments min amount error: ${error}`);
      return 2;
    }
  }

  async getExchangeRate(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{ rate: number; amount: number }> {
    if (!this.apiKey) {
      const mockRate = toCurrency === 'LTC' ? 0.015 : 66.67;
      return { rate: mockRate, amount: amount * mockRate };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/exchange`,
        {
          params: {
            amount,
            currency_from: fromCurrency.toLowerCase(),
            currency_to: toCurrency.toLowerCase(),
          },
          headers: {
            'x-api-key': this.apiKey,
          },
        },
      );

      return {
        rate: response.data.estimate,
        amount: response.data.estimated_amount,
      };
    } catch (error) {
      this.logger.error(`NOWPayments exchange rate error: ${error}`);
      return { rate: 0.015, amount: amount * 0.015 };
    }
  }

  verifyWebhookSignature(payload: string | object, signature: string): boolean {
    if (!this.ipnSecret) {
      this.logger.warn('NOWPayments IPN secret not configured, skipping signature verification');
      return true;
    }

    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = createHmac('sha256', this.ipnSecret)
        .update(payloadString)
        .digest('hex');

      const isValid = signature === expectedSignature;

      if (!isValid) {
        this.logger.warn('NOWPayments signature mismatch');
      }

      return isValid;
    } catch (error) {
      this.logger.error(`NOWPayments signature verification error: ${error}`);
      return false;
    }
  }

  private generateQRUrl(address: string, amount?: string): string {
    const data = amount
      ? `ltc:${address}?amount=${amount}`
      : `ltc:${address}`;

    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  }

  private createMockInvoice(params: {
    orderId: string;
    amount: number;
    currency: string;
  }): LtcInvoiceResult {
    const mockAddress = 'LTC_MOCK_' + Math.random().toString(36).substring(2, 15).toUpperCase();
    const mockAmount = (params.amount * 0.015).toFixed(8);

    this.logger.log(`Mock LTC invoice created: ${params.orderId} - ${mockAmount} LTC`);

    return {
      invoiceId: `mock_${Date.now()}_${params.orderId}`,
      walletAddress: mockAddress,
      cryptoAmount: mockAmount,
      currency: 'LTC',
      qrImageUrl: this.generateQRUrl(mockAddress, mockAmount),
      invoiceUrl: `https://nowpayments.io/payment?mock=true&order=${params.orderId}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }
}
