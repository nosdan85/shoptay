import { ButtonInteraction } from 'discord.js';
import axios from 'axios';
import { Logger } from '../../types';
import { config } from '../../config';
import { EmbedService } from '../../services/EmbedService';

const embedService = new EmbedService(console as any);

export async function handlePaymentSelect(
  interaction: ButtonInteraction,
  log: Logger
): Promise<void> {
  const customId = interaction.customId;
  const parts = customId.split('_');

  // Extract payment method and order ID
  // Format: payment_select_{method}_{orderId}
  const method = parts[2]; // paypal, cashapp, ltc
  const orderId = parts.slice(3).join('_');

  await interaction.deferReply({ ephemeral: true });

  try {
    // Create payment ticket via API
    let endpoint = '';
    switch (method) {
      case 'paypal':
        endpoint = `${config.apiBaseUrl}/shop/create-ticket-paypal-ff`;
        break;
      case 'cashapp':
        endpoint = `${config.apiBaseUrl}/shop/create-ticket`;
        break;
      case 'ltc':
        endpoint = `${config.apiBaseUrl}/shop/create-ticket-ltc`;
        break;
      default:
        await interaction.editReply({
          content: 'Unknown payment method.',
        });
        return;
    }

    const response = await axios.post(endpoint, { orderId }, { timeout: 15000 });

    const { channelId } = response.data;

    if (channelId) {
      await interaction.editReply({
        content: `Ticket created! <#${channelId}>`,
        embeds: [embedService.success('Your ticket has been created.')],
      });
    } else {
      await interaction.editReply({
        content: 'Ticket creation is in progress. Please wait...',
        embeds: [embedService.info('Your ticket is being created.')],
      });
    }
  } catch (error: any) {
    log.error({ error, method, orderId }, '[PaymentSelect] Error');

    if (error.response?.status === 409) {
      // Ticket already being created
      await interaction.editReply({
        content: 'Ticket is already being created. Please wait...',
      });
    } else if (error.response?.status === 429) {
      const retryAfter = error.response?.data?.retryAfterSeconds || 30;
      await interaction.editReply({
        content: `Rate limited. Please try again in ${retryAfter} seconds.`,
      });
    } else {
      await interaction.editReply({
        content: 'Failed to create ticket. Please try again later.',
        embeds: [embedService.error('An error occurred.')],
      });
    }
  }
}
