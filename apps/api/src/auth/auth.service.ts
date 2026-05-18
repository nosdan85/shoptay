import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService as AuthJwtService, TokenPair } from './services/jwt.service';
import { SessionService } from './services/session.service';

export interface DiscordUserInfo {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
  verified?: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    discordId: string;
    discordUsername: string;
    avatar?: string | null;
  };
  isOwner: boolean;
}

export interface OwnerCheckResult {
  isOwner: boolean;
  guildMember: boolean;
  guildMemberInfo?: {
    nickname?: string;
    roles: string[];
  };
}

export interface GuildMemberInfo {
  userId: string;
  guildId: string;
  nickname?: string;
  roles: string[];
  joinedAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly discordTokenUrl = 'https://discord.com/api/oauth2/token';
  private readonly discordApiUrl = 'https://discord.com/api/v10';

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authJwtService: AuthJwtService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Exchange Discord OAuth code for JWT tokens
   */
  async exchangeDiscordCode(code: string, redirectUri?: string): Promise<AuthResult> {
    const clientId = this.configService.get<string>('app.discord.clientId');
    const clientSecret = this.configService.get<string>('app.discord.clientSecret');
    const encryptionKey = this.configService.get<string>('app.encryptionKey');
    const guildId = this.configService.get<string>('app.discord.guildId');

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException('Discord OAuth is not configured');
    }

