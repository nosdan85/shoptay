import axios from 'axios';
import { Logger } from 'pino';
import { Client, TextChannel, User } from 'discord.js';
import { config } from '../config';
import { EmbedService } from './EmbedService';

export class OrderNotificationService {
  private embed: EmbedService;

  constructor(
    private readonly client: Client,
    private readonly log: Logger
  ) {
    this.embed = new EmbedService(log);
  }

  async notifyWalletTopup(topupData: {
    discordId: string;
    discordUsername: string;
    amountCents: number;
    method: string;
    referenceCode: string;
    memoExpected?: string;
  }): Promise<void> {
    const ownerIds = config.ownerIds;

    for (const ownerId of ownerIds) {
      try {
        const user = await this.client.users.fetch(ownerId);
        await user.send({
          embeds: [
            this.embed.walletTopup({
              discordId: topupData.discordId,
              username: topupData.discordUsername,
              amountCents: topupData.amountCents,
              method: topupData.method as any,
              reference: topupData.referenceCode,
              memo: topupData.memoExpected,
            }),
          ],
        });
      } catch (error) {
        this.log.warn({ error, ownerId }, '[Notification] Failed to notify owner of wallet topup');
      }
    }
  }

  async notifyNewOrder(orderData: {
    orderId: string;
    discordId: string;
    discordUsername: string;
    total: number;
    paymentMethod: string;
  }): Promise<void> {
    const ownerIds = config.ownerIds;

    const content = `🛒 **New Order Received**\n` +
      `Order: \`${orderData.orderId}\`\n` +
      `Customer: <@${orderData.discordId}> (${orderData.discordUsername})\n` +
      `Total: $${orderData.total.toFixed(2)}\n` +
      `Payment: ${orderData.paymentMethod}`;

    for (const ownerId of ownerIds) {
      try {
        const user = await this.client.users.fetch(ownerId);
        await user.send(content);
      } catch (error) {
        this.log.warn({ error, ownerId }, '[Notification] Failed to notify owner of new order');
      }
    }
  }

  async notifyPaymentConfirmed(orderData: {
    orderId: string;
    discordId: string;
    discordUsername: string;
    total: number;
    paymentMethod: string;
    txnId?: string;
  }): Promise<void> {
    const ownerIds = config.ownerIds;

    const content = `✅ **Payment Confirmed**\n` +
      `Order: \`${orderData.orderId}\`\n` +
      `Customer: <@${orderData.discordId}> (${orderData.discordUsername})\n` +
      `Amount: $${orderData.total.toFixed(2)}\n` +
      `Method: ${orderData.paymentMethod}${orderData.txnId ? `\nTransaction: \`${orderData.txnId}\`` : ''}`;

    for (const ownerId of ownerIds) {
      try {
        const user = await this.client.users.fetch(ownerId);
        await user.send(content);
      } catch (error) {
        this.log.warn({ error, ownerId }, '[Notification] Failed to notify owner of payment confirmation');
      }
    }
  }

  async notifyDeliveryReady(orderData: {
    orderId: string;
    discordId: string;
    discordUsername: string;
    robloxUsername: string;
  }): Promise<void> {
    const ownerIds = config.ownerIds;

    const content = `📦 **Delivery Ready**\n` +
      `Order: \`${orderData.orderId}\`\n` +
      `Customer: <@${orderData.discordId}> (${orderData.discordUsername})\n` +
      `Roblox: ${orderData.robloxUsername}`;

    for (const ownerId of ownerIds) {
      try {
        const user = await this.client.users.fetch(ownerId);
        await user.send(content);
      } catch (error) {
        this.log.warn({ error, ownerId }, '[Notification] Failed to notify owner of delivery ready');
      }
    }
  }
}
