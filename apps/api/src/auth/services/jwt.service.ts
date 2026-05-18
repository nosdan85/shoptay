import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

export interface AccessTokenPayload {
  sub: string;
  discordId: string;
  isOwner: boolean;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = this.configService.get<string>('app.jwt.secret') || 'default_jwt_secret';
    this.refreshSecret = this.configService.get<string>('app.jwt.refreshSecret') || this.accessSecret;
    this.accessExpiresIn = this.configService.get<string>('app.jwt.expiresIn') || '15m';
    this.refreshExpiresIn = this.configService.get<string>('app.jwt.refreshExpiresIn') || '7d';
  }

  /**
   * Generate an access token for a user
   */
  signAccessToken(userId: string, discordId: string, isOwner: boolean): string {
    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: userId,
      discordId,
      isOwner,
    };

    return this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });
  }

  /**
   * Generate a refresh token for a user
   */
  signRefreshToken(userId: string): string {
    const jti = randomBytes(16).toString('hex');
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: userId,
      type: 'refresh',
      jti,
    };

    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(userId: string, discordId: string, isOwner: boolean): TokenPair {
    const accessToken = this.signAccessToken(userId, discordId, isOwner);
    const refreshToken = this.signRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(this.accessExpiresIn),
    };
  }

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.jwtService.verify<AccessTokenPayload>(token, {
        secret: this.accessSecret,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token has expired');
      }
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Verify and decode a refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Decode a token without verification
   */
  decodeToken<T = any>(token: string): T | null {
    return this.jwtService.decode(token) as T | null;
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  /**
   * Parse expiration string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}
