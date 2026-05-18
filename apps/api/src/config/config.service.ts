import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly CONFIG_ID = 'default';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: NestConfigService,
  ) {}

  async getConfig() {
    // Try cache first
    const cached = await this.redis.get('cache:config:shop');
    if (cached) {
      return cached;
    }

    let config = await this.prisma.shopConfig.findUnique({
      where: { id: this.CONFIG_ID },
    });

    // Create default config if doesn't exist
    if (!config) {
      config = await this.prisma.shopConfig.create({
        data: {
          id: this.CONFIG_ID,
          shopName: 'Nos Market',
          bestSellerIds: [],
          banners: [],
          announcements: [],
          maintenanceMode: false,
        },
      });
    }

    const result = {
      shopName: config.shopName,
      shopDescription: config.shopDescription,
      contactEmail: config.contactEmail,
      discordServerUrl: config.discordServerUrl,
      bestSellerIds: config.bestSellerIds,
      banners: config.banners || [],
      announcements: config.announcements || [],
      maintenanceMode: config.maintenanceMode,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };

    // Cache for 5 minutes
    await this.redis.set('cache:config:shop', result, 300);

    return result;
  }

  async getShopConfig() {
    return this.getConfig();
  }

  async getBanners() {
    // Try cache first
    const cached = await this.redis.get('cache:config:banners');
    if (cached) {
      return cached;
    }

    const config = await this.prisma.shopConfig.findUnique({
      where: { id: this.CONFIG_ID },
      select: { banners: true },
    });

    const banners = config?.banners || [];

    // Cache for 5 minutes
    await this.redis.set('cache:config:banners', banners, 300);

    return banners;
  }

  async getBestSellerIds() {
    const config = await this.prisma.shopConfig.findUnique({
      where: { id: this.CONFIG_ID },
      select: { bestSellerIds: true },
    });

    return config?.bestSellerIds || [];
  }

  async getFeaturedProductIds(): Promise<string[]> {
    // Featured products are the same as best sellers for now
    return this.getBestSellerIds();
  }

  async updateShopConfig(data: {
    shopName?: string;
    shopDescription?: string;
    contactEmail?: string;
    discordServerUrl?: string;
  }, adminId: string) {
    const config = await this.prisma.shopConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: data,
      create: {
        id: this.CONFIG_ID,
        shopName: data.shopName || 'Nos Market',
        shopDescription: data.shopDescription,
        contactEmail: data.contactEmail,
        discordServerUrl: data.discordServerUrl,
        bestSellerIds: [],
        banners: [],
        announcements: [],
        maintenanceMode: false,
      },
    });

    // Invalidate cache
    await this.redis.del('cache:config:shop');

    this.logger.log(`Shop config updated by admin ${adminId}`);

    return {
      success: true,
      config: {
        shopName: config.shopName,
        shopDescription: config.shopDescription,
        contactEmail: config.contactEmail,
        discordServerUrl: config.discordServerUrl,
      },
    };
  }

  async updateBanners(banners: Array<{ url: string; alt?: string; link?: string }>, adminId: string) {
    const config = await this.prisma.shopConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: { banners },
      create: {
        id: this.CONFIG_ID,
        shopName: 'Nos Market',
        bestSellerIds: [],
        banners,
        announcements: [],
        maintenanceMode: false,
      },
    });

    // Invalidate cache
    await this.redis.del('cache:config:shop');
    await this.redis.del('cache:config:banners');

    this.logger.log(`Banners updated by admin ${adminId}: ${banners.length} banners`);

    return {
      success: true,
      banners: config.banners,
    };
  }

  async updateBestSellers(bestSellerIds: string[], adminId: string) {
    const config = await this.prisma.shopConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: { bestSellerIds },
      create: {
        id: this.CONFIG_ID,
        shopName: 'Nos Market',
        bestSellerIds,
        banners: [],
        announcements: [],
        maintenanceMode: false,
      },
    });

    // Invalidate cache
    await this.redis.del('cache:config:shop');
    await this.redis.del('cache:config:best-sellers');

    this.logger.log(`Best sellers updated by admin ${adminId}: ${bestSellerIds.length} products`);

    return {
      success: true,
      bestSellerIds: config.bestSellerIds,
    };
  }

  async updateGeneralConfig(data: {
    shopName?: string;
    shopDescription?: string;
    contactEmail?: string;
    discordServerUrl?: string;
  }) {
    const config = await this.prisma.shopConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: data,
      create: {
        id: this.CONFIG_ID,
        shopName: data.shopName || 'Nos Market',
        shopDescription: data.shopDescription,
        contactEmail: data.contactEmail,
        discordServerUrl: data.discordServerUrl,
        bestSellerIds: [],
        banners: [],
        announcements: [],
        maintenanceMode: false,
      },
    });

    // Invalidate cache
    await this.redis.del('cache:config:shop');

    this.logger.log('Shop config updated');

    return {
      success: true,
      config: {
        shopName: config.shopName,
        shopDescription: config.shopDescription,
        contactEmail: config.contactEmail,
        discordServerUrl: config.discordServerUrl,
      },
    };
  }

  async updateBestSellersOld(bestSellerIds: string[]) {
    const config = await this.prisma.shopConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: { bestSellerIds },
      create: {
        id: this.CONFIG_ID,
        shopName: 'Nos Market',
        bestSellerIds,
        banners: [],
        announcements: [],
        maintenanceMode: false,
      },
    });

    this.logger.log(`Best sellers updated: ${bestSellerIds.length} products`);

    return {
      success: true,
      bestSellerIds: config.bestSellerIds,
    };
  }

  async addBanner(banner: { url: string; alt?: string; link?: string }) {
    const config = await this.prisma.shopConfig.findUnique({
      where: { id: this.CONFIG_ID },
    });

    const banners = Array.isArray(config?.banners) ? config.banners : [];
    const newBanner = {
      url: banner.url,
      alt: banner.alt || '',
      link: banner.link || '',
      id: `banner_${Date.now()}`,
      addedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.shopConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: {
        banners: [...banners, newBanner],
      },
      create: {
        id: this.CONFIG_ID,
        shopName: 'Nos Market',
        bestSellerIds: [],
        banners: [newBanner],
        announcements: [],
        maintenanceMode: false,
      },
    });

    // Invalidate cache
    await this.redis.del('cache:config:shop');
    await this.redis.del('cache:config:banners');

    this.logger.log(`Banner added: ${banner.url}`);

    return {
      success: true,
      banner: newBanner,
      totalBanners: (updated.banners || []).length,
    };
  }

  async removeBanner(url: string) {
    const config = await this.prisma.shopConfig.findUnique({
      where: { id: this.CONFIG_ID },
    });

    if (!config || !Array.isArray(config.banners)) {
      throw new Error('Config not found');
    }

    const banners = config.banners.filter((b: any) => b.url !== url);

    await this.prisma.shopConfig.update({
      where: { id: this.CONFIG_ID },
      data: { banners },
    });

    // Invalidate cache
    await this.redis.del('cache:config:shop');
    await this.redis.del('cache:config:banners');

    this.logger.log(`Banner removed: ${url}`);

    return {
      success: true,
      remainingBanners: banners.length,
    };
  }

  async updateAnnouncements(announcements: any[]) {
    const config = await this.prisma.shopConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: { announcements },
      create: {
        id: this.CONFIG_ID,
        shopName: 'Nos Market',
        bestSellerIds: [],
        banners: [],
        announcements,
        maintenanceMode: false,
      },
    });

    // Invalidate cache
    await this.redis.del('cache:config:shop');

    this.logger.log(`Announcements updated: ${announcements.length} announcements`);

    return {
      success: true,
      announcements: config.announcements,
    };
  }

  async setMaintenanceMode(enabled: boolean) {
    await this.prisma.shopConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: { maintenanceMode: enabled },
      create: {
        id: this.CONFIG_ID,
        shopName: 'Nos Market',
        bestSellerIds: [],
        banners: [],
        announcements: [],
        maintenanceMode: enabled,
      },
    });

    // Invalidate cache
    await this.redis.del('cache:config:shop');

    this.logger.log(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);

    return {
      success: true,
      maintenanceMode: enabled,
    };
  }

  async isMaintenanceMode(): Promise<boolean> {
    const config = await this.prisma.shopConfig.findUnique({
      where: { id: this.CONFIG_ID },
      select: { maintenanceMode: true },
    });

    return config?.maintenanceMode ?? false;
  }

  async getBestSellers() {
    const config = await this.prisma.shopConfig.findUnique({
      where: { id: this.CONFIG_ID },
      select: { bestSellerIds: true },
    });

    if (!config?.bestSellerIds || config.bestSellerIds.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: config.bestSellerIds },
        isActive: true,
      },
      take: 10,
    });

    return products;
  }

  async getBannersOld() {
    const config = await this.prisma.shopConfig.findUnique({
      where: { id: this.CONFIG_ID },
      select: { banners: true },
    });

    return config?.banners || [];
  }

  // Invalidate all config caches (useful when data changes)
  async invalidateCache() {
    await this.redis.del('cache:config:shop');
    await this.redis.del('cache:config:banners');
    await this.redis.del('cache:config:best-sellers');
    this.logger.log('Config cache invalidated');
  }
}
