import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner.guard';
import { IsPublic } from '../../common/decorators/is-public.decorator';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@ApiTags('Games')
@Controller({ path: 'shop/games', version: '1' })
export class GamesController {
  private readonly logger = new Logger(GamesController.name);

  constructor(private readonly gamesService: GamesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @IsPublic()
  @ApiOperation({ summary: 'List all active games' })
  @ApiResponse({ status: 200, description: 'Active games list' })
  async getActiveGames() {
    return this.gamesService.findActive();
  }

  @Get('all')
  @IsPublic()
  @ApiOperation({ summary: 'List all games (active and inactive)' })
  @ApiResponse({ status: 200, description: 'All games list' })
  async getAllGames(@Query('includeInactive') includeInactive = false) {
    return this.gamesService.findAll(includeInactive);
  }

  @Get(':id')
  @IsPublic()
  @ApiOperation({ summary: 'Get game by ID' })
  @ApiResponse({ status: 200, description: 'Game details' })
  async getGameById(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  @Get('slug/:slug')
  @IsPublic()
  @ApiOperation({ summary: 'Get game by slug' })
  @ApiResponse({ status: 200, description: 'Game details' })
  async getGameBySlug(@Param('slug') slug: string) {
    return this.gamesService.findBySlug(slug);
  }

  // ==================== OWNER ENDPOINTS ====================

  @Get('owner/all')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all games for admin' })
  @ApiResponse({ status: 200, description: 'All games list' })
  async getOwnerGames() {
    return this.gamesService.findAll(true);
  }

  @Post()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new game' })
  @ApiResponse({ status: 201, description: 'Game created' })
  async createGame(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a game' })
  @ApiResponse({ status: 200, description: 'Game updated' })
  async updateGame(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.gamesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a game' })
  @ApiResponse({ status: 200, description: 'Game deleted' })
  async deleteGame(@Param('id') id: string) {
    return this.gamesService.delete(id);
  }

  @Patch(':id/reorder')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder a game' })
  @ApiResponse({ status: 200, description: 'Game reordered' })
  async reorderGame(@Param('id') id: string, @Body('newSortOrder') newSortOrder: number) {
    return this.gamesService.reorder(id, newSortOrder);
  }
}
