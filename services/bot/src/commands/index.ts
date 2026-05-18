import { REST, Routes, Client, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Config } from '../config';
import { Logger } from '../types';

// Import all commands
import { ticketCommand } from './ticket';
import { verifyCommand } from './verify';
import { orderCommand } from './order';
import { stockCommand } from './stock';
import { walletCommand } from './wallet';
import { statsCommand } from './stats';

// Import admin commands
import { addAllCommand } from './admin/addall';
import { reloadCommand } from './admin/reload';
import { configCommand } from './admin/config';

const commands = [
  ticketCommand,
  verifyCommand,
  orderCommand,
  stockCommand,
  walletCommand,
  statsCommand,
  addAllCommand,
  reloadCommand,
  configCommand,
];

export function registerCommands(client: Client, config: Config): void {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  client.on('ready', async () => {
    try {
      await rest.put(
        Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
        { body: commands.map(cmd => cmd.data.toJSON()) }
      );
      console.log(`[Commands] Registered ${commands.length} commands`);
    } catch (error) {
      console.error('[Commands] Failed to register commands:', error);
    }
  });
}

export { ticketCommand, verifyCommand, orderCommand, stockCommand, walletCommand, statsCommand };
