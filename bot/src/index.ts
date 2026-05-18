import { Client, GatewayIntentBits, ActivityType, Collection } from "discord.js";
import dotenv from "dotenv";
import { handleInteraction } from "./handlers/interactionHandler";
import { handleMessage } from "./handlers/messageHandler";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("ready", () => {
  console.log("✅ Bot is online!");
  client.user?.setActivity("NosMarket", { type: ActivityType.Watching });
});

client.on("interactionCreate", async (interaction) => {
  await handleInteraction(interaction);
});

client.on("messageCreate", async (message) => {
  await handleMessage(message);
});

client.login(process.env.DISCORD_TOKEN);
