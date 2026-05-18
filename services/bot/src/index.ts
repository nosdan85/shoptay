import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config';
import { registerEvents } from './events';
import { registerCommands } from './commands';
import { registerComponents } from './components';
import pino from 'pino';

const log = pino({ level: config.logLevel });

async function main(): Promise<void> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  registerEvents(client, log);
  registerCommands(client, config);
  registerComponents(client);

  await client.login(config.discordToken);
  log.info(`[BOT] Logged in as ${client.user?.tag}`);
}

main().catch((err: Error) => {
  log.error({ err }, '[BOT] Fatal error');
  process.exit(1);
});
