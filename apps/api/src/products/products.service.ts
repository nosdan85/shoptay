import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, SortByField, SortOrder } from './dto/product-query.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 20,
      gameId,
      categoryId,
      search,
      sortBy = SortByField.SORT_ORDER,
      sortOrder = SortOrder.ASC,
      minPrice,
      maxPrice,
      inStock,
      includeInactive = false,
    } = query;

    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (gameId) {
      where.gameId = gameId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = new Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        where.price.lte = new Decimal(maxPrice);
      }
    }

    if (inStock !== undefined) {
      if (inStock) {
        where.OR = [
          { stock: { gt: 0 } },
          { stock: { equals: -1 } },
        ];
      } else {
        where.stock = 0;
      }
    }

    const skip = (page - 1) * limit;

    let orderBy: any = {};
    switch (sortBy) {
      case SortByField.NAME:
        orderBy.name = sortOrder;
        break;
      case SortByField.PRICE:
        orderBy.price = sortOrder;
        break;
      case SortByField.STOCK:
        orderBy.stock = sortOrder;
        break;
      case SortByField.CREATED_AT:
        orderBy.createdAt = sortOrder;
        break;
      case SortByField.SORT_ORDER:
      default:
        orderBy.sortOrder = sortOrder;
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          game: {
            select: { id: true, name: true, slug: true, iconUrl: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            where: { deletedAt: null },
            orderBy: { isPrimary: 'desc' },
            take: 10,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const transformedProducts = products.map((product) =>
      this.transformProduct(product),
    );

    return {
      data: transformedProducts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        game: true,
        category: true,
        images: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.transformProduct(product);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        game: true,
        category: true,
        images: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.transformProduct(product);
  }

  async findByGame(gameId: string, query: ProductQueryDto) {
    return this.findAll({ ...query, gameId });
  }

  async findByCategory(categoryId: string, query: ProductQueryDto) {
    return this.findAll({ ...query, categoryId });
  }

  async create(dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    if (dto.gameId) {
      const game = await this.prisma.game.findUnique({
        where: { id: dto.gameId },
      });

      if (!game) {
        throw new BadRequestException('Game not found');
      }
    }

    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.product.findFirst({
      where: { categoryId: dto.categoryId, slug },
    });

    if (existing) {
      throw new BadRequestException(
        'Product with this slug already exists in the category',
      );
    }

    const product = await this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        gameId: dto.gameId || category.gameId,
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        price: new Decimal(dto.price),
        originalPriceString: dto.originalPriceString,
        bulkPriceCents: dto.bulkPriceCents,
        bulkPriceString: dto.bulkPriceString,
        image: dto.image,
        imageUrls: dto.imageUrls || [],
        stock: dto.stock ?? 0,
        maxPerOrder: dto.maxPerOrder ?? 99,
        isActive: dto.isActive ?? true,
        isDigital: dto.isDigital ?? false,
        deliveryInfo: dto.deliveryInfo,
        metadata: dto.metadata,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        game: true,
        category: true,
      },
    });

    this.logger.log(`Product ${product.name} created with ID ${product.id}`);

    return this.transformProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findFirst({
        where: {
          categoryId: dto.categoryId || product.categoryId,
          slug: dto.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Product with this slug already exists in the category',
        );
      }
    }

    const updateData: any = { ...dto };

    if (dto.price !== undefined) {
      updateData.price = new Decimal(dto.price);
    }

    delete updateData.categoryId;

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        categoryId: dto.categoryId,
      },
      include: {
        game: true,
        category: true,
      },
    });

    this.logger.log(`Product ${id} updated`);

    return this.transformProduct(updated);
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Product ${id} deactivated`);

    return { success: true, message: 'Product deactivated' };
  }

  async hardDelete(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    this.logger.log(`Product ${id} permanently deleted`);

    return { success: true, message: 'Product permanently deleted' };
  }

  async updateStock(id: string, delta: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { stock: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock === -1) {
      return {
        success: true,
        message: 'Unlimited stock product, no update needed',
        stock: -1,
      };
    }

    const newStock = product.stock + delta;

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock. Current: ${product.stock}, Requested delta: ${delta}`,
      );
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      select: { stock: true },
    });

    this.logger.log(`Product ${id} stock updated: ${product.stock} -> ${updated.stock}`);

    return {
      success: true,
      message: `Stock updated by ${delta}`,
      stock: updated.stock,
    };
  }

  async bulkUpdateStock(updates: { id: string; delta: number }[]) {
    const results = await Promise.allSettled(
      updates.map(({ id, delta }) => this.updateStock(id, delta)),
    );

    const succeeded: any[] = [];
    const failed: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        succeeded.push({
          id: updates[index].id,
          ...result.value,
        });
      } else {
        failed.push({
          id: updates[index].id,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    return {
      succeeded,
      failed,
      totalSucceeded: succeeded.length,
      totalFailed: failed.length,
    };
  }

  async search(query: string, limit: number = 10) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { shortDescription: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        game: {
          select: { id: true, name: true, slug: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return products.map((product) => this.transformProduct(product));
  }

  async getAllImages() {
    const images = await this.prisma.productImage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return images;
  }

  private transformProduct(product: any) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const primaryImage = product.images?.find((img: any) => img.isPrimary);
    const displayImage = primaryImage?.url || product.image || '';
    const imageUrl = displayImage.startsWith('http')
      ? displayImage
      : `${baseUrl}${displayImage}`;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: parseFloat(product.price.toString()),
      originalPriceString: product.originalPriceString,
      bulkPriceCents: product.bulkPriceCents,
      bulkPriceString: product.bulkPriceString,
      stock: product.stock,
      maxPerOrder: product.maxPerOrder,
      image: product.image,
      imageUrl,
      imageUrls: product.imageUrls || [],
      images: product.images || [],
      isActive: product.isActive,
      isDigital: product.isDigital,
      deliveryInfo: product.deliveryInfo,
      metadata: product.metadata,
      sortOrder: product.sortOrder,
      game: product.game
        ? {
            id: product.game.id,
            name: product.game.name,
            slug: product.game.slug,
            iconUrl: product.game.iconUrl,
          }
        : null,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100)
    );
  }
}
