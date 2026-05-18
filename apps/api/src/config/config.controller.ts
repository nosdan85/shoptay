import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { IsPublic } from '../common/decorators/is-public.decorator';
import { UpdateConfigDto } from './dto/update-config.dto';

@ApiTags('config')
@Controller({ path: 'shop/config', version: '1' })
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigService) {}

  @Get()
  @IsPublic()
  @ApiOperation({ summary: 'Get shop configuration' })
  @ApiResponse({ status: 200, description: 'Shop config' })
  async getConfig() {
    return this.configService.getConfig();
  }

  @Get('banners')
  @IsPublic()
  @ApiOperation({ summary: 'Get shop banners' })
  @ApiResponse({ status: 200, description: 'Banners array' })
  async getBanners() {
    return this.configService.getBanners();
  }

  @Get('best-sellers')
  @IsPublic()
  @ApiOperation({ summary: 'Get best seller products' })
  @ApiResponse({ status: 200, description: 'Best seller products' })
  async getBestSellers() {
    return this.configService.getBestSellers();
  }

  // Owner routes under /owner prefix
  @Put('general')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update general shop config' })
  @ApiResponse({ status: 200, description: 'Config updated' })
  async updateGeneralConfig(@Body() dto: UpdateConfigDto) {
    return this.configService.updateGeneralConfig(dto);
  }

  @Put('best-sellers')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update best seller product IDs' })
  @ApiResponse({ status: 200, description: 'Best sellers updated' })
  async updateBestSellers(@Body() body: { bestSellerIds: string[] }) {
    return this.configService.updateBestSellers(body.bestSellerIds);
  }

  @Post('banners/upload')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload banner image' })
  @ApiResponse({ status: 201, description: 'Banner uploaded' })
  async uploadBanner(@Body() body: { url: string; alt?: string; link?: string }) {
    return this.configService.addBanner(body);
  }

  @Delete('banners')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete banner' })
  @ApiResponse({ status: 200, description: 'Banner deleted' })
  async deleteBanner(@Body() body: { url: string }) {
    return this.configService.removeBanner(body.url);
  }

  @Put('announcements')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update announcements' })
  @ApiResponse({ status: 200, description: 'Announcements updated' })
  async updateAnnouncements(@Body() body: { announcements: any[] }) {
    return this.configService.updateAnnouncements(body.announcements);
  }

  @Put('maintenance')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle maintenance mode' })
  @ApiResponse({ status: 200, description: 'Maintenance mode updated' })
  async toggleMaintenance(@Body() body: { enabled: boolean }) {
    return this.configService.setMaintenanceMode(body.enabled);
  }

  // Additional owner endpoints under /owner prefix
  @Put('shop')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update full shop config' })
  @ApiResponse({ status: 200, description: 'Shop config updated' })
  async updateShopConfig(
    @Body() body: {
      shopName?: string;
      shopDescription?: string;
      contactEmail?: string;
      discordServerUrl?: string;
    },
    @Body('adminId') adminId: string,
  ) {
    return this.configService.updateShopConfig(body, adminId);
  }

  @Put('banners')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update all banners' })
  @ApiResponse({ status: 200, description: 'Banners updated' })
  async updateBanners(
    @Body() body: { banners: Array<{ url: string; alt?: string; link?: string }> },
    @Body('adminId') adminId: string,
  ) {
    return this.configService.updateBanners(body.banners, adminId);
  }
}
