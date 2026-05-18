import { ButtonInteraction, Client } from 'discord.js';
import axios from 'axios';
import { Logger } from '../../types';
import { config } from '../../config';
import { TicketService } from '../../services/TicketService';
import { EmbedService } from '../../services/EmbedService';

const embedService = new EmbedService(console as any);

export async function handleTicketActionButton(
  interaction: ButtonInteraction,
  client: Client,
  log: Logger
): Promise<void> {
  const customId = interaction.customId;
  const parts = customId.split('_');

  // Extract action and order ID
  // Format: ticket_{action}_{orderId}
  // Actions: confirm, done, close
  const action = parts[1];
  const orderId = parts.slice(2).join('_');

  // Check if user is staff
  const isStaff = config.ownerIds.includes(interaction.user.id) ||
    (config.ownerRoleId && interaction.member?.roles instanceof Set && 
     (interaction.member.roles as any).cache?.has?.(config.ownerRoleId));

  if (!isStaff) {
    await interaction.reply({
      content: 'Only staff can perform this action.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: false });

  const ticketService = new TicketService(client, log);

  try {
    switch (action) {
      case 'confirm':
        // Request customer confirmation
        await handleConfirm(interaction, orderId, ticketService);
        break;

      case 'done':
        // Mark order as completed
        await handleDone(interaction, orderId, ticketService);
        break;

      case 'close':
        // Close the ticket
        await handleClose(interaction, orderId, ticketService);
        break;

      default:
        await interaction.editReply({
          content: 'Unknown action.',
        });
    }
  } catch (error: any) {
    log.error({ error, action, orderId }, '[TicketButton] Error');

    await interaction.editReply({
      content: `Failed to ${action} ticket: ${error.message}`,
      embeds: [embedService.error('An error occurred.')],
    });
  }
}

async function handleConfirm(
  interaction: ButtonInteraction,
  orderId: string,
  ticketService: TicketService
): Promise<void> {
  try {
    // Get channel ID
    const channel = interaction.channel;
    if (!channel) {
      await interaction.editReply({
        content: 'Channel not found.',
      });
      return;
    }

    // Request confirmation
    await ticketService.requestConfirmation(channel.id, orderId);

    await interaction.editReply({
      content: 'Confirmation requested. Customer has been notified.',
      embeds: [embedService.success('Confirmation sent!')],
    });
  } catch (error: any) {
    await interaction.editReply({
      content: `Failed to request confirmation: ${error.message}`,
    });
  }
}

async function handleDone(
  interaction: ButtonInteraction,
  orderId: string,
  ticketService: TicketService
): Promise<void> {
  try {
    // Get channel ID
    const channel = interaction.channel;
    if (!channel) {
      await interaction.editReply({
        content: 'Channel not found.',
      });
      return;
    }

    // Mark as completed
    await ticketService.markCompleted(channel.id, orderId);

    // Try to send confirmation to API
    try {
      await axios.post(`${config.apiBaseUrl}/orders/${orderId}/confirm-delivery`, {
        confirmedBy: interaction.user.id,
      });
    } catch {
      // API call failed, but ticket was marked as done
    }

    await interaction.editReply({
      content: 'Ticket marked as completed!',
      embeds: [embedService.success('Order completed successfully.')],
    });
  } catch (error: any) {
    await interaction.editReply({
      content: `Failed to mark as done: ${error.message}`,
    });
  }
}

async function handleClose(
  interaction: ButtonInteraction,
  orderId: string,
  ticketService: TicketService
): Promise<void> {
  try {
    // Get channel ID
    const channel = interaction.channel;
    if (!channel) {
      await interaction.editReply({
        content: 'Channel not found.',
      });
      return;
    }

    await ticketService.closeTicket(channel.id, `Closed by ${interaction.user.username}`);

    await interaction.editReply({
      content: 'Ticket closed.',
      embeds: [embedService.info('Ticket is being closed...')],
    });
  } catch (error: any) {
    await interaction.editReply({
      content: `Failed to close ticket: ${error.message}`,
    });
  }
}
