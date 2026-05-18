import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

export interface AuditLogEntry {
  adminId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  changes?: any;
  ip?: string;
  userAgent?: string;
  metadata?: any;
}

export interface AuditLogWithAdmin extends AuditLogEntry {
  id: string;
  admin?: {
    id: string;
    username: string;
    discordId: string;
  } | null;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly configService: ConfigService,
  ) {}

  async log(entry: AuditLogEntry): Promise<any> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        changes: entry.changes || null,
        ip: entry.ip || null,
        userAgent: entry.userAgent || null,
        metadata: entry.metadata || null,
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            discordId: true,
          },
        },
      },
    });

    this.logger.log(
      `Audit: ${entry.action} on ${entry.targetType}:${entry.targetId} by ${entry.adminId || 'system'}`,
    );

    // Emit to admin dashboard for real-time updates
    try {
      await this.realtimeService.emitToAdmins({
        type: 'AUDIT_LOG',
        entry: auditLog,
      });
    } catch (error) {
      this.logger.warn(`Failed to emit audit event: ${error.message}`);
    }

    return auditLog;
  }

  async logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    beforeState?: any,
    afterState?: any,
    req?: any,
  ): Promise<any> {
    const changes = this.computeChanges(beforeState, afterState);

    return this.log({
      adminId,
      action,
      targetType,
      targetId,
      changes,
      ip: req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
    });
  }

  async getAuditLogs(options: {
    adminId?: string;
    targetType?: string;
    targetId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    data: AuditLogWithAdmin[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      adminId,
      targetType,
      targetId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options;

    const where: any = {};

    if (adminId) where.adminId = adminId;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              discordId: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTargetHistory(
    targetType: string,
    targetId: string,
  ): Promise<AuditLogWithAdmin[]> {
    return this.prisma.auditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            discordId: true,
          },
        },
      },
    });
  }

  async getAdminActivity(adminId: string, limit = 50): Promise<AuditLogWithAdmin[]> {
    return this.prisma.auditLog.findMany({
      where: { adminId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            discordId: true,
          },
        },
      },
    });
  }

  private computeChanges(before: any, after: any): any {
    if (!before || !after) {
      return { before, after };
    }

    const changes: any = { before: {}, after: {} };
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const beforeVal = JSON.stringify(before[key]);
      const afterVal = JSON.stringify(after[key]);

      if (beforeVal !== afterVal) {
        // Skip internal fields
        if (!['updatedAt', 'createdAt', 'id'].includes(key)) {
          changes.before[key] = before[key];
          changes.after[key] = after[key];
        }
      }
    }

    return Object.keys(changes.before).length > 0 || Object.keys(changes.after).length > 0
      ? changes
      : null;
  }
}

// Predefined audit actions
export const AuditActions = {
  // Order actions
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_MARKED_PAID: 'order_marked_paid',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_REFUNDED: 'order_refunded',
  ORDER_STATUS_CHANGED: 'order_status_changed',

  // Product actions
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  PRODUCT_STOCK_CHANGED: 'product_stock_changed',

  // User actions
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_BALANCE_ADJUSTED: 'user_balance_adjusted',
  USER_BANNED: 'user_banned',
  USER_UNBANNED: 'user_unbanned',

  // Config actions
  CONFIG_UPDATED: 'config_updated',
  BANNER_UPLOADED: 'banner_uploaded',
  BANNER_DELETED: 'banner_deleted',
  BEST_SELLERS_UPDATED: 'best_sellers_updated',

  // Game/Category actions
  GAME_CREATED: 'game_created',
  GAME_UPDATED: 'game_updated',
  GAME_DELETED: 'game_deleted',
  CATEGORY_CREATED: 'category_created',
  CATEGORY_UPDATED: 'category_updated',
  CATEGORY_DELETED: 'category_deleted',

  // Coupon actions
  COUPON_CREATED: 'coupon_created',
  COUPON_UPDATED: 'coupon_updated',
  COUPON_DELETED: 'coupon_deleted',

  // Delivery actions
  DELIVERY_SLOT_CREATED: 'delivery_slot_created',
  DELIVERY_SLOT_UPDATED: 'delivery_slot_updated',
  DELIVERY_SLOT_DELETED: 'delivery_slot_deleted',
  DELIVERY_CONFIRMED: 'delivery_confirmed',

  // System actions
  MAINTENANCE_ENABLED: 'maintenance_enabled',
  MAINTENANCE_DISABLED: 'maintenance_disabled',
  SETTINGS_CHANGED: 'settings_changed',
} as const;
