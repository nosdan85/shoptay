import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminStatsService } from './admin-stats.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('shop/owner')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly adminStatsService: AdminStatsService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getStats() {
    return this.adminStatsService.getDashboardStats();
  }

  @Get('stats/revenue')
  @ApiOperation({ summary: 'Get revenue statistics by period' })
  @ApiResponse({ status: 200, description: 'Revenue statistics' })
  async getRevenueStats(
    @Query('period') period?: '7d' | '30d' | '90d' | 'all',
  ) {
    return this.adminStatsService.getRevenueByPeriod(period);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'Users list' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user details' })
  @ApiResponse({ status: 200, description: 'User details' })
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; username?: string },
    @CurrentUserId() adminId: string,
  ) {
    return this.adminService.updateUser(id, body, adminId);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @CurrentUserId() adminId: string,
  ) {
    return this.adminService.updateUserRole(id, body.role, adminId);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUserId() adminId: string,
  ) {
    return this.adminService.deleteUser(id, adminId);
  }

  @Get('topups')
  @ApiOperation({ summary: 'Get all topups with filters' })
  @ApiResponse({ status: 200, description: 'Topups list' })
  async getAllTopups(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('method') method?: string,
  ) {
    return this.adminService.getAllTopups({ page, limit, status, method });
  }

  @Get('topups/pending')
  @ApiOperation({ summary: 'Get pending topups' })
  @ApiResponse({ status: 200, description: 'Pending topups' })
  async getPendingTopups(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPendingTopups(page, limit);
  }

  @Post('topups/:id/approve')
  @ApiOperation({ summary: 'Approve topup' })
  @ApiResponse({ status: 200, description: 'Topup approved' })
  async approveTopup(
    @Param('id') id: string,
    @CurrentUserId() adminId: string,
  ) {
    return this.adminService.approveTopup(id, adminId);
  }

  @Post('topups/:id/reject')
  @ApiOperation({ summary: 'Reject topup' })
  @ApiResponse({ status: 200, description: 'Topup rejected' })
  async rejectTopup(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUserId() adminId: string,
  ) {
    return this.adminService.rejectTopup(id, adminId, body.reason);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get products overview' })
  @ApiResponse({ status: 200, description: 'Products overview' })
  async getProductsOverview() {
    return this.adminService.getProductsOverview();
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Get audit log' })
  @ApiResponse({ status: 200, description: 'Audit log' })
  async getAuditLog(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLog(page, limit, action);
  }
}
