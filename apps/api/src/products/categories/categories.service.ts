import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        game: {
          select: { id: true, name: true, slug: true, iconUrl: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((category) => this.transformCategory(category));
  }

  async findAllForOwner() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        game: {
          select: { id: true, name: true, slug: true, iconUrl: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((category) => this.transformCategory(category));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        game: {
          select: { id: true, name: true, slug: true, iconUrl: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.transformCategory(category);
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      include: {
        game: {
          select: { id: true, name: true, slug: true, iconUrl: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.transformCategory(category);
  }

  async findByGame(gameId: string) {
    const categories = await this.prisma.category.findMany({
      where: { gameId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        game: {
          select: { id: true, name: true, slug: true, iconUrl: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((category) => this.transformCategory(category));
  }

  async create(dto: CreateCategoryDto, gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new BadRequestException('Game not found');
    }

    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: { gameId, slug },
    });

    if (existing) {
      throw new BadRequestException('Category with this slug already exists in the game');
    }

    const category = await this.prisma.category.create({
      data: {
        gameId,
        name: dto.name,
        slug,
        description: dto.description,
        iconUrl: dto.iconUrl,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        game: {
          select: { id: true, name: true, slug: true, iconUrl: true },
        },
      },
    });

    this.logger.log(`Category ${category.name} created with ID ${category.id}`);

    return this.transformCategory(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findFirst({
        where: {
          gameId: category.gameId,
          slug: dto.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException('Category with this slug already exists in the game');
      }
    }

    const updateData: any = { ...dto };
    delete updateData.sortOrder;

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...updateData,
        sortOrder: dto.sortOrder ?? category.sortOrder,
      },
      include: {
        game: {
          select: { id: true, name: true, slug: true, iconUrl: true },
        },
      },
    });

    this.logger.log(`Category ${id} updated`);

    return this.transformCategory(updated);
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category._count.products} existing products. Remove or reassign products first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    this.logger.log(`Category ${id} deleted`);

    return { success: true, message: 'Category deleted' };
  }

  async reorder(id: string, newSortOrder: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const oldSortOrder = category.sortOrder;

    if (oldSortOrder === newSortOrder) {
      return {
        success: true,
        message: 'Sort order unchanged',
        category: this.transformCategory(category),
      };
    }

    await this.prisma.$transaction(async (tx) => {
      if (newSortOrder > oldSortOrder) {
        await tx.category.updateMany({
          where: {
            gameId: category.gameId,
            sortOrder: {
              gt: oldSortOrder,
              lte: newSortOrder,
            },
          },
          data: {
            sortOrder: {
              decrement: 1,
            },
          },
        });
      } else {
        await tx.category.updateMany({
          where: {
            gameId: category.gameId,
            sortOrder: {
              gte: newSortOrder,
              lt: oldSortOrder,
            },
          },
          data: {
            sortOrder: {
              increment: 1,
            },
          },
        });
      }

      await tx.category.update({
        where: { id },
        data: { sortOrder: newSortOrder },
      });
    });

    const updated = await this.prisma.category.findUnique({
      where: { id },
      include: {
        game: {
          select: { id: true, name: true, slug: true, iconUrl: true },
        },
      },
    });

    this.logger.log(`Category ${id} reordered from ${oldSortOrder} to ${newSortOrder}`);

    return {
      success: true,
      message: `Category reordered from ${oldSortOrder} to ${newSortOrder}`,
      category: this.transformCategory(updated!),
    };
  }

  private transformCategory(category: any) {
    return {
      id: category.id,
      gameId: category.gameId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      iconUrl: category.iconUrl,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      game: category.game
        ? {
            id: category.game.id,
            name: category.game.name,
            slug: category.game.slug,
            iconUrl: category.game.iconUrl,
          }
        : null,
      productCount: category._count?.products ?? 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
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
