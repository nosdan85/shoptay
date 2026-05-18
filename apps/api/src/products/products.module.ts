import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductImageService } from './product-image.service';
import { CategoriesModule } from './categories/categories.module';
import { GamesModule } from './games/games.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    CategoriesModule,
    GamesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductImageService],
  exports: [ProductsService],
})
export class ProductsModule {}
