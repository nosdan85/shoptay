import axios from 'axios';
import { Logger } from 'pino';
import { Client, Guild, TextChannel, Role, MessageAttachment, User } from 'discord.js';
import { config } from '../config';
import { PERM_VIEW_CHANNEL_ONLY, PERM_TICKET_CHAT } from '../config/constants';
import { QueueService } from './QueueService';
import { GuildSyncService } from './GuildSyncService';
import { EmbedService } from './EmbedService';
import { VouchService } from './VouchService';
import { DiscordBotError, PaymentMethod, OrderItem, Logger as LoggerType } from '../types';
import { sanitizeChannelName } from '../utils/channelSanitizer';
import {
  RETRY_MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_DELAY_MS,
  TICKET_QUEUE_MIN_GAP_MS,
} from '../config/constants';

export class TicketService {
  private queue: QueueService;
  private guildSync: GuildSyncService;
  private embed: EmbedService;
  private vouch: VouchService;

  constructor(
    private readonly client: Client,
    private readonly log: Logger,
    private readonly prisma: any = null
  ) {
    this.queue = new QueueService(TICKET_QUEUE_MIN_GAP_MS);
    this.guildSync = new GuildSyncService(log);
    this.embed = new EmbedService(log);
    this.vouch = new VouchService(log);
  }

