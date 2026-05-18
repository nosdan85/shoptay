import { Client, Message } from 'discord.js';
import { Logger } from '../types';
import { config } from '../config';
import { TicketService } from '../services/TicketService';
import { VouchService } from '../services/VouchService';
import { EmbedService } from '../services/EmbedService';

const COMMAND_PATTERNS = {
  close: /^(?:!|\/)close|!dong|\/dong$/i,
  done: /^(?:!|\/)done$/i,
  confirm: /^(?:!|\/)confirm$/i,
  addall: /^(?:!|\/)addall|!readdall|\/readdall$/i,
  help: /^(?:!|\/)help$/i,
};

export default {
  name: 'messageCreate',

  async execute(message: Message, client: Client, log: Logger): Promise<void> {
    // Ignore bots
    if (message.author.bot) return;

    // Ignore non-guild messages
    if (!message.guild) return;

    // Check if this is a ticket channel
    const channel = message.channel;
    if (channel.isDMBased()) return;

    const content = message.content.trim();
    const isTicketChannel = channel.topic?.includes('ticket') || channel.name.startsWith('ticket') || channel.name.startsWith('payment') || channel.name.startsWith('support') || channel.name.startsWith('delivery');

    // Check if user is staff
    const member = message.member;
    const isStaff = config.ownerIds.includes(message.author.id) ||
      (config.ownerRoleId && member?.roles.cache.has(config.ownerRoleId));

    // Handle auto-vouch (staff uploads image in ticket)
    if (isTicketChannel && isStaff && message.attachments.size > 0) {
      await handleAutoVouch(message, client, log);
    }

    // Handle text commands
    if (COMMAND_PATTERNS.close.test(content)) {
      await handleClose(message, client, log);
    } else if (COMMAND_PATTERNS.done.test(content) && isStaff) {
      await handleDone(message, client, log);
    } else if (COMMAND_PATTERNS.confirm.test(content) && isStaff) {
      await handleConfirm(message, client, log);
    } else if (COMMAND_PATTERNS.addall.test(content) && isStaff) {
      await handleAddAll(message, client, log);
    } else if (COMMAND_PATTERNS.help.test(content)) {
      await handleHelp(message);
    }
  },
};

async function handleAutoVouch(message: Message, client: Client, log: Logger): Promise<void> {
  const vouchService = new VouchService(log);
  const embedService = new EmbedService(log);

  // Check if message has images
  const images = message.attachments.filter(att =>
    att.contentType?.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name || '')
  );

  if (images.size === 0) return;

  // Get vouch channel
  const vouchChannel = client.channels.cache.get(config.vouchChannelId);
  if (!vouchChannel?.isTextBased()) {
    log.warn('[Message] Vouch channel not found');
    return;
  }

  // Extract user info from channel topic or first message
  const discordId = extractDiscordId(message.channel) || '0';
  const discordUsername = message.author.username;

  try {
    // Download images
    const downloadedImages = await vouchService.downloadImages([...images.values()]);

    if (downloadedImages.length === 0) {
      await message.reply({
        embeds: [embedService.error('Failed to download images.')],
      });
      return;
    }

    // Build vouch content
    const vouchContent = vouchService.buildVouchContent(discordId, discordUsername, [], 0);

    // Post to vouch channel with images
    const { AttachmentBuilder } = require('discord.js');
    const attachments = downloadedImages.map(img =>
      new AttachmentBuilder(img.buffer, { name: img.name })
    );

    await vouchChannel.send({
      content: vouchContent,
      files: attachments,
    });

    await message.reply({
      embeds: [embedService.success(`Vouch posted successfully (${downloadedImages.length} image${downloadedImages.length > 1 ? 's' : ''}).`)],
    });
  } catch (error: any) {
    log.error({ error }, '[Message] Auto-vouch failed');
    await message.reply({
      embeds: [embedService.error('Failed to post vouch.')],
    });
  }
}

