import { SlashCommandBuilder, ChatInputCommandInteraction, Client, Guild } from 'discord.js';
import axios from 'axios';
import { config } from '../../config';
import { GuildSyncService } from '../../services/GuildSyncService';
import { ADDALL_CONCURRENCY, ADDALL_MAX_RETRIES } from '../../config/constants';

export const addAllCommand = {
  data: new SlashCommandBuilder()
    .setName('addall')
    .setDescription('Add all linked users to the Discord server')
    .addBooleanOption((opt) =>
      opt.setName('silent').setDescription('Send progress silently').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    // Check if user is staff
    if (!config.ownerIds.includes(interaction.user.id)) {
      await interaction.reply({
        content: 'Only staff can use this command.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: false });

    const silent = interaction.options.getBoolean('silent') || false;
    const guildSync = new GuildSyncService(console as any);
    const guild = await client.guilds.fetch(config.discordGuildId);

    try {
      // Fetch all linked users from the API
      const response = await axios.get(`${config.apiBaseUrl}/users/linked`, {
        timeout: 60000,
      });

      const users = response.data.users || [];
      const totalUsers = users.length;

      if (totalUsers === 0) {
        await interaction.editReply({
          content: 'No linked users found.',
        });
        return;
      }

      // Generate linked-users report
      const linkedUsersReport = users
        .sort((a: any, b: any) => a.discordUsername.localeCompare(b.discordUsername))
        .map((u: any) => `${u.discordId} - ${u.discordUsername}`)
        .join('\n');

      const reportContent = `Linked Users Report\nGenerated: ${new Date().toISOString()}\nTotal: ${users.length}\n\n${linkedUsersReport}`;

      // Initialize counters
      const results = {
        added: 0,
        alreadyIn: 0,
        skipped: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Send initial report file
      const { AttachmentBuilder } = require('discord.js');
      const attachment = new AttachmentBuilder(Buffer.from(reportContent), {
        name: `linked-users-${config.discordGuildId}.txt`,
      });

      await interaction.editReply({
        content: `Starting to add ${totalUsers} linked users...\n\nAdded: 0 | Already in: 0 | Skipped: 0 | Failed: 0`,
        attachments: [attachment],
      });

      // Process users in batches
      let processed = 0;
      let lastProgressUpdate = 0;
      let progressMessageId = (await interaction.fetchReply()).id;

      const batchSize = ADDALL_CONCURRENCY;

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (user: any) => {
            const { discordId, discordUsername } = user;

            // Check if already in guild
            const inGuild = await guildSync.isUserInGuild(discordId);
            if (inGuild) {
              results.alreadyIn++;
              processed++;
              return;
            }

            // Try to get fresh token
            let tokens = null;
            try {
              const tokenResponse = await axios.post(
                `${config.apiBaseUrl}/auth/refresh-token`,
                { discordId },
                { timeout: 10000 }
              );
              tokens = tokenResponse.data;
            } catch {
              results.skipped++;
              processed++;
              return;
            }

            if (!tokens?.accessToken) {
              results.skipped++;
              processed++;
              return;
            }

            // Try to add with retries
            let success = false;
            for (let retry = 0; retry < ADDALL_MAX_RETRIES; retry++) {
              try {
                await new Promise((resolve) => setTimeout(resolve, 500 * (retry + 1)));
                const added = await guildSync.addUserToGuild(discordId, tokens.accessToken);
                if (added) {
                  success = true;
                  results.added++;
                  break;
                }
              } catch (error: any) {
                if (retry === ADDALL_MAX_RETRIES - 1) {
                  results.errors.push(`Failed: ${discordUsername} - ${error.message}`);
                }
              }
            }

            if (!success) {
              results.failed++;
            }

            processed++;
          })
        );

        // Update progress every 100 users
        if (processed - lastProgressUpdate >= 100 || processed === totalUsers) {
          const progressEmbed = {
            content: `Progress: ${processed}/${totalUsers}\n\nAdded: ${results.added} | Already in: ${results.alreadyIn} | Skipped: ${results.skipped} | Failed: ${results.failed}`,
          };

          try {
            await interaction.editReply(progressEmbed);
          } catch {
            // Ignore edit errors during rapid updates
          }
          lastProgressUpdate = processed;
        }
      }

      // Final summary
      const summary = `✅ **Add-All Complete**\n\n` +
        `**Results:**\n` +
        `• Added: ${results.added}\n` +
        `• Already in server: ${results.alreadyIn}\n` +
        `• Skipped (no valid token): ${results.skipped}\n` +
        `• Failed: ${results.failed}\n` +
        `• Total processed: ${totalUsers}`;

      if (results.errors.length > 0) {
        const errorFile = new AttachmentBuilder(
          Buffer.from(results.errors.join('\n')),
          { name: 'add-all-errors.txt' }
        );
        await interaction.editReply({
          content: summary,
          attachments: [errorFile],
        });
      } else {
        await interaction.editReply(summary);
      }
    } catch (error: any) {
      console.error('[AddAll] Error:', error);
      await interaction.editReply({
        content: `Failed to execute add-all: ${error.message}`,
      });
    }
  },
};
