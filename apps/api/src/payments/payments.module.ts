import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { NowPaymentsService } from './providers/nowpayments.service';
import { SquareService } from './providers/square.service';
import { PayPalFFService } from './providers/paypal-ff.service';
import { WebhookService } from './providers/webhook.service';
import { TicketService } from './providers/ticket.service';
import { OrdersModule } from '../orders/orders.module';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [OrdersModule, WalletModule, PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    NowPaymentsService,
    SquareService,
    PayPalFFService,
    WebhookService,
    TicketService,
  ],
  exports: [
    PaymentsService,
    NowPaymentsService,
    SquareService,
    PayPalFFService,
    WebhookService,
    TicketService,
  ],
})
export class PaymentsModule {}
