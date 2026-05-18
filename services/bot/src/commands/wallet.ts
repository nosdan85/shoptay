import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { config } from '../config';

export const walletCommand = {
  data: new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('View your Nos Market wallet')
    .addSubcommand((sub) =>
      sub.setName('balance').setDescription('Check your wallet balance')
    )
    .addSubcommand((sub) =>
      sub
        .setName('history')
        .setDescription('View your transaction history')
        .addIntegerOption((opt) =>
          opt.setName('limit').setDescription('Number of transactions to show').setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'balance':
        await handleBalance(interaction);
        break;
      case 'history':
        await handleHistory(interaction);
        break;
    }
  },

  async handleBalance(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/shop/wallet`, {
        headers: {
          Authorization: `Bearer ${interaction.user.id}`,
        },
        timeout: 10000,
      });

      const wallet = response.data;
      const balance = (wallet.balanceCents || 0) / 100;

      const embed = {
        color: 0xF7C948,
        title: '💰 Wallet Balance',
        description: `**$${balance.toFixed(2)}**`,
        fields: [
          {
            name: 'Account',
            value: interaction.user.username,
            inline: true,
          },
          {
            name: 'Status',
            value: 'Active',
            inline: true,
          },
        ],
        footer: { text: 'Nos Market Wallet' },
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      if (error.response?.status === 401) {
        await interaction.editReply({
          content: 'Please link your Discord account first. Use `/verify` to link.',
        });
      } else {
        console.error('[Wallet] Balance error:', error);
        await interaction.editReply({
          content: 'Failed to fetch wallet balance.',
        });
      }
    }
  },

  async handleHistory(interaction: ChatInputCommandInteraction): Promise<void> {
    const limit = interaction.options.getInteger('limit') || 10;

    try {
      const response = await axios.get(`${config.apiBaseUrl}/shop/wallet`, {
        headers: {
          Authorization: `Bearer ${interaction.user.id}`,
        },
        timeout: 10000,
      });

      const wallet = response.data;
      const transactions = (wallet.transactions || []).slice(0, limit);

      if (transactions.length === 0) {
        await interaction.editReply({
          content: 'No transactions yet.',
        });
        return;
      }

      const embed = {
        color: 0xF7C948,
        title: 'Transaction History',
        description: transactions
          .map((t: any) => {
            const amount = (t.amountCents / 100).toFixed(2);
            const direction = t.direction === 'credit' ? '+' : '-';
            const typeEmoji = t.type === 'topup' ? '💵' : t.type === 'purchase' ? '🛒' : '⚙️';
            return `${typeEmoji} ${direction}$${amount} - ${t.type} (${t.status})`;
          })
          .join('\n'),
        footer: { text: `Showing ${transactions.length} transactions` },
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      if (error.response?.status === 401) {
        await interaction.editReply({
          content: 'Please link your Discord account first.',
        });
      } else {
        console.error('[Wallet] History error:', error);
        await interaction.editReply({
          content: 'Failed to fetch transaction history.',
        });
      }
    }
  },
};
