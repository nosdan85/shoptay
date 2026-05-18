import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProofsService } from './proofs.service';
import { CreateProofDto } from './dto/create-proof.dto';
import { ProofQueryDto } from './dto/proof-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { IsPublic } from '../common/decorators/is-public.decorator';

@ApiTags('proofs')
@Controller('shop/proofs')
export class ProofsController {
  private readonly logger = new Logger(ProofsController.name);

  constructor(private readonly proofsService: ProofsService) {}

  @Get()
  @IsPublic()
  @ApiOperation({ summary: 'Get public proof gallery' })
  @ApiResponse({ status: 200, description: 'Proof gallery' })
  async getPublicProofs(@Query() query: ProofQueryDto) {
    return this.proofsService.getPublicProofs(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get proof statistics (owner only)' })
  @ApiResponse({ status: 200, description: 'Proof statistics' })
  async getProofStats() {
    return this.proofsService.getProofStats();
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get proofs by order ID' })
  @ApiResponse({ status: 200, description: 'Proofs found' })
  async getProofsByOrder(@Param('orderId') orderId: string) {
    return this.proofsService.getProofsByOrder(orderId);
  }

  @Get(':id')
  @IsPublic()
  @ApiOperation({ summary: 'Get proof by ID' })
  @ApiResponse({ status: 200, description: 'Proof found' })
  @ApiResponse({ status: 404, description: 'Proof not found' })
  async getProofById(@Param('id') id: string) {
    return this.proofsService.getProofById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create proof (owner only)' })
  @ApiResponse({ status: 201, description: 'Proof created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createProof(
    @Body() dto: CreateProofDto,
    @CurrentUserId() userId?: string,
  ) {
    return this.proofsService.createProof(dto, userId, undefined);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete proof (owner only)' })
  @ApiResponse({ status: 200, description: 'Proof deleted' })
  @ApiResponse({ status: 404, description: 'Proof not found' })
  async deleteProof(
    @Param('id') id: string,
    @CurrentUserId() userId?: string,
  ) {
    return this.proofsService.deleteProof(id, userId);
  }
}

// API v2 endpoints for Discord bot integration
@ApiTags('proofs')
@Controller('v1/proofs')
export class ProofsV1Controller {
  private readonly logger = new Logger(ProofsV1Controller.name);

  constructor(private readonly proofsService: ProofsService) {}

  @Post('auto-vouch')
  @IsPublic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create auto-vouch proof (Discord bot)' })
  @ApiResponse({ status: 201, description: 'Proof created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createAutoVouchProof(@Body() body: {
    orderId: string;
    imageUrls: string[];
    items: { name: string; packQuantity?: number; deliveredLabel: string; lineTotal: number }[];
    vouchMessageId?: string;
  }) {
    return this.proofsService.createProofFromAutoVouch(
      body.orderId,
      body.imageUrls,
      body.items,
      body.vouchMessageId,
    );
  }
}
