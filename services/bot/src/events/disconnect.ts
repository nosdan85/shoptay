import { Client } from 'discord.js';
import { Logger } from '../types';

export default {
  name: 'disconnect',

  async execute(_event: any, _client: Client, log: Logger): Promise<void> {
    log.warn('[BOT] Disconnected from gateway');
  },
};
