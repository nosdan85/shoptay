import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { config } from '../../config';
import { COLORS } from '../../config/constants';

export const configCommand = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View bot configuration (staff only)')
    .addSubcommand((sub) =>
      sub.setName('view').setDescription('View current configuration')
    )
    .addSubcommand((sub) =>
      sub.setName('set').setDescription('Set a configuration value')
        .addStringOption((opt) =>
          opt.setName('key').setDescription('Config key').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('value').setDescription('Config value').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Check if user is staff
    if (!config.ownerIds.includes(interaction.user.id)) {
      await interaction.reply({
        content: 'Only staff can view/modify configuration.',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'view':
        await handleView(interaction);
        break;
      case 'set':
        await handleSet(interaction);
        break;
    }
  },

  async handleView(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = {
      color: COLORS.info,
      title: 'Bot Configuration',
      fields: [
        {
          name: 'Guild ID',
          value: config.discordGuildId,
          inline: true,
        },
        {
          name: 'Client ID',
          value: config.discordClientId,
          inline: true,
        },
        {
          name: 'Owner Role ID',
          value: config.ownerRoleId || 'Not set',
          inline: true,
        },
        {
          name: 'Owner IDs',
          value: config.ownerIds.join(', ') || 'None',
          inline: false,
        },
        {
          name: 'Vouch Channel ID',
          value: config.vouchChannelId,
          inline: true,
        },
        {
          name: 'Ticket Category ID',
          value: config.ticketCategoryId,
          inline: true,
        },
        {
          name: 'Owner Timezone',
          value: config.ownerTimezone,
          inline: true,
        },
        {
          name: 'API Base URL',
          value: config.apiBaseUrl,
          inline: false,
        },
        {
          name: 'Min Ticket Gap (ms)',
          value: String(config.minTicketCreateGapMs),
          inline: true,
        },
        {
          name: 'AddAll Concurrency',
          value: String(config.addAllConcurrency),
          inline: true,
        },
        {
          name: 'Log Level',
          value: config.logLevel,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },

  async handleSet(interaction: ChatInputCommandInteraction): Promise<void> {
    const key = interaction.options.getString('key', true);
    const value = interaction.options.getString('value', true);

    // This is a read-only view for now - actual config changes should be done via environment variables
    await interaction.reply({
      content: `Configuration changes must be made via environment variables.\n\nTo update \`${key}\`, set the \`${key.toUpperCase()}\` environment variable and restart the bot.`,
      ephemeral: true,
    });
  },
};