async function handleClose(message: Message, client: Client, log: Logger): Promise<void> {
  const channel = message.channel;
  if (!channel.isTextBased() || channel.isDMBased()) return;

  // Verify user is staff or ticket owner
  const isStaff = config.ownerIds.includes(message.author.id) ||
    (config.ownerRoleId && message.member?.roles.cache.has(config.ownerRoleId));

  const topicMatch = channel.topic?.match(/(\d+)/);
  const userId = topicMatch?.[1];

  if (!isStaff && userId !== message.author.id) {
    await message.reply({
      content: 'Only staff or the ticket owner can close this ticket.',
      ephemeral: true,
    });
    return;
  }

  await message.reply('Closing ticket in 3 seconds...');

  const ticketService = new TicketService(client, log);
  await ticketService.closeTicket(channel.id, 'Closed by user');
}

async function handleDone(message: Message, client: Client, log: Logger): Promise<void> {
  const channel = message.channel;
  if (!channel.isTextBased() || channel.isDMBased()) return;

  // Extract order ID from channel name or topic
  const orderIdMatch = channel.name.match(/-([a-z0-9]+)$/i) || channel.topic?.match(/([A-Z0-9]{8,})/i);
  const orderId = orderIdMatch?.[1] || 'unknown';

  const ticketService = new TicketService(client, log);
  await ticketService.markCompleted(channel.id, orderId);

  await message.reply({
    embeds: [new EmbedService(log).success('Ticket marked as completed!')],
  });
}

async function handleConfirm(message: Message, client: Client, log: Logger): Promise<void> {
  const channel = message.channel;
  if (!channel.isTextBased() || channel.isDMBased()) return;

  // Extract order ID from channel name or topic
  const orderIdMatch = channel.name.match(/-([a-z0-9]+)$/i) || channel.topic?.match(/([A-Z0-9]{8,})/i);
  const orderId = orderIdMatch?.[1];

  if (!orderId) {
    await message.reply({
      content: 'Could not determine order ID from this channel.',
      ephemeral: true,
    });
    return;
  }

  const ticketService = new TicketService(client, log);
  await ticketService.requestConfirmation(channel.id, orderId);

  await message.reply({
    embeds: [new EmbedService(log).info('Confirmation requested. Customer has been notified.')],
  });
}

async function handleAddAll(message: Message, client: Client, log: Logger): Promise<void> {
  // This would redirect to the slash command
  await message.reply({
    content: 'Please use `/addall` instead.',
    ephemeral: true,
  });
}

async function handleHelp(message: Message): Promise<void> {
  const embed = {
    color: 0x5865F2,
    title: 'Nos Market Bot Commands',
    description: `
**Ticket Commands:**
• \`/ticket create\` - Create a new ticket
• \`/ticket close\` - Close current ticket
• \`/ticket list\` - List your tickets

**General Commands:**
• \`/verify\` - Link your Discord account
• \`/order status <order_id>\` - Check order status
• \`/order info\` - View your orders
• \`/stock [product]\` - Check product availability
• \`/wallet balance\` - Check wallet balance
• \`/wallet history\` - View transaction history
• \`/stats\` - View market statistics

**Staff Commands:**
• \`/addall\` - Add all linked users to server
• \`/reload\` - Reload bot commands
• \`/config\` - View bot configuration

**Text Commands (in tickets):**
• \`!close\` / \`/close\` - Close ticket
• \`!done\` / \`/done\` - Mark completed
• \`!confirm\` / \`/confirm\` - Request confirmation
    `.trim(),
    footer: { text: 'Nos Market Bot' },
    timestamp: new Date().toISOString(),
  };

  await message.reply({ embeds: [embed] });
}

function extractDiscordId(channel: any): string | null {
  // Try to extract from topic
  if (channel.topic) {
    const match = channel.topic.match(/(\d{17,20})/);
    if (match) return match[1];
  }

  // Try to find from permission overwrites
  if (channel.permissionOverwrites) {
    for (const [id, overwrite] of channel.permissionOverwrites) {
      if (overwrite.allow?.has('ViewChannel') && !id.startsWith('@') && !id.startsWith('&')) {
        return id;
      }
    }
  }

  return null;
}
