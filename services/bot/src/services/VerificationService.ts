import axios from 'axios';
import { Logger } from 'pino';
import { Client, GuildMember, Role } from 'discord.js';
import { config } from '../config';

export class VerificationService {
  constructor(
    private readonly client: Client,
    private readonly log: Logger
  ) {}

  async verifyUser(discordId: string): Promise<{ verified: boolean; userId?: string; error?: string }> {
    try {
      // Call API to verify the user
      const response = await axios.post(
        `${config.apiBaseUrl}/auth/verify`,
        { discordId },
        { timeout: 10000 }
      );

      return {
        verified: true,
        userId: response.data.userId,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          verified: false,
          error: 'User not found in our system. Please link your Discord account first.',
        };
      }

      this.log.error({ error, discordId }, '[Verification] Error verifying user');
      return {
        verified: false,
        error: 'Verification service unavailable. Please try again later.',
      };
    }
  }

  async linkDiscordAccount(userId: string, discordId: string, discordUsername: string): Promise<boolean> {
    try {
      await axios.post(
        `${config.apiBaseUrl}/users/link`,
        { userId, discordId, discordUsername },
        { timeout: 10000 }
      );
      return true;
    } catch (error) {
      this.log.error({ error, userId, discordId }, '[Verification] Error linking Discord account');
      return false;
    }
  }

  async isStaff(discordId: string): Promise<boolean> {
    // Check if user is in owner list
    if (config.ownerIds.includes(discordId)) {
      return true;
    }

    // Check if user has owner role
    if (config.ownerRoleId) {
      const guild = await this.client.guilds.fetch(config.discordGuildId);
      const member = await guild.members.fetch(discordId);
      const ownerRole = guild.roles.cache.get(config.ownerRoleId);

      if (ownerRole && member.roles.cache.has(ownerRole.id)) {
        return true;
      }
    }

    return false;
  }

  async refreshUserTokens(discordId: string): Promise<{ accessToken?: string; refreshToken?: string } | null> {
    try {
      const response = await axios.post(
        `${config.apiBaseUrl}/auth/refresh-token`,
        { discordId },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      this.log.warn({ error, discordId }, '[Verification] Failed to refresh user tokens');
      return null;
    }
  }
}
