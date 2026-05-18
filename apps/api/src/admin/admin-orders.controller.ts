import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminOrdersService } from './admin-orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';

@ApiTags('admin-orders')
@ApiBearerAuth()
@Controller('shop/owner/orders')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class AdminOrdersController {
  private readonly logger = new Logger(AdminOrdersController.name);

  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Orders list' })
  async getAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminOrdersService.getAllOrders(page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order details' })
  async getOrderDetails(@Param('id') id: string) {
    return this.adminOrdersService.getOrderDetails(id);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark order as paid' })
  @ApiResponse({ status: 200, description: 'Order marked as paid' })
  async markOrderPaid(
    @Param('id') id: string,
    @Body() body: { txnId?: string; note?: string },
    @CurrentUserId() adminId: string,
  ) {
    return this.adminOrdersService.markOrderPaid(id, body.txnId, body.note, adminId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUserId() adminId: string,
  ) {
    return this.adminOrdersService.cancelOrder(id, body.reason, adminId);
  }

  @Post(':id/start-delivery')
  @ApiOperation({ summary: 'Start delivery' })
  @ApiResponse({ status: 200, description: 'Delivery started' })
  async startDelivery(@Param('id') id: string) {
    return this.adminOrdersService.startDelivery(id);
  }

  @Post(':id/mark-delivered')
  @ApiOperation({ summary: 'Mark as delivered' })
  @ApiResponse({ status: 200, description: 'Order marked as delivered' })
  async markDelivered(@Param('id') id: string) {
    return this.adminOrdersService.markDelivered(id);
  }

  @Put(':id/notes')
  @ApiOperation({ summary: 'Update order notes' })
  @ApiResponse({ status: 200, description: 'Notes updated' })
  async updateOrderNotes(
    @Param('id') id: string,
    @Body() body: { notes: string },
    @CurrentUserId() adminId: string,
  ) {
    return this.adminOrdersService.updateOrderNotes(id, body.notes, adminId);
  }

  @Get('stats/by-status')
  @ApiOperation({ summary: 'Get order counts by status' })
  @ApiResponse({ status: 200, description: 'Order counts' })
  async getOrderCountsByStatus() {
    return this.adminOrdersService.getOrderCountsByStatus();
  }
}
