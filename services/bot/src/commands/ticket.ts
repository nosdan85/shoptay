import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { config } from '../config';
import { TicketService } from '../services/TicketService';
import { Client } from 'discord.js';

export const ticketCommand = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage support tickets')
    .addSubcommandGroup((group) =>
      group
        .setName('create')
        .setDescription('Create a new ticket')
        .addSubcommand((sub) =>
          sub
            .setName('payment')
            .setDescription('Create a payment ticket')
            .addStringOption((opt) =>
              opt.setName('order_id').setDescription('Order ID').setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName('support')
            .setDescription('Create a support ticket')
            .addStringOption((opt) =>
              opt.setName('subject').setDescription('Subject').setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName('description').setDescription('Description').setRequired(false)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName('other')
            .setDescription('Create an other ticket')
            .addStringOption((opt) =>
              opt.setName('subject').setDescription('Subject').setRequired(true)
            )
        )
    )
    .addSubcommandGroup((group) =>
      group.setName('close').setDescription('Close current ticket')
    )
    .addSubcommandGroup((group) =>
      group.setName('list').setDescription('List your tickets')
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    switch (subcommandGroup) {
      case 'create':
        await handleCreate(interaction, client, subcommand);
        break;
      case 'close':
        await handleClose(interaction, client);
        break;
      case 'list':
        await handleList(interaction);
        break;
      default:
        await interaction.reply({
          content: 'Invalid command usage.',
          ephemeral: true,
        });
    }
  },
};

async function handleCreate(interaction: ChatInputCommandInteraction, client: Client, type: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (type === 'payment') {
      const orderId = interaction.options.getString('order_id', true);

      // Fetch order info from API
      const response = await axios.get(`${config.apiBaseUrl}/shop/order-payment-info`, {
        params: { orderId },
        timeout: 10000,
      });

      const order = response.data;

      if (!order) {
        await interaction.editReply({ content: 'Order not found.' });
        return;
      }

      // Create ticket via TicketService
      const ticketService = new TicketService(client, console as any);
      const result = await ticketService.createTicket({
        orderId: order.orderId,
        method: order.paymentMethod || 'paypal',
        customerDiscordId: interaction.user.id,
        customerUsername: interaction.user.username,
        total: order.total,
        items: order.items,
        email: order.customerEmail,
        memoExpected: order.memoExpected,
      });

      await interaction.editReply({
        content: `Ticket created successfully! <#${result.channelId}>`,
      });
    } else if (type === 'support' || type === 'other') {
      const subject = interaction.options.getString('subject', true);
      const description = interaction.options.getString('description', false);

      // Create a simple support ticket
      const guild = await client.guilds.fetch(config.discordGuildId);
      const category = await client.channels.fetch(config.ticketCategoryId);

      const channelName = `support-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

      const channel = await guild.channels.create({
        name: channelName,
        type: 0,
        parent: category?.id,
        topic: `Support ticket - ${subject}`,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: 'ViewChannel' },
          { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'EmbedLinks', 'AttachFiles'] },
        ],
      });

      await channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [
          {
            color: 0x5865f2,
            title: 'Support Ticket',
            description: `**Subject:** ${subject}\n**Description:** ${description || 'No description provided.'}`,
            footer: { text: `Created by ${interaction.user.username}` },
            timestamp: new Date().toISOString(),
          },
        ],
      });

      await interaction.editReply({
        content: `Support ticket created! <#${channel.id}>`,
      });
    }
  } catch (error: any) {
    console.error('[Ticket] Create error:', error);
    await interaction.editReply({
      content: `Failed to create ticket: ${error.message}`,
    });
  }
}

async function handleClose(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
  const channel = interaction.channel;

  if (!channel || channel.isDMBased()) {
    await interaction.reply({
      content: 'This command can only be used in a ticket channel.',
      ephemeral: true,
    });
    return;
  }

  // Verify user is staff or ticket owner
  const guild = await client.guilds.fetch(config.discordGuildId);
  const member = await guild.members.fetch(interaction.user.id);
  const isStaff = config.ownerIds.includes(interaction.user.id) ||
    (config.ownerRoleId && member.roles.cache.has(config.ownerRoleId));

  // Extract user ID from channel topic or permission overwrites
  const topicMatch = channel.topic?.match(/user:\s*(\d+)/);
  const userId = topicMatch?.[1];

  if (!isStaff && userId !== interaction.user.id) {
    await interaction.reply({
      content: 'Only staff or the ticket owner can close this ticket.',
      ephemeral: true,
    });
    return;
  }

  await interaction.reply('Closing ticket in 3 seconds...');

  const ticketService = new TicketService(client, console as any);
  await ticketService.closeTicket(channel.id, 'Closed by user');
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch user's tickets from API
    const response = await axios.get(`${config.apiBaseUrl}/tickets/user/${interaction.user.id}`, {
      timeout: 10000,
    });

    const tickets = response.data.tickets || [];

    if (tickets.length === 0) {
      await interaction.editReply({ content: 'You have no tickets.' });
      return;
    }

    const embed = {
      color: 0x5865f2,
      title: 'Your Tickets',
      description: tickets
        .map((t: any) => `<#${t.channelId}> - ${t.status} (${t.type})`)
        .join('\n'),
      timestamp: new Date().toISOString(),
    };

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('[Ticket] List error:', error);
    await interaction.editReply({
      content: 'Failed to fetch tickets.',
    });
  }
}
