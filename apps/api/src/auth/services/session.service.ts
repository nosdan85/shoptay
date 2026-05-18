import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface CreateSessionParams {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  discordSessionId?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessionExpiryDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.sessionExpiryDays = parseInt(
      this.configService.get<string>('app.jwt.sessionExpiryDays') || '30',
      10,
    );
  }

  /**
   * Create a new session for a user
   */
  async createSession(params: CreateSessionParams): Promise<SessionData> {
    const { userId, userAgent, ipAddress, discordSessionId } = params;

    // Generate a unique session token
    const token = randomBytes(32).toString('hex');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.sessionExpiryDays);

    const session = await this.prisma.session.create({
      data: {
        userId,
        discordSessionId,
        token,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    this.logger.debug(`Session created for user ${userId}`);

    return this.mapToSessionData(session);
  }

  /**
   * Find a session by token
   */
  async findByToken(token: string): Promise<SessionData | null> {
    const session = await this.prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date() || session.isRevoked) {
      return null;
    }

    return this.mapToSessionData(session);
  }

  /**
   * Find all active sessions for a user
   */
  async findByUserId(userId: string): Promise<SessionData[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(this.mapToSessionData);
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    this.logger.debug(`Session ${sessionId} revoked`);
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    this.logger.log(`Revoked ${result.count} sessions for user ${userId}`);
    return result.count;
  }

  /**
   * Revoke session by token
   */
  async revokeByToken(token: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      return false;
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    return true;
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string): Promise<SessionData | null> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.sessionExpiryDays);

    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt },
    });

    return this.mapToSessionData(session);
  }

  /**
   * Cleanup expired sessions (can be run as a cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired/revoked sessions`);
    return result.count;
  }

  /**
   * Get session count for a user
   */
  async getUserSessionCount(userId: string): Promise<number> {
    return this.prisma.session.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gte: new Date() },
      },
    });
  }

  /**
   * Check if user has valid sessions
   */
  async hasValidSession(userId: string): Promise<boolean> {
    const count = await this.prisma.session.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gte: new Date() },
      },
    });

    return count > 0;
  }

  /**
   * Map Prisma session to SessionData
   */
  private mapToSessionData(session: any): SessionData {
    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt: session.expiresAt,
      isRevoked: session.isRevoked,
      createdAt: session.createdAt,
    };
  }
}
