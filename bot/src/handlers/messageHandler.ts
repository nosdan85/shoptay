import { Message, AttachmentBuilder } from 'discord.js';

export async function handleMessage(message: Message) {
  if (message.author.bot) return;

  // Auto-vouch helper logic
  const vouchChannelId = process.env.VOUCH_CHANNEL_ID;
  const ownerRoleId = process.env.OWNER_ROLE_ID;

  if (message.channel.type === 0 && message.channel.name.startsWith('ticket-')) { // GuildText
    const isStaff = message.member?.roles.cache.has(ownerRoleId || '') || message.member?.permissions.has('Administrator');
    if (isStaff && message.attachments.size > 0 && vouchChannelId) {
      const vouchChannel = message.guild?.channels.cache.get(vouchChannelId);
      if (vouchChannel && vouchChannel.isTextBased()) {
        for (const [key, attachment] of message.attachments) {
          const file = new AttachmentBuilder(attachment.url);
          await vouchChannel.send({
            content: `⭐ New vouch delivery receipt from <@${message.author.id}> in <#${message.channel.id}>:`,
            files: [file]
          });
        }
      }
    }
  }

  // Handle message commands: !close, !done, !confirm
  if (message.content.startsWith('!')) {
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === 'close') {
      try {
        await message.reply('⏳ Closing ticket...');
        setTimeout(async () => {
          try {
            await message.channel.delete();
          } catch (e) {
            console.error('Error deleting channel:', e);
          }
        }, 3000);
      } catch (error) {
        console.error(error);
      }
    }

    if (command === 'done') {
      try {
        await message.reply('✅ Order completed. Closing channel...');
        setTimeout(async () => {
          try {
            await message.channel.delete();
          } catch (e) {
            console.error('Error deleting channel:', e);
          }
        }, 2000);
      } catch (error) {
        console.error(error);
      }
    }

    if (command === 'confirm') {
      try {
        await message.reply('📦 Requesting delivery confirmation...');
      } catch (error) {
        console.error(error);
      }
    }
  }
}
