import axios from 'axios';
import { Logger } from 'pino';
import { config } from '../config';
import { DiscordBotError } from '../types';

export class GuildSyncService {
  constructor(private readonly log: Logger) {}

  async isUserInGuild(discordId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://discord.com/api/v10/guilds/${config.discordGuildId}/members/${discordId}`,
        {
          headers: {
            Authorization: `Bot ${config.discordToken}`,
          },
          timeout: 5000,
        }
      );
      return response.status === 200;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      this.log.error({ error, discordId }, '[GuildSync] Error checking user in guild');
      throw error;
    }
  }

  async addUserToGuild(discordId: string, accessToken: string): Promise<boolean> {
    try {
      const response = await axios.put(
        `https://discord.com/api/v10/guilds/${config.discordGuildId}/members/${discordId}`,
        {
          access_token: accessToken,
        },
        {
          headers: {
            Authorization: `Bot ${config.discordToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      return response.status === 201 || response.status === 204;
    } catch (error: any) {
      if (error.response?.status === 204) {
        return true; // Already in guild
      }
      this.log.error({ error, discordId }, '[GuildSync] Error adding user to guild');
      throw this.mapError(error);
    }
  }

  async refreshUserToken(userId: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      // Call the API to refresh the token
      const response = await axios.post(
        `${config.apiBaseUrl}/auth/refresh`,
        { userId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error: any) {
      this.log.warn({ error, userId }, '[GuildSync] Token refresh failed - user will be skipped');
      return null;
    }
  }

  async addAllLinkedUsers(
    guild: any,
    options: {
      concurrency?: number;
      maxRetries?: number;
      onProgress?: (current: number, total: number, status: string) => void;
    } = {}
  ): Promise<{ added: number; alreadyIn: number; skipped: number; failed: number; errors: string[] }> {
    const { concurrency = 4, maxRetries = 3, onProgress } = options;

    // Fetch all linked users from the API
    const response = await axios.get(`${config.apiBaseUrl}/users/linked`, {
      timeout: 30000,
    });

    const users = response.data.users || [];
    const results = {
      added: 0,
      alreadyIn: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Generate linked-users file content
    const linkedUsersList = users
      .sort((a: any, b: any) => a.discordUsername.localeCompare(b.discordUsername))
      .map((u: any) => `${u.discordId} - ${u.discordUsername}`)
      .join('\n');

    // Store for later use
    const linkedUsersContent = `Linked Users Report\nGenerated: ${new Date().toISOString()}\nTotal: ${users.length}\n\n${linkedUsersList}`;

    // Process users in batches
    let processed = 0;
    const batchedUsers = [];

    for (let i = 0; i < users.length; i += concurrency) {
      batchedUsers.push(users.slice(i, i + concurrency));
    }

    for (const batch of batchedUsers) {
      const promises = batch.map(async (user: any) => {
        const { discordId, discordUsername } = user;

        // Check if already in guild
        const inGuild = await this.isUserInGuild(discordId);
        if (inGuild) {
          results.alreadyIn++;
          processed++;
          onProgress?.(processed, users.length, `Already in server: ${discordUsername}`);
          return;
        }

        // Try to get fresh token
        const tokens = await this.refreshUserToken(user.id || discordId);
        if (!tokens) {
          results.skipped++;
          processed++;
          onProgress?.(processed, users.length, `Skipped (no valid token): ${discordUsername}`);
          return;
        }

        // Try to add with retries
        let success = false;
        for (let retry = 0; retry < maxRetries; retry++) {
          try {
            await this.sleep(500 * (retry + 1)); // Backoff
            const added = await this.addUserToGuild(discordId, tokens.accessToken);
            if (added) {
              success = true;
              results.added++;
              break;
            }
          } catch (error: any) {
            if (retry === maxRetries - 1) {
              results.errors.push(`Failed to add ${discordUsername}: ${error.message}`);
            }
          }
        }

        if (!success) {
          results.failed++;
        }

        processed++;
        onProgress?.(processed, users.length, success ? `Added: ${discordUsername}` : `Failed: ${discordUsername}`);
      });

      await Promise.all(promises);
    }

    return results;
  }

  private mapError(error: any): DiscordBotError {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const retryAfter = error.response?.headers?.['retry-after'];

    return new DiscordBotError(
      error.message || 'Guild sync error',
      status,
      code,
      error.response?.data,
      retryAfter ? parseInt(retryAfter) : undefined
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
