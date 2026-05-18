import { ButtonInteraction } from 'discord.js';
import axios from 'axios';
import { Logger } from '../../types';
import { config } from '../../config';
import { EmbedService } from '../../services/EmbedService';

const embedService = new EmbedService(console as any);

export async function handleCopyValueButton(
  interaction: ButtonInteraction,
  log: Logger
): Promise<void> {
  const customId = interaction.customId;
  const parts = customId.split('_');

  // Extract button type and order ID
  // Format: copy_{type}_{field}_{orderId}
  // Examples:
  //   copy_paypal_email_{orderId}
  //   copy_paypal_item_{orderId}
  //   copy_cashapp_tag_{orderId}
  //   copy_cashapp_item_{orderId}
  //   copy_ltc_wallet_{orderId}

  const type = parts[1]; // paypal, cashapp, ltc
  const field = parts[2]; // email, item, tag, wallet
  const orderId = parts.slice(3).join('_'); // order ID (may contain underscores)

  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch order from API
    const response = await axios.get(`${config.apiBaseUrl}/shop/order-payment-info`, {
      params: { orderId },
      timeout: 10000,
    });

    const order = response.data;

    if (!order) {
      await interaction.editReply({
        content: 'Order not found.',
      });
      return;
    }

    // Determine what value to copy based on button type
    let valueToCopy = '';
    let label = '';

    switch (`${type}_${field}`) {
      case 'paypal_email':
        valueToCopy = order.paypalEmail || order.customerEmail || '';
        label = 'PayPal Email';
        break;
      case 'paypal_item':
        // Copy the item name for PayPal note
        valueToCopy = order.items?.map((i: any) => i.name).join(', ') || order.orderId;
        label = 'PayPal Item';
        break;
      case 'cashapp_tag':
        valueToCopy = order.cashAppTag || '$yoko276'; // Default fallback
        label = 'CashApp Tag';
        break;
      case 'cashapp_item':
        valueToCopy = order.items?.map((i: any) => i.name).join(', ') || order.orderId;
        label = 'CashApp Item';
        break;
      case 'ltc_wallet':
        valueToCopy = order.ltcAddress || '';
        label = 'LTC Address';
        break;
      default:
        await interaction.editReply({
          content: 'Unknown copy action.',
        });
        return;
    }

    if (!valueToCopy) {
      await interaction.editReply({
        content: `No ${label.toLowerCase()} found for this order.`,
      });
      return;
    }

    // Copy value to clipboard using Discord's copy feature
    // Note: Discord doesn't have a native copy-to-clipboard, but we can show the value
    await interaction.editReply({
      content: `**${label}**\n\n||${valueToCopy}||\n\nClick to copy the value above.`,
      embeds: [
        embedService.success(`Copied: ${valueToCopy}`),
      ],
    });

    log.info({ orderId, type, field, label }, '[CopyButton] Value copied');
  } catch (error: any) {
    log.error({ error, customId }, '[CopyButton] Error');

    if (error.response?.status === 404) {
      await interaction.editReply({
        content: 'Order not found.',
      });
    } else {
      await interaction.editReply({
        content: 'Failed to process payment selection.',
        embeds: [embedService.error('An error occurred.')],
      });
    }
  }
}
