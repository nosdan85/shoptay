import { Client } from 'discord.js';
import { Logger } from '../types';
import { config } from '../config';

export default {
  name: 'ready',
  once: true,

  async execute(_client: Client, log: Logger): Promise<void> {
    log.info('[BOT] Bot is online');
    log.info(`[BOT] Guild ID: ${config.discordGuildId}`);
    log.info(`[BOT] Logged in as ${_client.user?.tag}`);
    log.info(`[BOT] Ready in ${_client.guilds.cache.size} guild(s)`);

    // Set bot status
    _client.user?.setActivity({
      name: 'Nos Market | /help',
      type: 0, // PLAYING
    });

    log.info('[BOT] Bot status set');
  },
};
