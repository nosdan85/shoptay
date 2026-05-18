import { SlashCommandBuilder, ChatInputCommandInteraction, Client, REST, Routes } from 'discord.js';
import { config } from '../../config';

// Import all commands for reloading
import { ticketCommand } from '../ticket';
import { verifyCommand } from '../verify';
import { orderCommand } from '../order';
import { stockCommand } from '../stock';
import { walletCommand } from '../wallet';
import { statsCommand } from '../stats';
import { addAllCommand } from './addall';
import { configCommand } from './config';

const allCommands = [
  ticketCommand,
  verifyCommand,
  orderCommand,
  stockCommand,
  walletCommand,
  statsCommand,
  addAllCommand,
  configCommand,
];

export const reloadCommand = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload bot commands')
    .addStringOption((opt) =>
      opt
        .setName('command')
        .setDescription('Specific command to reload, or "all" for everything')
        .setRequired(false)
        .addChoices(
          { name: 'All Commands', value: 'all' },
          { name: 'Ticket', value: 'ticket' },
          { name: 'Verify', value: 'verify' },
          { name: 'Order', value: 'order' },
          { name: 'Stock', value: 'stock' },
          { name: 'Wallet', value: 'wallet' },
          { name: 'Stats', value: 'stats' },
          { name: 'AddAll', value: 'addall' },
          { name: 'Config', value: 'config' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    // Check if user is staff
    if (!config.ownerIds.includes(interaction.user.id)) {
      await interaction.reply({
        content: 'Only staff can reload commands.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const commandFilter = interaction.options.getString('command') || 'all';
    const rest = new REST({ version: '10' }).setToken(config.discordToken);

    try {
      if (commandFilter === 'all') {
        // Reload all commands
        await rest.put(
          Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
          { body: allCommands.map((cmd) => cmd.data.toJSON()) }
        );

        await interaction.editReply({
          content: `Successfully reloaded ${allCommands.length} commands.`,
        });
      } else {
        // Reload specific command
        const commandMap: Record<string, any> = {
          ticket: ticketCommand,
          verify: verifyCommand,
          order: orderCommand,
          stock: stockCommand,
          wallet: walletCommand,
          stats: statsCommand,
          addall: addAllCommand,
          config: configCommand,
        };

        const command = commandMap[commandFilter];
        if (!command) {
          await interaction.editReply({
            content: `Unknown command: ${commandFilter}`,
          });
          return;
        }

        // For single command, we need to get all commands and replace just the one
        await rest.put(
          Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
          { body: allCommands.map((cmd) => cmd.data.toJSON()) }
        );

        await interaction.editReply({
          content: `Successfully reloaded command: ${commandFilter}`,
        });
      }
    } catch (error: any) {
      console.error('[Reload] Error:', error);
      await interaction.editReply({
        content: `Failed to reload commands: ${error.message}`,
      });
    }
  },
};
