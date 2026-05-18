import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads', 'products');

  constructor(private readonly prisma: PrismaService) {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  async uploadImage(file: Express.Multer.File) {
    this.validateFile(file);

    const filename = this.generateFilename(file.originalname);
    const filepath = join(this.uploadDir, filename);

    writeFileSync(filepath, file.buffer);

    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/uploads/products/${filename}`;

    const image = await this.prisma.productImage.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        isPrimary: false,
      },
    });

    this.logger.log(`Product image uploaded: ${filename}`);

    return {
      id: image.id,
      filename: image.filename,
      url: image.url,
      originalName: image.originalName,
      size: image.size,
      mimeType: image.mimeType,
    };
  }

  async deleteImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    const filepath = join(this.uploadDir, image.filename);

    if (existsSync(filepath)) {
      unlinkSync(filepath);
      this.logger.log(`Deleted file: ${filepath}`);
    }

    await this.prisma.productImage.update({
      where: { id: imageId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Product image soft deleted: ${imageId}`);

    return { success: true, message: 'Image deleted' };
  }

  async getImages(limit = 50) {
    const images = await this.prisma.productImage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return images;
  }

  async setPrimaryImage(imageId: string, productId?: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (productId) {
      await this.prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });

      await this.prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true, productId },
      });
    } else {
      await this.prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    }

    return { success: true, message: 'Primary image set' };
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = this.getExtension(originalName);
    return `product_${timestamp}_${randomString}.${extension}`;
  }

  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
  }

  private getBaseUrl(): string {
    const envUrl = process.env.FRONTEND_URL;
    if (envUrl) {
      return envUrl;
    }

    const port = process.env.PORT || 3001;
    const host = process.env.HOST || 'http://localhost';
    return `${host}:${port}`;
  }
}
