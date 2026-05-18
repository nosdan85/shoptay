import { Client } from 'discord.js';
import { Logger } from '../types';

export default {
  name: 'reconnecting',

  async execute(_event: any, _client: Client, log: Logger): Promise<void> {
    log.info('[BOT] Reconnecting to gateway...');
  },
};