    try {
      // Step 1: Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code, redirectUri || this.getDefaultRedirectUri());

      // Step 2: Get user info from Discord
      const discordUser = await this.getDiscordUserInfo(tokenResponse.access_token);

      // Step 3: Check if user is in the guild (if configured)
      let isOwner = false;
      if (guildId) {
        const guildMember = await this.getGuildMember(tokenResponse.access_token, guildId, discordUser.id);
        isOwner = guildMember !== null;
      }

      // Step 4: Create or update user in database
      const user = await this.usersService.findOrCreateFromDiscord(discordUser);

      // Step 5: Check if user is in the owner list
      const ownerCheck = await this.checkOwner(user.discordId);
      isOwner = isOwner || ownerCheck.isOwner;

      // Step 6: Create session
      await this.sessionService.createSession({
        userId: user.id,
      });

      // Step 7: Generate JWT tokens
      const tokenPair = this.authJwtService.generateTokenPair(
        user.id,
        user.discordId,
        isOwner,
      );

      this.logger.log(`User ${user.username} authenticated successfully`);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        user: {
          id: user.id,
          discordId: user.discordId,
          discordUsername: user.username,
          avatar: user.avatar,
        },
        isOwner,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error as { response?: { status?: number; data?: any }; code?: string; message?: string };

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        this.logger.error('Discord API request timeout');
        throw new HttpException(
          'Authentication service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (err.response?.status === 400 || err.message?.includes('invalid_grant')) {
        this.logger.warn(`Invalid Discord OAuth code: ${code.substring(0, 10)}...`);
        throw new BadRequestException('Invalid or expired authorization code');
      }

      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retry_after || 60;
        throw new HttpException(
          {
            statusCode: 429,
            message: 'Too many requests',
            error: 'DISCORD_RATE_LIMIT',
            retryAfterSeconds: retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.error(`Discord auth error: ${error}`);
      throw new InternalServerErrorException('Authentication failed');
    }
  }

  /**
   * Exchange OAuth code for access and refresh tokens
   */
  private async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  }> {
    const clientId = this.configService.get<string>('app.discord.clientId');
    const clientSecret = this.configService.get<string>('app.discord.clientSecret');

    const params = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(this.discordTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          data: errorData,
        },
      };
    }

    return response.json();
  }

  /**
   * Get user info from Discord API
   */
  private async getDiscordUserInfo(accessToken: string): Promise<DiscordUserInfo> {
    const response = await fetch(`${this.discordApiUrl}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          data: await response.json().catch(() => ({})),
        },
      };
    }

    const data = await response.json();

    return {
      id: data.id,
      username: data.global_name || data.username,
      discriminator: data.discriminator || '0',
      avatar: data.avatar,
      email: data.email,
      verified: data.verified,
    };
  }

  /**
   * Get guild member info from Discord
   */
  async getGuildMember(accessToken: string, guildId: string, userId: string): Promise<GuildMemberInfo | null> {
    const botToken = this.configService.get<string>('app.discord.botToken');

    if (!botToken) {
      return null;
    }

    try {
      // First, try to add user to guild (if using guilds.join scope)
      try {
        await fetch(`${this.discordApiUrl}/guilds/${guildId}/members/${userId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        });
      } catch {
        // User might already be in guild, continue
      }

      // Get member info
      const response = await fetch(`${this.discordApiUrl}/guilds/${guildId}/members/${userId}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw { response: { status: response.status } };
      }

      const data = await response.json();

      return {
        userId: data.user?.id || userId,
        guildId,
        nickname: data.nick || undefined,
        roles: data.roles || [],
        joinedAt: new Date(data.joined_at),
      };
    } catch (error) {
      this.logger.warn(`Failed to get guild member info: ${error}`);
      return null;
    }
  }

  /**
   * Check if user is an owner
   */
  async checkOwner(discordId: string): Promise<OwnerCheckResult> {
    const ownerDiscordIds = this.configService.get<string[]>('app.ownerDiscordIds', []);
    const botToken = this.configService.get<string>('app.discord.botToken');
    const guildId = this.configService.get<string>('app.discord.guildId');
    const ownerRoleId = this.configService.get<string>('app.discord.ownerRoleId');

    // Check if user is in the configured owner list
    if (ownerDiscordIds.includes(discordId)) {
      return { isOwner: true, guildMember: true };
    }

    // Check database role
    const user = await this.prisma.user.findUnique({
      where: { discordId },
    });

    if (user && (user.role === 'OWNER' || user.role === 'ADMIN')) {
      return { isOwner: true, guildMember: false };
    }

    // Check Discord guild membership with owner role
    let guildMember = false;
    let guildMemberInfo: OwnerCheckResult['guildMemberInfo'];

    if (botToken && guildId && ownerRoleId) {
      try {
        const memberInfo = await this.checkDiscordGuildRole(discordId, guildId, ownerRoleId, botToken);
        guildMember = memberInfo.isMember;
        guildMemberInfo = memberInfo.info;
      } catch (error) {
        this.logger.warn(`Failed to check Discord guild membership: ${error}`);
      }
    }

    return {
      isOwner: guildMember,
      guildMember,
      guildMemberInfo,
    };
  }

  /**
   * Check if user has the owner role in the Discord guild
   */
  private async checkDiscordGuildRole(
    discordId: string,
    guildId: string,
    roleId: string,
    botToken: string,
  ): Promise<{ isMember: boolean; info?: { nickname?: string; roles: string[] } }> {
    try {
      const response = await fetch(`${this.discordApiUrl}/guilds/${guildId}/members/${discordId}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { isMember: false };
        }
        throw { response: { status: response.status } };
      }

      const data = await response.json();
      const hasRole = data.roles?.includes(roleId) || false;

      return {
        isMember: hasRole,
        info: {
          nickname: data.nick || undefined,
          roles: data.roles || [],
        },
      };
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        return { isMember: false };
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair & { isOwner: boolean }> {
    try {
      // Verify the refresh token
      const payload = this.authJwtService.verifyRefreshToken(refreshToken);

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user has valid session
      const hasValidSession = await this.sessionService.hasValidSession(user.id);
      if (!hasValidSession) {
        throw new UnauthorizedException('Session expired');
      }

      // Check ownership
      const ownerCheck = await this.checkOwner(user.discordId);

      // Generate new tokens
      const tokenPair = this.authJwtService.generateTokenPair(
        user.id,
        user.discordId,
        ownerCheck.isOwner,
      );

      return {
        ...tokenPair,
        isOwner: ownerCheck.isOwner,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Revoke a user's session
   */
  async revokeSession(userId: string): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId);
    this.logger.log(`Sessions revoked for user ${userId}`);
  }

  /**
   * Get current user info from JWT payload
   */
  async getUserFromJwtPayload(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        discordId: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    const ownerCheck = await this.checkOwner(user.discordId);

    return {
      ...user,
      isOwner: ownerCheck.isOwner,
    };
  }

  /**
   * Get default redirect URI
   */
  private getDefaultRedirectUri(): string {
    const frontendUrl = this.configService.get<string>('app.frontendUrl', 'http://localhost:3000');
    return `${frontendUrl}/auth/discord/callback`;
  }
}
