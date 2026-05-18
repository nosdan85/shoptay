import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CheckoutService } from './checkout.service';
import { CouponService } from './coupon.service';
import { ProductsModule } from '../products/products.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    ProductsModule,
    forwardRef(() => WalletModule),
    PaymentsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, CheckoutService, CouponService],
  exports: [OrdersService, CheckoutService, CouponService],
})
export class OrdersModule {}