  async createTicket(params: {
    orderId: string;
    method: PaymentMethod;
    customerDiscordId: string;
    customerUsername: string;
    total: number;
    items: OrderItem[];
    email?: string;
    memoExpected?: string;
    cashAppTag?: string;
    ltcAddress?: string;
    ltcAmount?: number;
  }): Promise<{ channelId: string }> {
    return this.queue.enqueue(async () => {
      const { orderId, method, customerDiscordId, customerUsername, total, items, email, memoExpected, cashAppTag, ltcAddress, ltcAmount } = params;

      // Verify user is in guild
      const isInGuild = await this.guildSync.isUserInGuild(customerDiscordId);
      if (!isInGuild) {
        throw new DiscordBotError(
          `User ${customerUsername} is not in the Discord server. They must join first.`,
          400,
          'USER_NOT_IN_GUILD'
        );
      }

      // Get guild and category
      const guild = await this.client.guilds.fetch(config.discordGuildId);
      const category = await this.fetchCategory(config.ticketCategoryId);

      // Create channel name
      const channelName = await this.sanitizeChannelName(`${customerUsername}-${orderId.slice(-6)}`);

      // Create channel with category
      let channel: TextChannel;
      try {
        channel = await this.createTicketChannel(guild, channelName, customerDiscordId, category?.id);
      } catch (error: any) {
        // Fallback: create without category
        this.log.warn({ error }, '[Ticket] Creating channel without category');
        channel = await this.createTicketChannel(guild, channelName, customerDiscordId);
      }

      // Build and send embed
      const ownerRole = config.ownerRoleId ? `<@&${config.ownerRoleId}>` : undefined;
      const paymentEmbed = this.embed.paymentTicket({
        orderId,
        method,
        buyer: `<@${customerDiscordId}>`,
        ownerRole,
        total,
        email,
        items,
        memoExpected,
        cashAppTag,
        ltcAddress,
        ltcAmount,
      });

      // Build action buttons
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_confirm_${orderId}`)
          .setLabel('Confirm Payment')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`ticket_done_${orderId}`)
          .setLabel('Mark Done')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`ticket_close_${orderId}`)
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: config.ownerIds.map(id => `<@${id}>`).join(' '),
        embeds: [paymentEmbed],
        components: [row],
      });

      // Update order with channel ID
      await this.updateOrderChannel(orderId, channel.id);

      this.log.info({ orderId, channelId: channel.id }, '[Ticket] Ticket created successfully');
      return { channelId: channel.id };
    });
  }

  async createDeliveryTicket(params: {
    orderId: string;
    customerDiscordId: string;
    customerUsername: string;
    robloxUsername: string;
    robloxUserId?: string;
    total: number;
    items: OrderItem[];
    ownerTime: string;
    customerTime: string;
  }): Promise<{ channelId: string }> {
    return this.queue.enqueue(async () => {
      const { orderId, customerDiscordId, customerUsername, robloxUsername, robloxUserId, total, items, ownerTime, customerTime } = params;

      const isInGuild = await this.guildSync.isUserInGuild(customerDiscordId);
      if (!isInGuild) {
        throw new DiscordBotError(
          `User ${customerUsername} is not in the Discord server.`,
          400,
          'USER_NOT_IN_GUILD'
        );
      }

      const guild = await this.client.guilds.fetch(config.discordGuildId);
      const category = await this.fetchCategory(config.ticketCategoryId);
      const channelName = await this.sanitizeChannelName(`delivery-${orderId.slice(-6)}`);

      let channel: TextChannel;
      try {
        channel = await this.createTicketChannel(guild, channelName, customerDiscordId, category?.id);
      } catch {
        channel = await this.createTicketChannel(guild, channelName, customerDiscordId);
      }

      const deliveryEmbed = this.embed.deliveryTicket({
        orderId,
        robloxAccount: robloxUsername,
        robloxUserId,
        discordAccount: `<@${customerDiscordId}>`,
        discordUserId: customerDiscordId,
        total,
        items,
        ownerTime,
        customerTime,
        ownerTimezone: config.ownerTimezone,
      });

      await channel.send({
        content: config.ownerIds.map(id => `<@${id}>`).join(' '),
        embeds: [deliveryEmbed],
      });

      await this.updateOrderChannel(orderId, channel.id);

      return { channelId: channel.id };
    });
  }

  async closeTicket(channelId: string, reason?: string): Promise<void> {
    const guild = await this.client.guilds.fetch(config.discordGuildId);
    const channel = guild.channels.cache.get(channelId) as TextChannel;

    if (!channel) {
      throw new DiscordBotError(`Ticket channel ${channelId} not found`, 404, 'CHANNEL_NOT_FOUND');
    }

    // Send closing message
    await channel.send({
      embeds: [
        this.embed.info(`Ticket is being closed${reason ? `: ${reason}` : '...'}`),
      ],
    });

    // Delete channel after delay
    setTimeout(async () => {
      try {
        await channel.delete(`Ticket closed${reason ? `: ${reason}` : ''}`);
        this.log.info({ channelId }, '[Ticket] Ticket closed');
      } catch (error) {
        this.log.error({ error, channelId }, '[Ticket] Failed to delete channel');
      }
    }, 3000);
  }

  async markCompleted(channelId: string, orderId: string): Promise<void> {
    const guild = await this.client.guilds.fetch(config.discordGuildId);
    const channel = guild.channels.cache.get(channelId) as TextChannel;

    if (!channel) {
      throw new DiscordBotError(`Ticket channel ${channelId} not found`, 404, 'CHANNEL_NOT_FOUND');
    }

    // Send completion message
    await channel.send({
      embeds: [this.embed.success('This ticket has been marked as completed!')],
    });

    // Try to send DM to user
    try {
      // Get user from channel topic or messages
      const messages = await channel.messages.fetch({ limit: 10 });
      const firstMessage = messages.first();
      if (firstMessage?.mentions?.users?.first()) {
        const user = firstMessage.mentions.users.first();
        const thankYouContent = this.vouch.buildThankYouDM([]);
        await user.send(thankYouContent);
      }
    } catch (error) {
      this.log.warn({ error, channelId }, '[Ticket] Failed to send thank you DM');
    }

    // Close after delay
    setTimeout(async () => {
      try {
        await channel.delete('Ticket completed');
      } catch (error) {
        this.log.error({ error, channelId }, '[Ticket] Failed to delete channel');
      }
    }, 3000);
  }

  async requestConfirmation(channelId: string, orderId: string): Promise<void> {
    const guild = await this.client.guilds.fetch(config.discordGuildId);
    const channel = guild.channels.cache.get(channelId) as TextChannel;

    if (!channel) {
      throw new DiscordBotError(`Ticket channel ${channelId} not found`, 404, 'CHANNEL_NOT_FOUND');
    }

    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Confirm Delivery')
        .setStyle(ButtonStyle.Success)
        .setURL(`${config.apiBaseUrl}/orders/${orderId}/confirm-delivery`)
    );

    await channel.send({
      content: `⚠️ **Confirmation Required**\n\nPlease confirm your delivery on the website:`,
      components: [row],
    });
  }

  private async ensureUserInGuild(discordId: string): Promise<boolean> {
    return this.guildSync.isUserInGuild(discordId);
  }

  private async sanitizeChannelName(name: string): Promise<string> {
    return sanitizeChannelName(name);
  }

  private async createTicketChannel(
    guild: Guild,
    name: string,
    discordId: string,
    categoryId?: string
  ): Promise<TextChannel> {
    const payload: any = {
      name,
      type: 0, // GUILD_TEXT
      topic: `Ticket for user: ${discordId}`,
    };

    if (categoryId) {
      payload.category = categoryId;
    }

    // Set up permission overwrites
    payload.permissionOverwrites = [
      {
        id: guild.roles.everyone,
        deny: BigInt(PERM_VIEW_CHANNEL_ONLY),
      },
      {
        id: discordId,
        allow: BigInt(PERM_TICKET_CHAT),
      },
      {
        id: this.client.user!.id,
        allow: BigInt(PERM_TICKET_CHAT),
      },
    ];

    if (config.ownerRoleId) {
      payload.permissionOverwrites.push({
        id: config.ownerRoleId,
        allow: BigInt(PERM_TICKET_CHAT),
      });
    }

    const channel = await guild.channels.create(payload);
    return channel as TextChannel;
  }

  private async setupChannelPermissions(channel: TextChannel, discordId: string): Promise<void> {
    await channel.permissionOverwrites.edit(
      channel.guild.roles.everyone,
      { ViewChannel: false }
    );

    await channel.permissionOverwrites.edit(discordId, {
      ViewChannel: true,
      SendMessages: true,
      EmbedLinks: true,
      AttachFiles: true,
      ReadMessageHistory: true,
      AddReactions: true,
    });

    await channel.permissionOverwrites.edit(this.client.user!.id, {
      ViewChannel: true,
      SendMessages: true,
      EmbedLinks: true,
      AttachFiles: true,
      ReadMessageHistory: true,
      AddReactions: true,
    });

    if (config.ownerRoleId) {
      await channel.permissionOverwrites.edit(config.ownerRoleId, {
        ViewChannel: true,
        SendMessages: true,
        EmbedLinks: true,
        AttachFiles: true,
        ReadMessageHistory: true,
        AddReactions: true,
      });
    }
  }

  private async fetchCategory(categoryId: string): Promise<any> {
    try {
      return await this.client.channels.fetch(categoryId);
    } catch {
      return null;
    }
  }

  private async updateOrderChannel(orderId: string, channelId: string): Promise<void> {
    if (!this.prisma) return;

    try {
      await this.prisma.order.update({
        where: { orderId },
        data: { channelId },
      });
    } catch (error) {
      this.log.warn({ error, orderId, channelId }, '[Ticket] Failed to update order channel');
    }
  }

  async handleAutoVouch(message: any): Promise<void> {
    const attachments = message.attachments;
    if (attachments.size === 0) return;

    const guild = await this.client.guilds.fetch(config.discordGuildId);
    const vouchChannel = guild.channels.cache.get(config.vouchChannelId) as TextChannel;

    if (!vouchChannel) {
      this.log.warn('[Ticket] Vouch channel not found');
      return;
    }

    // Get order info from channel topic or messages
    const discordId = this.extractDiscordIdFromChannel(message.channel);
    const discordUsername = message.author.username;

    // Download images
    const images = await this.vouch.downloadImages([...attachments.values()]);

    if (images.length === 0) {
      this.log.warn('[Ticket] No images downloaded for auto-vouch');
      return;
    }

    // Post to vouch channel
    const uploadedUrls = await this.vouch.postVouch(vouchChannel, discordId, discordUsername, [], 0);

    await message.reply({
      embeds: [this.embed.success(`Vouch posted successfully (${images.length} image${images.length > 1 ? 's' : ''}).`)],
    });
  }

  private extractDiscordIdFromChannel(channel: any): string {
    // Try to extract from topic
    if (channel.topic) {
      const match = channel.topic.match(/(\d+)/);
      if (match) return match[1];
    }

    // Try to find first message with user mention
    return '0'; // Fallback
  }
}
