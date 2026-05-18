import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProofDto } from './dto/create-proof.dto';
import { ProofQueryDto } from './dto/proof-query.dto';

@Injectable()
export class ProofsService {
  private readonly logger = new Logger(ProofsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPublicProofs(query: ProofQueryDto) {
    const { page = 1, limit = 48, discordId, source } = query;

    const where: any = {};

    if (discordId) {
      where.discordId = discordId;
    }

    if (source) {
      where.source = source;
    }

    const [proofs, total] = await Promise.all([
      this.prisma.deliveryProof.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          orderId: true,
          discordUsername: true,
          totalAmount: true,
          items: true,
          imageUrls: true,
          source: true,
          createdAt: true,
        },
      }),
      this.prisma.deliveryProof.count({ where }),
    ]);

    return {
      proofs: proofs.map((proof) => ({
        id: proof.id,
        orderId: proof.orderId,
        username: proof.discordUsername,
        totalAmount: Number(proof.totalAmount),
        items: proof.items as any[],
        images: proof.imageUrls,
        source: proof.source,
        createdAt: proof.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProofById(id: string) {
    const proof = await this.prisma.deliveryProof.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            items: {
              select: {
                name: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    });

    if (!proof) {
      throw new NotFoundException('Proof not found');
    }

    return {
      id: proof.id,
      orderId: proof.orderId,
      discordId: proof.discordId,
      discordUsername: proof.discordUsername,
      totalAmount: Number(proof.totalAmount),
      items: proof.items as any[],
      imageUrls: proof.imageUrls,
      imageHashes: proof.imageHashes,
      source: proof.source,
      vouchMessageId: proof.vouchMessageId,
      createdAt: proof.createdAt,
      order: proof.order,
      images: proof.images.map((img) => ({
        id: img.id,
        position: img.position,
        contentType: img.contentType,
        sourceUrl: img.sourceUrl,
      })),
    };
  }

  async createProof(
    dto: CreateProofDto,
    discordId?: string,
    discordUsername?: string,
  ) {
    // Verify order exists
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate total from items
    const totalAmount = dto.items.reduce((sum, item) => sum + item.lineTotal, 0);

    const proof = await this.prisma.deliveryProof.create({
      data: {
        orderId: dto.orderId,
        discordId: dto.discordId || discordId || null,
        discordUsername: dto.discordUsername || discordUsername || 'Anonymous',
        totalAmount,
        items: dto.items as any,
        imageUrls: dto.imageUrls || [],
        imageHashes: [],
        source: dto.source || 'manual',
        vouchMessageId: dto.vouchMessageId,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
          },
        },
      },
    });

    this.logger.log(`Proof ${proof.id} created for order ${dto.orderId}`);

    return {
      id: proof.id,
      orderId: proof.orderId,
      totalAmount: Number(proof.totalAmount),
      items: proof.items,
      imageUrls: proof.imageUrls,
      createdAt: proof.createdAt,
    };
  }

  async createProofFromAutoVouch(
    orderId: string,
    imageUrls: string[],
    items: { name: string; packQuantity?: number; deliveredLabel: string; lineTotal: number }[],
    vouchMessageId?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate total from items
    const totalAmount = order.items.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );

    const proof = await this.prisma.deliveryProof.create({
      data: {
        orderId,
        discordId: order.discordId,
        discordUsername: order.discordUsername,
        totalAmount,
        items: items as any,
        imageUrls,
        imageHashes: [],
        source: 'auto_vouch',
        vouchMessageId,
      },
    });

    this.logger.log(`Auto-vouch proof ${proof.id} created for order ${orderId}`);

    return proof;
  }

  async deleteProof(id: string, userId?: string) {
    const proof = await this.prisma.deliveryProof.findUnique({
      where: { id },
    });

    if (!proof) {
      throw new NotFoundException('Proof not found');
    }

    await this.prisma.deliveryProof.delete({
      where: { id },
    });

    this.logger.log(`Proof ${id} deleted`);

    return { success: true };
  }

  async getProofStats() {
    const [total, autoVouch, manual, admin] = await Promise.all([
      this.prisma.deliveryProof.count(),
      this.prisma.deliveryProof.count({ where: { source: 'auto_vouch' } }),
      this.prisma.deliveryProof.count({ where: { source: 'manual' } }),
      this.prisma.deliveryProof.count({ where: { source: 'admin' } }),
    ]);

    return { total, autoVouch, manual, admin };
  }

  async getProofsByOrder(orderId: string) {
    return this.prisma.deliveryProof.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addProofImages(
    proofId: string,
    images: { position: number; contentType?: string; sourceUrl?: string; data?: Buffer }[],
  ) {
    for (const image of images) {
      await this.prisma.deliveryProofImage.create({
        data: {
          proofId,
          position: image.position,
          contentType: image.contentType,
          sourceUrl: image.sourceUrl,
          data: image.data,
        },
      });
    }

    return { success: true, count: images.length };
  }
}
