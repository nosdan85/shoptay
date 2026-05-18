import { Module, forwardRef } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { TopupService } from './topup.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [forwardRef(() => PaymentsModule)],
  controllers: [WalletController],
  providers: [WalletService, TopupService],
  exports: [WalletService, TopupService],
})
export class WalletModule {}
