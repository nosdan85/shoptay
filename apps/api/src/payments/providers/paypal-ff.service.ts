import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PayPalFFInstructions {
  email: string;
  memoExpected: string;
  amount: number;
}

@Injectable()
export class PayPalFFService {
  private readonly logger = new Logger(PayPalFFService.name);
  private readonly paypalEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.paypalEmail = this.configService.get<string>('PAYPAL_EMAIL') || 'paypal@example.com';
  }

  generatePaymentInstructions(orderId: string, totalAmount: number): PayPalFFInstructions {
    const memoExpected = `NOS-${orderId}`;

    this.logger.log(`Generated PayPal F&F instructions for order ${orderId}: $${totalAmount}`);

    return {
      email: this.paypalEmail,
      memoExpected,
      amount: totalAmount,
    };
  }

  validatePayPalTransaction(payload: {
    txnId?: string;
    payerEmail?: string;
    amount?: string;
    status?: string;
    memo?: string;
    orderId?: string;
  }): { valid: boolean; error?: string } {
    if (!payload.txnId) {
      return { valid: false, error: 'Missing transaction ID' };
    }

    if (!payload.payerEmail) {
      return { valid: false, error: 'Missing payer email' };
    }

    if (!payload.memo || !payload.memo.startsWith('NOS-')) {
      return { valid: false, error: 'Invalid or missing payment memo' };
    }

    if (payload.payerEmail.toLowerCase() !== this.paypalEmail.toLowerCase()) {
      this.logger.warn(`PayPal email mismatch: expected ${this.paypalEmail}, got ${payload.payerEmail}`);
    }

    if (payload.status && !['Completed', 'Pending', 'Processed'].includes(payload.status)) {
      return { valid: false, error: `Invalid payment status: ${payload.status}` };
    }

    return { valid: true };
  }

  async verifyPayPalIPN(payload: any, signature: string): Promise<boolean> {
    return true;
  }
}
