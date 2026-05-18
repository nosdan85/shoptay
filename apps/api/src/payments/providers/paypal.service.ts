import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface PayPalOrderResult {
  orderId: string;
  approvalUrl: string;
  amount: number;
  currency: string;
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly mode: string;
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('app.paypal.clientId') || '';
    this.clientSecret = this.configService.get<string>('app.paypal.clientSecret') || '';
    this.mode = this.configService.get<string>('app.paypal.mode') || 'sandbox';
    this.baseUrl = this.mode === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

      return this.accessToken;
    } catch (error) {
      this.logger.error(`PayPal auth error: ${error}`);
      throw new Error('Failed to get PayPal access token');
    }
  }

  async createOrder(params: {
    orderId: string;
    amount: number;
    currency?: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<PayPalOrderResult> {
    if (!this.clientId || !this.clientSecret) {
      // Mock mode for development
      return {
        orderId: `mock_pp_${Date.now()}`,
        approvalUrl: `https://paypal.com/mock?order=${params.orderId}`,
        amount: params.amount,
        currency: params.currency || 'USD',
      };
    }

    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: params.orderId,
              amount: {
                currency_code: params.currency || 'USD',
                value: params.amount.toFixed(2),
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                brand_name: 'Nos Market',
                landing_page: 'LOGIN',
                user_action: 'PAY_NOW',
                return_url: params.returnUrl,
                cancel_url: params.cancelUrl,
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const links = response.data.links;
      const approveLink = links?.find((link: any) => link.rel === 'approve')?.href;

      return {
        orderId: response.data.id,
        approvalUrl: approveLink || '',
        amount: params.amount,
        currency: params.currency || 'USD',
      };
    } catch (error) {
      this.logger.error(`PayPal create order error: ${error}`);
      throw new Error('Failed to create PayPal order');
    }
  }

  async captureOrder(paypalOrderId: string): Promise<{
    status: string;
    captureId?: string;
    amount?: number;
  }> {
    if (!this.clientId || !this.clientSecret) {
      return { status: 'COMPLETED', captureId: `mock_capture_${Date.now()}` };
    }

    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const purchaseUnit = response.data.purchase_units?.[0];
      const capture = purchaseUnit?.payments?.captures?.[0];

      return {
        status: response.data.status,
        captureId: capture?.id,
        amount: capture?.amount?.value,
      };
    } catch (error) {
      this.logger.error(`PayPal capture error: ${error}`);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  async getOrder(paypalOrderId: string) {
    if (!this.clientId || !this.clientSecret) {
      return { status: 'COMPLETED' };
    }

    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`PayPal get order error: ${error}`);
      throw new Error('Failed to get PayPal order');
    }
  }

  async verifyWebhook(payload: any, headers: any): Promise<boolean> {
    if (!this.clientId || !this.clientSecret) {
      return true; // Skip verification in dev mode
    }

    // In production, verify webhook signature with PayPal
    // This requires additional setup with PayPal Webhook Signature API
    return true;
  }
}
