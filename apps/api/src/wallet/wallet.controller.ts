import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreateTopupDto } from './dto/create-topup.dto';
import { CompleteTopupDto } from './dto/complete-topup.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { WalletQueryDto } from './dto/wallet-query.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('shop/wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get wallet with transactions' })
  @ApiResponse({ status: 200, description: 'Wallet data with balance and recent transactions' })
  async getWallet(@CurrentUserId() userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get wallet transaction history with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated transaction history' })
  async getTransactions(
    @CurrentUserId() userId: string,
    @Query() query: WalletQueryDto,
  ) {
    return this.walletService.getTransactions(userId, query);
  }

  @Post('topup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create topup request' })
  @ApiResponse({ status: 201, description: 'Topup created with payment instructions' })
  async createTopup(
    @Body() dto: CreateTopupDto,
    @CurrentUserId() userId: string,
  ) {
    return this.walletService.createTopup(userId, dto);
  }

  @Post('topup/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete Square/CashApp topup payment' })
  @ApiResponse({ status: 200, description: 'Topup completed' })
  async completeTopup(
    @Param('id') topupId: string,
    @Body() dto: CompleteTopupDto,
    @CurrentUserId() userId: string,
  ) {
    return this.walletService.completeTopup(topupId, dto.squarePaymentId, userId);
  }

  @Post('topup/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel pending topup' })
  @ApiResponse({ status: 200, description: 'Topup cancelled' })
  async cancelTopup(
    @Param('id') topupId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.walletService.cancelTopup(topupId, userId);
  }

  // Admin endpoints
  @Get('admin/topups')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending topups (owner)' })
  @ApiResponse({ status: 200, description: 'Pending topups list' })
  async getAllPendingTopups(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('method') method?: string,
  ) {
    return this.walletService.getAllPendingTopups({ page, limit, method });
  }

  @Get('admin/transactions')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all transactions (owner)' })
  @ApiResponse({ status: 200, description: 'All transactions with pagination' })
  async getAllTransactions(@Query() query: WalletQueryDto) {
    return this.walletService.getAllTransactions(query);
  }

  @Post('admin/adjust')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually adjust user balance (owner)' })
  @ApiResponse({ status: 200, description: 'Balance adjusted' })
  async adjustBalance(
    @Body() dto: AdjustBalanceDto,
    @CurrentUserId() adminId: string,
  ) {
    return this.walletService.adjustBalance(adminId, {
      userId: dto.userId,
      amountCents: dto.amountCents,
      note: dto.note,
    });
  }

  @Post('admin/topups/:id/approve')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually approve topup (owner)' })
  @ApiResponse({ status: 200, description: 'Topup approved' })
  async approveTopup(
    @Param('id') topupId: string,
    @CurrentUserId() adminId: string,
  ) {
    return this.walletService.approveTopup(topupId, adminId);
  }

  @Post('admin/topups/:id/reject')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject topup (owner)' })
  @ApiResponse({ status: 200, description: 'Topup rejected' })
  async rejectTopup(
    @Param('id') topupId: string,
    @CurrentUserId() adminId: string,
    @Body() body: { reason?: string },
  ) {
    return this.walletService.rejectTopup(topupId, adminId, body.reason);
  }
}
