import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { config } from '../config';

export const statsCommand = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View Nos Market statistics'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      // Fetch stats from API
      const response = await axios.get(`${config.apiBaseUrl}/shop/stats`, {
        timeout: 10000,
      });

      const stats = response.data;

      const embed = {
        color: 0x5865F2,
        title: '📊 Nos Market Statistics',
        fields: [
          {
            name: 'Total Revenue',
            value: `$${((stats.revenue || 0) / 100).toFixed(2)}`,
            inline: true,
          },
          {
            name: 'Total Orders',
            value: String(stats.orders || 0),
            inline: true,
          },
          {
            name: 'Linked Users',
            value: String(stats.users || 0),
            inline: true,
          },
          {
            name: 'Active Products',
            value: String(stats.products || 0),
            inline: true,
          },
          {
            name: 'Server Members',
            value: String(stats.serverMembers || 'N/A'),
            inline: true,
          },
        ],
        footer: { text: 'Nos Market Stats' },
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('[Stats] Error:', error);
      await interaction.editReply({
        content: 'Failed to fetch statistics.',
      });
    }
  },
};
