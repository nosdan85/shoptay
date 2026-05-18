import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner.guard';
import { IsPublic } from '../../common/decorators/is-public.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller({ path: 'shop/categories', version: '1' })
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @IsPublic()
  @ApiOperation({ summary: 'List all active categories' })
  @ApiResponse({ status: 200, description: 'Active categories list' })
  async getCategories() {
    return this.categoriesService.findAll();
  }

  @Get('all')
  @IsPublic()
  @ApiOperation({ summary: 'List all categories (active and inactive)' })
  @ApiResponse({ status: 200, description: 'All categories list' })
  async getAllCategories() {
    return this.categoriesService.findAllForOwner();
  }

  @Get(':id')
  @IsPublic()
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  @IsPublic()
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiResponse({ status: 200, description: 'Category details' })
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get('game/:gameId')
  @IsPublic()
  @ApiOperation({ summary: 'Get categories by game ID' })
  @ApiResponse({ status: 200, description: 'Categories for game' })
  async getCategoriesByGame(@Param('gameId') gameId: string) {
    return this.categoriesService.findByGame(gameId);
  }

  // ==================== OWNER ENDPOINTS ====================

  @Get('owner/all')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all categories for admin' })
  @ApiResponse({ status: 200, description: 'All categories list' })
  async getOwnerCategories() {
    return this.categoriesService.findAllForOwner();
  }

  @Post()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @Body('gameId') gameId: string,
  ) {
    return this.categoriesService.create(dto, gameId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }

  @Patch(':id/reorder')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder a category' })
  @ApiResponse({ status: 200, description: 'Category reordered' })
  async reorderCategory(
    @Param('id') id: string,
    @Body('newSortOrder') newSortOrder: number,
  ) {
    return this.categoriesService.reorder(id, newSortOrder);
  }
}
