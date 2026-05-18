import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const games = await this.prisma.game.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        categories: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            iconUrl: true,
            isActive: true,
            sortOrder: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return games.map((game) => this.transformGame(game));
  }

  async findActive() {
    return this.findAll(false);
  }

  async findOne(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true, categories: true },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.transformGame(game);
  }

  async findBySlug(slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true, categories: true },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.transformGame(game);
  }

  async create(dto: CreateGameDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.game.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Game with this slug already exists');
    }

    const game = await this.prisma.game.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        iconUrl: dto.iconUrl,
        bannerUrl: dto.bannerUrl,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        categories: true,
      },
    });

    this.logger.log(`Game ${game.name} created with ID ${game.id}`);

    return this.transformGame(game);
  }

  async update(id: string, dto: UpdateGameDto) {
    const game = await this.prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (dto.slug && dto.slug !== game.slug) {
      const existing = await this.prisma.game.findUnique({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new BadRequestException('Game with this slug already exists');
      }
    }

    const updateData: any = { ...dto };
    delete updateData.sortOrder;

    const updated = await this.prisma.game.update({
      where: { id },
      data: {
        ...updateData,
        sortOrder: dto.sortOrder ?? game.sortOrder,
      },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Game ${id} updated`);

    return this.transformGame(updated);
  }

  async delete(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, categories: true },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete game with ${game._count.products} existing products. Remove or reassign products first.`,
      );
    }

    if (game._count.categories > 0) {
      throw new BadRequestException(
        `Cannot delete game with ${game._count.categories} existing categories. Remove categories first.`,
      );
    }

    await this.prisma.game.delete({
      where: { id },
    });

    this.logger.log(`Game ${id} deleted`);

    return { success: true, message: 'Game deleted' };
  }

  async reorder(id: string, newSortOrder: number) {
    const game = await this.prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const oldSortOrder = game.sortOrder;

    if (oldSortOrder === newSortOrder) {
      return { success: true, message: 'Sort order unchanged', game: this.transformGame(game) };
    }

    await this.prisma.$transaction(async (tx) => {
      if (newSortOrder > oldSortOrder) {
        await tx.game.updateMany({
          where: {
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
        await tx.game.updateMany({
          where: {
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

      await tx.game.update({
        where: { id },
        data: { sortOrder: newSortOrder },
      });
    });

    const updated = await this.prisma.game.findUnique({
      where: { id },
      include: { categories: true },
    });

    this.logger.log(`Game ${id} reordered from ${oldSortOrder} to ${newSortOrder}`);

    return {
      success: true,
      message: `Game reordered from ${oldSortOrder} to ${newSortOrder}`,
      game: this.transformGame(updated!),
    };
  }

  private transformGame(game: any) {
    return {
      id: game.id,
      name: game.name,
      slug: game.slug,
      description: game.description,
      iconUrl: game.iconUrl,
      bannerUrl: game.bannerUrl,
      isActive: game.isActive,
      sortOrder: game.sortOrder,
      categories: game.categories || [],
      productCount: game._count?.products ?? 0,
      categoryCount: game._count?.categories ?? 0,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
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
