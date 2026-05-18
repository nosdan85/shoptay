import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import axios from 'axios';
import { config } from '../config';

export const orderCommand = {
  data: new SlashCommandBuilder()
    .setName('order')
    .setDescription('View order information')
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('Check order status')
        .addStringOption((opt) =>
          opt.setName('order_id').setDescription('Order ID').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('info').setDescription('Get your order information')
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'status':
        await handleStatus(interaction);
        break;
      case 'info':
        await handleInfo(interaction);
        break;
    }
  },

  async handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const orderId = interaction.options.getString('order_id', true);

    try {
      const response = await axios.get(`${config.apiBaseUrl}/shop/order-payment-info`, {
        params: { orderId },
        timeout: 10000,
      });

      const order = response.data;

      const statusEmoji = {
        pending: '⏳',
        paid: '✅',
        cancelled: '❌',
      }[order.paymentStatus] || '❓';

      const embed = {
        color: order.paymentStatus === 'paid' ? 0x57F287 : order.paymentStatus === 'cancelled' ? 0xED4245 : 0xF7C948,
        title: `Order ${order.orderId}`,
        fields: [
          {
            name: 'Status',
            value: `${statusEmoji} ${order.paymentStatus}`,
            inline: true,
          },
          {
            name: 'Total',
            value: `$${order.total?.toFixed(2) || '0.00'}`,
            inline: true,
          },
          {
            name: 'Payment Method',
            value: order.paymentMethod || 'Unknown',
            inline: true,
          },
          {
            name: 'Items',
            value: order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join('\n') || 'No items',
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      if (order.channelId) {
        embed.fields?.push({
          name: 'Ticket',
          value: `<#${order.channelId}>`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('[Order] Status error:', error);
      await interaction.editReply({
        content: error.response?.status === 404 ? 'Order not found.' : 'Failed to fetch order.',
      });
    }
  },

  async handleInfo(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    try {
      const response = await axios.get(`${config.apiBaseUrl}/orders/user/${interaction.user.id}`, {
        timeout: 10000,
      });

      const orders = response.data.orders || [];

      if (orders.length === 0) {
        await interaction.editReply({ content: 'You have no orders yet.' });
        return;
      }

      // Show last 5 orders
      const recentOrders = orders.slice(0, 5);

      const embed = {
        color: 0x5865F2,
        title: 'Your Recent Orders',
        description: recentOrders
          .map((o: any) => {
            const status = o.paymentStatus === 'paid' ? '✅' : o.paymentStatus === 'cancelled' ? '❌' : '⏳';
            return `**${o.orderId}** ${status} - $${o.total?.toFixed(2) || '0.00'}`;
          })
          .join('\n'),
        footer: { text: `${orders.length} total orders` },
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('[Order] Info error:', error);
      await interaction.editReply({
        content: 'Failed to fetch your orders.',
      });
    }
  },
};
