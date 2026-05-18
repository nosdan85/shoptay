import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');
  private readonly productsDir = join(this.uploadDir, 'products');
  private readonly bannersDir = join(this.uploadDir, 'banners');

  constructor(private readonly prisma: PrismaService) {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.uploadDir, this.productsDir, this.bannersDir].forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async saveProductImage(file: Express.Multer.File) {
    const filename = `product_${Date.now()}_${this.sanitizeFilename(file.originalname)}`;
    const filepath = join(this.productsDir, filename);

    writeFileSync(filepath, file.buffer);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const url = `${baseUrl}/api/shop/product-images/${filename}`;

    // Save to database
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

    this.logger.log(`Product image saved: ${filename}`);

    return {
      id: image.id,
      filename,
      url,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async saveBannerImage(file: Express.Multer.File) {
    const filename = `banner_${Date.now()}_${this.sanitizeFilename(file.originalname)}`;
    const filepath = join(this.bannersDir, filename);

    writeFileSync(filepath, file.buffer);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const url = `${baseUrl}/api/banners/${filename}`;

    this.logger.log(`Banner image saved: ${filename}`);

    return {
      filename,
      url,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async deleteProductImage(filename: string) {
    const filepath = join(this.productsDir, filename);

    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }

    await this.prisma.productImage.deleteMany({
      where: { filename },
    });

    this.logger.log(`Product image deleted: ${filename}`);

    return { success: true };
  }

  async getProductImages(limit = 50) {
    return this.prisma.productImage.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async searchRobloxUser(username: string) {
    try {
      const response = await axios.get(
        `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`,
        {
          timeout: 5000,
        },
      );

      const users = response.data.data.map((user: any) => ({
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`,
      }));

      return { success: true, users };
    } catch (error) {
      this.logger.warn(`Roblox user search failed: ${error}`);
      return {
        success: false,
        users: [],
        error: 'Roblox search unavailable',
      };
    }
  }

  async getRobloxUserByUsername(username: string) {
    try {
      const response = await axios.get(
        `https://users.roblox.com/v1/usernames/users`,
        {
          method: 'POST',
          data: {
            usernames: [username],
          },
          timeout: 5000,
        },
      );

      const user = response.data.data[0];
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          displayName: user.displayName,
          avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`,
        },
      };
    } catch (error) {
      this.logger.warn(`Roblox user lookup failed: ${error}`);
      return { success: false, error: 'User lookup failed' };
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
  }
}
