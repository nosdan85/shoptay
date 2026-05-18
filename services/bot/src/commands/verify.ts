import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import axios from 'axios';
import { config } from '../config';
import { VerificationService } from '../services/VerificationService';

export const verifyCommand = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your Discord account with Nos Market'),

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const verificationService = new VerificationService(client, console as any);

    try {
      // Check if user is already linked
      const response = await axios.get(`${config.apiBaseUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${interaction.user.id}`, // Using Discord ID as token for simplicity
        },
        timeout: 10000,
      });

      if (response.data.discordId === interaction.user.id) {
        await interaction.editReply({
          content: `You are already verified as ${response.data.discordUsername || interaction.user.username}!`,
        });
        return;
      }
    } catch (error: any) {
      // User not found or not linked - that's okay for verification
      if (error.response?.status !== 404) {
        console.error('[Verify] Error checking user:', error);
      }
    }

    // Generate OAuth URL for linking
    const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${config.discordClientId}&redirect_uri=${encodeURIComponent(`${config.apiBaseUrl}/auth/discord/callback`)}&response_type=code&scope=identify%20guilds.join`;

    const embed = {
      color: 0x57F287,
      title: 'Link Your Discord Account',
      description: 'Click the button below to link your Discord account with Nos Market.',
      fields: [
        {
          name: 'Benefits',
          value: '• Access to your order history\n• Wallet management\n• Priority support',
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Link Discord Account')
        .setStyle(ButtonStyle.Link)
        .setURL(oauthUrl)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
};
