import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminService } from './admin.service';
import { AdminOrdersService } from './admin-orders.service';
import { AdminStatsService } from './admin-stats.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [AdminController, AdminOrdersController],
  providers: [AdminService, AdminOrdersService, AdminStatsService],
  exports: [AdminService, AdminOrdersService, AdminStatsService],
})
export class AdminModule {}
