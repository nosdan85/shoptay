import { ModalSubmitInteraction, Client } from 'discord.js';
import axios from 'axios';
import { Logger } from '../../types';
import { config } from '../../config';
import { EmbedService } from '../../services/EmbedService';

const embedService = new EmbedService(console as any);

export async function handleDeliveryConfirmModal(
  interaction: ModalSubmitInteraction,
  client: Client,
  log: Logger
): Promise<void> {
  const customId = interaction.customId;
  const parts = customId.split('_');

  // Extract order ID
  // Format: delivery_confirm_{orderId}
  const orderId = parts.slice(2).join('_');

  // Check if user is staff
  const isStaff = config.ownerIds.includes(interaction.user.id) ||
    (config.ownerRoleId && interaction.member?.roles instanceof Set &&
     (interaction.member.roles as any).cache?.has?.(config.ownerRoleId));

  if (!isStaff) {
    await interaction.reply({
      content: 'Only staff can use this modal.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: false });

  try {
    // Get additional info from modal fields
    const deliveryNote = interaction.fields.getTextInputValue('delivery_note') || '';
    const deliveryTime = interaction.fields.getTextInputValue('delivery_time') || '';

    // Create additional info field
    const additionalInfo = [deliveryNote, deliveryTime].filter(Boolean).join('\n');

    // Notify the customer via DM
    const orderResponse = await axios.get(`${config.apiBaseUrl}/shop/order-payment-info`, {
      params: { orderId },
      timeout: 10000,
    });

    const order = orderResponse.data;

    if (order?.discordId) {
      try {
        const customer = await client.users.fetch(order.discordId);
        await customer.send({
          embeds: [
            embedService.info(`Your delivery for order **${orderId}** has been confirmed!\n\n${additionalInfo ? `Note: ${additionalInfo}` : ''}`),
          ],
        });
      } catch {
        // User might have DMs disabled
        log.warn({ orderId }, '[DeliveryConfirm] Could not DM customer');
      }
    }

    // Send confirmation in the ticket
    const channel = interaction.channel;
    if (channel) {
      await channel.send({
        embeds: [
          embedService.success(`Delivery confirmed for order **${orderId}**!\n\n${additionalInfo ? `Note: ${additionalInfo}` : ''}`),
        ],
      });
    }

    await interaction.editReply({
      content: 'Delivery confirmation sent!',
      embeds: [embedService.success('Customer has been notified.')],
    });
  } catch (error: any) {
    log.error({ error, orderId }, '[DeliveryConfirmModal] Error');

    await interaction.editReply({
      content: 'Failed to confirm delivery.',
      embeds: [embedService.error('An error occurred.')],
    });
  }
}
