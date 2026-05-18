import { Client } from 'discord.js';
import { Logger } from '../types';
import { config } from '../config';

export function registerEvents(client: Client, log: Logger): void {
  // Load event files
  const eventFiles = [
    'ready',
    'interactionCreate',
    'messageCreate',
    'guildMemberAdd',
    'guildMemberRemove',
    'error',
    'disconnect',
    'reconnecting',
  ];

  for (const file of eventFiles) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const event = require(`./${file}`).default;
      
      if (event.once) {
        client.once(event.name, (...args: any[]) => event.execute(...args, client, log));
      } else {
        client.on(event.name, (...args: any[]) => event.execute(...args, client, log));
      }
      
      log.debug(`[Events] Registered event: ${event.name}`);
    } catch (error) {
      log.warn({ error, file }, `[Events] Failed to load event: ${file}`);
    }
  }
}
