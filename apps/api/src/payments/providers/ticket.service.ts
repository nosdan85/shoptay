import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { retry } from '../common/utils/helpers';
import axios from 'axios';

export interface TicketResult {
  channelId: string;
  channelName: string;
  channelUrl: string;
}

export interface OrderTicketData {
  orderId: string;
  orderNumber: string;
  discordId: string;
  discordUsername: string;
  amount: number;
  method: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  memoExpected?: string;
}

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);
  private readonly discordBotToken: string;
  private readonly discordGuildId: string;
  private readonly discordTicketCategoryId: string;
  private readonly discordBotApiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.discordBotToken = this.configService.get<string>('DISCORD_BOT_TOKEN') || '';
    this.discordGuildId = this.configService.get<string>('DISCORD_GUILD_ID') || '';
    this.discordTicketCategoryId = this.configService.get<string>('DISCORD_TICKET_CATEGORY_ID') || '';
    this.discordBotApiUrl = this.configService.get<string>('DISCORD_BOT_API_URL') || 'http://localhost:3001';
  }

  async createPaymentTicket(orderId: string, method: string, userId: string): Promise<TicketResult> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: {
          select: { discordId: true, discordUsername: true },
        },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.ticketStatus === 'CREATING' || order.ticketStatus === 'CREATED') {
      if (order.channelId) {
        return {
          channelId: order.channelId,
          channelName: `ticket-${order.orderId}`,
          channelUrl: `https://discord.com/channels/${this.discordGuildId}/${order.channelId}`,
        };
      }
      throw new ConflictException({
        message: 'TICKET_CREATION_IN_PROGRESS',
        retryAfterSeconds: 10,
      });
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { ticketStatus: 'CREATING' },
    });

    try {
      const ticketData: OrderTicketData = {
        orderId: order.id,
        orderNumber: order.orderId,
        discordId: order.user.discordId,
        discordUsername: order.user.discordUsername,
        amount: parseFloat(order.total.toString()),
        method,
        items: order.items.map((item) => ({
          name: item.product?.name || item.name,
          quantity: item.quantity,
          price: parseFloat(item.price.toString()),
        })),
        memoExpected: order.memoExpected,
      };

      const result = await this.createDiscordTicketChannel(ticketData);

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          ticketStatus: 'CREATED',
          channelId: result.channelId,
        },
      });

      this.logger.log(`Payment ticket created: ${result.channelId} for order ${order.orderId}`);

      return result;
    } catch (error) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          ticketStatus: 'FAILED',
          ticketError: String(error),
        },
      });

      this.logger.error(`Failed to create ticket for order ${order.orderId}: ${error}`);
      throw error;
    }
  }

  async createLtcTicket(orderId: string, userId: string): Promise<TicketResult> {
    return this.createPaymentTicket(orderId, 'ltc', userId);
  }

  async createPayPalTicket(orderId: string, userId: string): Promise<TicketResult> {
    return this.createPaymentTicket(orderId, 'paypal_ff', userId);
  }

  async createCashAppTicket(orderId: string, userId: string): Promise<TicketResult> {
    return this.createPaymentTicket(orderId, 'cashapp', userId);
  }

  private async createDiscordTicketChannel(data: OrderTicketData): Promise<TicketResult> {
    if (!this.discordBotToken || !this.discordGuildId) {
      this.logger.warn('Discord bot not configured, returning mock ticket');
      const mockChannelId = `temp_${Date.now()}`;
      return {
        channelId: mockChannelId,
        channelName: `ticket-${data.orderNumber}`,
        channelUrl: '#',
      };
    }

    try {
      const channelName = this.sanitizeChannelName(`${data.method}-${data.orderNumber}`);

      const channelResponse = await retry(
        () =>
          axios.post(
            `https://discord.com/api/v10/guilds/${this.discordGuildId}/channels`,
            {
              name: channelName,
              type: 0,
              parent_id: this.discordTicketCategoryId || undefined,
            },
            {
              headers: {
                Authorization: `Bot ${this.discordBotToken}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        { maxAttempts: 3, delay: 1000 },
      );

      const channelId = channelResponse.data.id;

      const methodColors: Record<string, number> = {
        paypal_ff: 0x8ED3FF,
        cashapp: 0x00D632,
        ltc: 0xF5F7FA,
        wallet: 0xF7C948,
      };

      const color = methodColors[data.method] || 0x5865F2;

      const itemsText = data.items
        .map((item) => `${item.quantity}x ${item.name} @ $${(item.price / 100).toFixed(2)}`)
        .join('\n');

      const methodLabels: Record<string, string> = {
        paypal_ff: 'PayPal Friends & Family',
        cashapp: 'Cash App',
        ltc: 'Litecoin',
        wallet: 'Wallet Balance',
      };

      const embed = {
        color,
        title: `${methodLabels[data.method] || data.method} Payment`,
        description: `Hello <@${data.discordId}>, please complete your payment.`,
        fields: [
          { name: 'Order', value: data.orderNumber, inline: true },
          { name: 'Amount', value: `$${data.amount.toFixed(2)}`, inline: true },
          { name: 'Items', value: itemsText || 'N/A', inline: false },
        ],
        footer: { text: 'Nos Market' },
        timestamp: new Date().toISOString(),
      };

      if (data.method === 'paypal_ff' && data.memoExpected) {
        embed.fields.push({
          name: 'PayPal Note',
          value: `**IMPORTANT:** Include this exact note: \`${data.memoExpected}\``,
          inline: false,
        });
      }

      await retry(
        () =>
          axios.post(
            `https://discord.com/api/v10/channels/${channelId}/messages`,
            {
              content: `## Payment Ticket\n<@${data.discordId}>`,
              embeds: [embed],
            },
            {
              headers: {
                Authorization: `Bot ${this.discordBotToken}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        { maxAttempts: 3, delay: 1000 },
      );

      await retry(
        () =>
          axios.put(
            `https://discord.com/api/v10/channels/${channelId}/permissions/${data.discordId}`,
            {
              allow: 1024,
              type: 1,
            },
            {
              headers: {
                Authorization: `Bot ${this.discordBotToken}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        { maxAttempts: 3, delay: 1000 },
      );

      this.logger.log(`Discord ticket created: ${channelId} for order ${data.orderNumber}`);

      return {
        channelId,
        channelName,
        channelUrl: `https://discord.com/channels/${this.discordGuildId}/${channelId}`,
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'] || 10;
        throw new ConflictException({
          message: 'DISCORD_RATE_LIMITED',
          retryAfterSeconds: parseInt(retryAfter, 10),
        });
      }

      this.logger.error(`Discord ticket creation failed: ${error.response?.data || error.message}`);
      throw new BadRequestException('Failed to create Discord ticket');
    }
  }

  async checkGuildMembership(discordId: string): Promise<boolean> {
    if (!this.discordBotToken || !this.discordGuildId) {
      return true;
    }

    try {
      const response = await axios.get(
        `https://discord.com/api/v10/guilds/${this.discordGuildId}/members/${discordId}`,
        {
          headers: {
            Authorization: `Bot ${this.discordBotToken}`,
          },
          timeout: 5000,
        },
      );

      return !!response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return false;
      }
      this.logger.warn(`Guild membership check failed: ${error}`);
      return true;
    }
  }

  async closeTicket(channelId: string): Promise<void> {
    if (!this.discordBotToken) {
      this.logger.warn('Discord bot not configured, skipping ticket close');
      return;
    }

    try {
      await axios.delete(
        `https://discord.com/api/v10/channels/${channelId}`,
        {
          headers: {
            Authorization: `Bot ${this.discordBotToken}`,
          },
        },
      );

      this.logger.log(`Ticket closed: ${channelId}`);
    } catch (error) {
      this.logger.error(`Failed to close ticket: ${error}`);
      throw new BadRequestException('Failed to close ticket');
    }
  }

  private sanitizeChannelName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 90) || `ticket-${Date.now()}`;
  }
}
