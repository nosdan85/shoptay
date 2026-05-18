import { Client, GuildMember } from 'discord.js';
import { Logger } from '../types';
import { config } from '../config';

export default {
  name: 'guildMemberAdd',

  async execute(member: GuildMember, client: Client, log: Logger): Promise<void> {
    // Log member join
    log.info({ memberId: member.id, username: member.user.username }, '[Guild] Member joined');

    // Check if this is our guild
    if (member.guild.id !== config.discordGuildId) return;

    // Optional: Send welcome message
    const welcomeChannel = member.guild.systemChannel;
    if (welcomeChannel?.isTextBased()) {
      try {
        const embed = {
          color: 0x57F287,
          title: 'Welcome to Nos Market!',
          description: `Welcome <@${member.id}> to the server! 🎉\n\nMake sure to check out our products and feel free to reach out if you need any help.`,
          footer: { text: 'Nos Market' },
          timestamp: new Date().toISOString(),
        };

        await welcomeChannel.send({ embeds: [embed] });
      } catch (error) {
        log.warn({ error }, '[Guild] Failed to send welcome message');
      }
    }

    // Optional: Assign default role
    // const defaultRole = member.guild.roles.cache.get(config.defaultRoleId);
    // if (defaultRole) {
    //   await member.roles.add(defaultRole);
    // }
  },
};
