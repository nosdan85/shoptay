import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  email?: string;
  avatar?: string;
  verified?: boolean;
}

export interface UserProfile {
  id: string;
  discordId: string;
  username: string;
  email: string | null;
  avatar: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateFromDiscord(discordUser: DiscordUser) {
    const existingUser = await this.prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });

    if (existingUser) {
      // Update user info
      const updated = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: discordUser.username,
          email: discordUser.email || existingUser.email,
          avatar: discordUser.avatar || existingUser.avatar,
          lastLoginAt: new Date(),
        },
      });

      this.logger.debug(`User ${updated.username} logged in`);
      return updated;
    }

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        discordId: discordUser.id,
        username: discordUser.username,
        email: discordUser.email,
        avatar: discordUser.avatar,
        role: 'USER',
      },
    });

    // Create wallet for new user
    await this.prisma.wallet.create({
      data: {
        userId: newUser.id,
        balance: 0,
      },
    });

    this.logger.log(`New user ${newUser.username} created`);
    return newUser;
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        discordId: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async findByDiscordId(discordId: string) {
    return this.prisma.user.findUnique({
      where: { discordId },
    });
  }

  async getProfile(id: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        discordId: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as UserProfile;
  }

  async updateProfile(id: string, data: { email?: string; username?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        username: data.username,
      },
    });

    return user;
  }

  async updateRole(id: string, role: 'USER' | 'MODERATOR' | 'ADMIN' | 'OWNER') {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          discordId: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
