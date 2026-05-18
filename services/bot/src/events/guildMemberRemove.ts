import { Client, GuildMember } from 'discord.js';
import { Logger } from '../types';
import { config } from '../config';

export default {
  name: 'guildMemberRemove',

  async execute(member: GuildMember, client: Client, log: Logger): Promise<void> {
    // Log member leave
    log.info({ memberId: member.id, username: member.user.username }, '[Guild] Member left');

    // Check if this is our guild
    if (member.guild.id !== config.discordGuildId) return;

    // Optional: Notify staff about member leaving
    // This could be used to track user engagement or handle refunds
    // const ownerChannel = client.channels.cache.get(config.ownerChannelId);
    // if (ownerChannel?.isTextBased()) {
    //   const embed = {
    //     color: 0xED4245,
    //     title: 'Member Left',
    //     description: `<@${member.id}> (${member.user.username}) has left the server.`,
    //     footer: { text: 'Nos Market' },
    //     timestamp: new Date().toISOString(),
    //   };
    //   await ownerChannel.send({ embeds: [embed] });
    // }
  },
};
