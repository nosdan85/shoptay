import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NowpaymentsService } from '../payments/providers/nowpayments.service';

export interface PayPalInstructions {
  destination: string;
  memoExpected: string;
  type: 'paypal_ff';
}

export interface CashAppInstructions {
  handle: string;
  referenceId: string;
  type: 'cashapp';
}

export interface LTCInstructions {
  payAddress: string;
  payAmount: string;
  payCurrency: string;
  qrImageUrl: string;
  type: 'ltc';
}

export interface PaymentInstructionsResult {
  paypal_ff?: PayPalInstructions;
  cashapp?: CashAppInstructions;
  ltc?: LTCInstructions;
}

@Injectable()
export class TopupService {
  private readonly logger = new Logger(TopupService.name);

  private readonly paypalEmail: string;
  private readonly cashAppHandle: string;
  private readonly environment: 'sandbox' | 'production';

  constructor(
    private readonly configService: ConfigService,
    private readonly nowpaymentsService: NowpaymentsService,
  ) {
    this.paypalEmail = this.configService.get<string>('PAYPAL_EMAIL', 'admin@nosmarket.com');
    this.cashAppHandle = this.configService.get<string>('CASHAPP_HANDLE', '$yoko276');
    this.environment = this.configService.get<'sandbox' | 'production'>('SQUARE_ENVIRONMENT', 'production');
  }

  async generatePaymentInstructions(
    topupId: string,
    method: 'PAYPAL' | 'CASHAPP' | 'SQUARE' | 'LITECOIN',
    amountCents: number,
  ): Promise<PaymentInstructionsResult> {
    const amount = amountCents / 100;
    const referenceCode = `TOP-${topupId.slice(-8).toUpperCase()}`;

    switch (method) {
      case 'PAYPAL':
        return this.generatePayPalInstructions(referenceCode);

      case 'CASHAPP':
      case 'SQUARE':
        return this.generateCashAppInstructions(topupId, referenceCode);

      case 'LITECOIN':
        return this.generateLTCInstructions(topupId, amount);

      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  private generatePayPalInstructions(referenceCode: string): PaymentInstructionsResult {
    return {
      paypal_ff: {
        destination: this.paypalEmail,
        memoExpected: referenceCode,
        type: 'paypal_ff',
      },
    };
  }

  private generateCashAppInstructions(topupId: string, referenceCode: string): PaymentInstructionsResult {
    return {
      cashapp: {
        handle: this.cashAppHandle,
        referenceId: referenceCode,
        type: 'cashapp',
      },
    };
  }

  private async generateLTCInstructions(topupId: string, amountUSD: number): Promise<PaymentInstructionsResult> {
    try {
      const invoice = await this.nowpaymentsService.createInvoice({
        orderId: topupId,
        amount: amountUSD,
        currency: 'USD',
      });

      return {
        ltc: {
          payAddress: invoice.payAddress || '',
          payAmount: invoice.payAmount?.toString() || '',
          payCurrency: 'LTC',
          qrImageUrl: this.generateQRCodeUrl(invoice.payAddress || ''),
          type: 'ltc',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create LTC invoice: ${error}`);
      throw error;
    }
  }

  private generateQRCodeUrl(address: string): string {
    const encodedAddress = encodeURIComponent(address);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=litecoin:${address}`;
  }

  async pollPaymentStatus(topupId: string, method: 'LITECOIN'): Promise<{
    status: 'pending' | 'confirmed' | 'paid' | 'failed';
    txHash?: string;
    amount?: string;
  }> {
    if (method === 'LITECOIN') {
      try {
        const status = await this.nowpaymentsService.getPaymentStatus(topupId);
        return {
          status: status.paymentStatus === 'finished' ? 'paid' : 
                  status.paymentStatus === 'confirmed' ? 'confirmed' :
                  status.paymentStatus === 'failed' ? 'failed' : 'pending',
          txHash: status.orderId,
          amount: status.payAmount,
        };
      } catch (error) {
        this.logger.error(`Failed to poll LTC payment status: ${error}`);
        return { status: 'pending' };
      }
    }

    return { status: 'pending' };
  }

  getSquareConfig(): { applicationId: string; locationId: string; environment: string } {
    return {
      applicationId: this.configService.get<string>('SQUARE_APPLICATION_ID', '') || '',
      locationId: this.configService.get<string>('SQUARE_LOCATION_ID', '') || '',
      environment: this.environment,
    };
  }
}
