import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_OWNER_KEY } from '../decorators/is-owner.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  private readonly logger = new Logger(OwnerGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOwnerOnly = this.reflector.getAllAndOverride<boolean>(IS_OWNER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isOwnerOnly) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const ownerDiscordIds = this.configService.get<string[]>('app.ownerDiscordIds', []);
    const discordGuildId = this.configService.get<string>('app.discord.guildId');
    const ownerRoleId = this.configService.get<string>('app.discord.ownerRoleId');

    // Check if user is in the owner list
    if (ownerDiscordIds.includes(user.discordId)) {
      return true;
    }

    // Check user role (database-level ownership)
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      return true;
    }

    // Check Discord guild membership with owner role (if bot token available)
    const botToken = this.configService.get<string>('app.discord.botToken');
    
    if (botToken && discordGuildId && ownerRoleId && user.discordId) {
      try {
        const isGuildMember = await this.checkDiscordMembership(
          user.discordId,
          discordGuildId,
          ownerRoleId,
          botToken,
        );
        
        if (isGuildMember) {
          return true;
        }
      } catch (error) {
        this.logger.warn(`Failed to check Discord membership: ${error}`);
      }
    }

    throw new ForbiddenException('Owner access required');
  }

  private async checkDiscordMembership(
    discordId: string,
    guildId: string,
    roleId: string,
    botToken: string,
  ): Promise<boolean> {
    const axios = (await import('axios')).default;
    
    try {
      // Get guild member
      const memberResponse = await axios.get(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
          timeout: 5000,
        },
      );

      const member = memberResponse.data;
      
      // Check if member has the owner role
      return member.roles?.includes(roleId) || false;
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
