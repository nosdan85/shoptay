import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { IsPublic } from '../common/decorators/is-public.decorator';

@ApiTags('audit')
@Controller({ path: 'admin/audit', version: '1' })
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('adminId') adminId?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getAuditLogs({
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 50,
      adminId,
      targetType,
      targetId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('admin/:adminId')
  @ApiOperation({ summary: 'Get admin activity' })
  @ApiParam({ name: 'adminId', description: 'Admin user ID' })
  @ApiResponse({ status: 200, description: 'Admin activity retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAdminActivity(
    @Param('adminId') adminId: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getAdminActivity(adminId, limit ? parseInt(limit) : 50);
  }

  @Get('target/:targetType/:targetId')
  @ApiOperation({ summary: 'Get target history' })
  @ApiParam({ name: 'targetType', description: 'Target type (Order, User, Product, etc.)' })
  @ApiParam({ name: 'targetId', description: 'Target ID' })
  @ApiResponse({ status: 200, description: 'Target history retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTargetHistory(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.auditService.getTargetHistory(targetType, targetId);
  }
}
