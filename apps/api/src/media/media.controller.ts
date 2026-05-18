import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  Logger,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';

@ApiTags('media')
@Controller()
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(private readonly mediaService: MediaService) {}

  @Get('shop/product-images/:filename')
  @ApiOperation({ summary: 'Serve product image' })
  @ApiResponse({ status: 200, description: 'Image file' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async serveProductImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filepath = join(this.uploadDir, 'products', filename);
    
    if (!existsSync(filepath)) {
      throw new NotFoundException('Image not found');
    }

    res.sendFile(filepath);
  }

  @Get('banners/:filename')
  @ApiOperation({ summary: 'Serve banner image' })
  @ApiResponse({ status: 200, description: 'Banner file' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  async serveBanner(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filepath = join(this.uploadDir, 'banners', filename);
    
    if (!existsSync(filepath)) {
      throw new NotFoundException('Banner not found');
    }

    res.sendFile(filepath);
  }

  @Post('shop/owner/product-images/upload')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, callback) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Only image files are allowed'), false);
      }
    },
  }))
  @ApiResponse({ status: 201, description: 'Image uploaded' })
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    const result = await this.mediaService.saveProductImage(file);
    
    return {
      success: true,
      filename: result.filename,
      url: result.url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('shop/owner/config/banners/upload')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload banner image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, callback) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Only image files are allowed'), false);
      }
    },
  }))
  @ApiResponse({ status: 201, description: 'Banner uploaded' })
  async uploadBannerImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    const result = await this.mediaService.saveBannerImage(file);
    
    return {
      success: true,
      filename: result.filename,
      url: result.url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get('roblox/search')
  @ApiOperation({ summary: 'Roblox username lookup' })
  @ApiResponse({ status: 200, description: 'Roblox user data' })
  async searchRobloxUser(@Param('username') username: string) {
    return this.mediaService.searchRobloxUser(username);
  }
}
