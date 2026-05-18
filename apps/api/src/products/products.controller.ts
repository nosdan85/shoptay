import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductImageService } from './product-image.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { IsPublic } from '../common/decorators/is-public.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('Products')
@Controller({ path: 'shop', version: '1' })
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly productImageService: ProductImageService,
  ) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get('products')
  @IsPublic()
  @ApiOperation({ summary: 'List all products with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Products list with pagination' })
  async getProducts(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('products/search')
  @IsPublic()
  @ApiOperation({ summary: 'Search products by name or description' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchProducts(@Query('q') q: string, @Query('limit') limit: number = 10) {
    return this.productsService.search(q, limit);
  }

  @Get('products/:id')
  @IsPublic()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  async getProductById(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('products/slug/:slug')
  @IsPublic()
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product details' })
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get('products/game/:gameId')
  @IsPublic()
  @ApiOperation({ summary: 'Get products by game ID' })
  @ApiResponse({ status: 200, description: 'Products for game' })
  async getProductsByGame(@Param('gameId') gameId: string, @Query() query: ProductQueryDto) {
    return this.productsService.findByGame(gameId, query);
  }

  @Get('products/category/:categoryId')
  @IsPublic()
  @ApiOperation({ summary: 'Get products by category ID' })
  @ApiResponse({ status: 200, description: 'Products for category' })
  async getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.findByCategory(categoryId, query);
  }

  // ==================== OWNER ENDPOINTS ====================

  @Get('owner/products')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all products for admin (including inactive)' })
  @ApiResponse({ status: 200, description: 'All products list' })
  async getAllProducts(@Query() query: ProductQueryDto) {
    return this.productsService.findAll({ ...query, includeInactive: true });
  }

  @Post('owner/products')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put('owner/products/:id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete('owner/products/:id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete (deactivate) a product' })
  @ApiResponse({ status: 200, description: 'Product deactivated' })
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Delete('owner/products/:id/permanent')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a product' })
  @ApiResponse({ status: 200, description: 'Product permanently deleted' })
  async hardDeleteProduct(@Param('id') id: string) {
    return this.productsService.hardDelete(id);
  }

  // ==================== STOCK MANAGEMENT ====================

  @Post('owner/products/:id/stock')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product stock by delta' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  async updateStock(
    @Param('id') id: string,
    @Body('delta') delta: number,
  ) {
    return this.productsService.updateStock(id, delta);
  }

  @Post('owner/products/bulk-stock')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update product stock' })
  @ApiResponse({ status: 200, description: 'Bulk stock update results' })
  async bulkUpdateStock(@Body() body: { updates: { id: string; delta: number }[] }) {
    return this.productsService.bulkUpdateStock(body.updates);
  }

  // ==================== IMAGE MANAGEMENT ====================

  @Get('owner/product-images')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all uploaded product images' })
  @ApiResponse({ status: 200, description: 'Image list' })
  async getProductImages() {
    return this.productsService.getAllImages();
  }

  @Post('owner/product-images/upload')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a product image' })
  @ApiResponse({ status: 201, description: 'Image uploaded' })
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return this.productImageService.uploadImage(file);
  }

  @Delete('owner/product-images/:id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  async deleteProductImage(@Param('id') id: string) {
    return this.productImageService.deleteImage(id);
  }
}
