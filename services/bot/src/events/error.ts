import { Client, ErrorEvent } from 'discord.js';
import { Logger } from '../types';

export default {
  name: 'error',

  async execute(error: Error, _client: Client, log: Logger): Promise<void> {
    log.error({ error }, '[BOT] Client error');

    // Log specific error details
    if (error.message) {
      log.error({ message: error.message }, '[BOT] Error message');
    }
    if (error.stack) {
      log.debug({ stack: error.stack }, '[BOT] Error stack');
    }
  },
};
