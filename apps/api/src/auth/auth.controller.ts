import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { Public } from '../common/decorators/is-public.decorator';
import { IsOwner } from '../common/decorators/is-owner.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DiscordCallbackDto } from './dto/discord-callback.dto';
import { RefreshTokenDto, TokenResponseDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller({ path: 'shop/auth', version: '1' })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly discordRedirectUri: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const frontendUrl = this.configService.get<string>('app.frontendUrl', 'http://localhost:3000');
    this.discordRedirectUri = `${frontendUrl}/auth/discord/callback`;
  }

  @Post('discord')
  @Public()
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Discord OAuth code for JWT token' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  @ApiResponse({ status: 400, description: 'Invalid OAuth code' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async discordAuth(
    @Body() dto: DiscordCallbackDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Discord auth attempt`);

    const result = await this.authService.exchangeDiscordCode(dto.code, dto.redirectUri);

    // Set HTTP-only cookie for access token
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.expiresIn * 1000,
    });

    // Set HTTP-only cookie for refresh token
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: result.user,
      isOwner: result.isOwner,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token using refresh token' })
  @ApiResponse({ status: 200, description: 'New tokens generated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(dto.refreshToken);

    // Set HTTP-only cookie for new access token
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.expiresIn * 1000,
    });

    // Set HTTP-only cookie for new refresh token
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      isOwner: result.isOwner,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke current session' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(
    @CurrentUserId() userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeSession(userId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return {
      success: true,
      message: 'Successfully logged out',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: any) {
    return {
      id: user.id,
      discordId: user.discordId,
      username: user.discordUsername || user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isOwner: user.isOwner,
      createdAt: user.createdAt,
    };
  }

  @Get('check-owner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user is an owner' })
  @ApiResponse({ status: 200, description: 'Owner check result' })
  async checkOwner(@CurrentUser() user: any) {
    const result = await this.authService.checkOwner(user.discordId);

    return {
      isOwner: result.isOwner,
      discordId: user.discordId,
      guildMember: result.guildMember,
      guildMemberInfo: result.guildMemberInfo,
    };
  }

  @Get('guild-member')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user is a guild member' })
  @ApiQuery({ name: 'guildId', required: false, description: 'Discord guild ID' })
  @ApiResponse({ status: 200, description: 'Guild membership info' })
  async checkGuildMember(
    @CurrentUser() user: any,
    @Query('guildId') guildId?: string,
  ) {
    const targetGuildId = guildId || this.configService.get<string>('app.discord.guildId');

    if (!targetGuildId) {
      return {
        isMember: false,
        message: 'Guild not configured',
      };
    }

    try {
      const memberInfo = await this.authService.getGuildMember(
        user.accessToken || '',
        targetGuildId,
        user.discordId,
      );

      return {
        isMember: memberInfo !== null,
        guildId: targetGuildId,
        memberInfo,
      };
    } catch (error) {
      return {
        isMember: false,
        guildId: targetGuildId,
        error: 'Failed to check membership',
      };
    }
  }

  @Get('discord/authorize')
  @Public()
  @ApiOperation({ summary: 'Get Discord OAuth authorization URL' })
  @ApiQuery({ name: 'redirect_uri', required: false, description: 'OAuth redirect URI' })
  @ApiResponse({ status: 200, description: 'Discord authorization URL' })
  getDiscordAuthUrl(@Query('redirect_uri') redirectUri?: string) {
    const clientId = this.configService.get<string>('app.discord.clientId');
    const targetRedirectUri = redirectUri || this.discordRedirectUri;
    const scopes = encodeURIComponent('identify email guilds.join');

    const authUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(targetRedirectUri)}&response_type=code&scope=${scopes}&prompt=consent`;

    return {
      url: authUrl,
      redirectUri: targetRedirectUri,
    };
  }
}
