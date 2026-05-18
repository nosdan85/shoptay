import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from '../types';

/**
 * Create an authenticated axios instance
 */
export function createAuthenticatedClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: process.env.API_BASE_URL || 'http://localhost:3001',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

/**
 * Fetch Discord user info
 */
export async function fetchDiscordUser(discordId: string, botToken: string): Promise<any> {
  const response = await axios.get(`https://discord.com/api/v10/users/${discordId}`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
    timeout: 5000,
  });
  return response.data;
}

/**
 * Fetch Discord guild member info
 */
export async function fetchGuildMember(
  guildId: string,
  discordId: string,
  botToken: string
): Promise<any> {
  const response = await axios.get(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      timeout: 5000,
    }
  );
  return response.data;
}

/**
 * Check if user is in guild
 */
export async function isUserInGuild(
  guildId: string,
  discordId: string,
  botToken: string
): Promise<boolean> {
  try {
    await fetchGuildMember(guildId, discordId, botToken);
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Add user to guild using OAuth token
 */
export async function addUserToGuild(
  guildId: string,
  discordId: string,
  accessToken: string,
  botToken: string
): Promise<boolean> {
  try {
    const response = await axios.put(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
      { access_token: accessToken },
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return response.status === 201 || response.status === 204;
  } catch (error: any) {
    // 204 means already in guild
    if (error.response?.status === 204) {
      return true;
    }
    throw error;
  }
}

/**
 * Create Discord channel
 */
export async function createChannel(
  guildId: string,
  name: string,
  options: {
    type?: number;
    category?: string;
    topic?: string;
    permissionOverwrites?: Array<{
      id: string;
      type?: number;
      allow?: bigint;
      deny?: bigint;
    }>;
  },
  botToken: string
): Promise<any> {
  const response = await axios.post(
    `https://discord.com/api/v10/guilds/${guildId}/channels`,
    {
      name,
      type: options.type || 0,
      parent_id: options.category,
      topic: options.topic,
      permission_overwrites: options.permissionOverwrites?.map((po) => ({
        id: po.id,
        type: po.type,
        allow: po.allow?.toString(),
        deny: po.deny?.toString(),
      })),
    },
    {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );
  return response.data;
}

/**
 * Delete Discord channel
 */
export async function deleteChannel(channelId: string, botToken: string): Promise<void> {
  await axios.delete(`https://discord.com/api/v10/channels/${channelId}`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
    timeout: 10000,
  });
}

/**
 * Send message to channel
 */
export async function sendChannelMessage(
  channelId: string,
  content: any,
  botToken: string
): Promise<any> {
  const response = await axios.post(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    content,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );
  return response.data;
}

/**
 * Fetch channel messages
 */
export async function fetchChannelMessages(
  channelId: string,
  options: {
    limit?: number;
    before?: string;
    after?: string;
  } = {},
  botToken: string
): Promise<any[]> {
  const response = await axios.get(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      params: {
        limit: options.limit || 50,
        before: options.before,
        after: options.after,
      },
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      timeout: 10000,
    }
  );
  return response.data;
}

/**
 * Download attachment from Discord CDN
 */
export async function downloadAttachment(
  url: string,
  options: {
    timeout?: number;
    maxSize?: number;
  } = {}
): Promise<Buffer> {
  const { timeout = 15000, maxSize = 25 * 1024 * 1024 } = options;

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout,
    maxContentLength: maxSize,
    headers: {
      'User-Agent': 'NosMarketBot/1.0',
    },
  });

  return Buffer.from(response.data);
}

/**
 * Edit message
 */
export async function editMessage(
  channelId: string,
  messageId: string,
  content: any,
  botToken: string
): Promise<any> {
  const response = await axios.patch(
    `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
    content,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );
  return response.data;
}

/**
 * Create DM with user
 */
export async function createDM(discordId: string, botToken: string): Promise<string> {
  const response = await axios.post(
    `https://discord.com/api/v10/users/@me/channels`,
    { recipient_id: discordId },
    {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );
  return response.data.id;
}

/**
 * Send DM to user
 */
export async function sendDM(
  discordId: string,
  content: any,
  botToken: string
): Promise<any> {
  const channelId = await createDM(discordId, botToken);
  return sendChannelMessage(channelId, content, botToken);
}
