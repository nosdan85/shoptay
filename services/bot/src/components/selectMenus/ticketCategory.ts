import { SelectMenuInteraction, Client } from 'discord.js';
import axios from 'axios';
import { Logger } from '../../types';
import { config } from '../../config';
import { EmbedService } from '../../services/EmbedService';
import { TicketService } from '../../services/TicketService';

const embedService = new EmbedService(console as any);

export async function handleTicketCategorySelect(
  interaction: SelectMenuInteraction,
  client: Client,
  log: Logger
): Promise<void> {
  const customId = interaction.customId;
  const parts = customId.split('_');

  // Extract values
  // Format: ticket_category_{action}_{orderId}
  const action = parts[2];
  const orderId = parts.slice(3).join('_');
  const selectedCategory = interaction.values[0];

  // Check if user is staff
  const isStaff = config.ownerIds.includes(interaction.user.id) ||
    (config.ownerRoleId && interaction.member?.roles instanceof Set &&
     (interaction.member.roles as any).cache?.has?.(config.ownerRoleId));

  if (!isStaff) {
    await interaction.reply({
      content: 'Only staff can change ticket category.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: false });

  try {
    const channel = interaction.channel;
    if (!channel) {
      await interaction.editReply({
        content: 'Channel not found.',
      });
      return;
    }

    // Move channel to new category
    const newCategory = await client.channels.fetch(selectedCategory);
    if (newCategory && newCategory.isCategory()) {
      await channel.setParent(newCategory);

      // Update channel topic with category
      const currentTopic = channel.topic || '';
      const updatedTopic = `${currentTopic}\nCategory: ${newCategory.name}`.trim();
      await channel.setTopic(updatedTopic);

      await interaction.editReply({
        content: `Ticket moved to category: **${newCategory.name}**`,
        embeds: [embedService.success('Category updated!')],
      });
    } else {
      await interaction.editReply({
        content: 'Invalid category selected.',
      });
    }
  } catch (error: any) {
    log.error({ error, action, orderId }, '[TicketCategorySelect] Error');

    await interaction.editReply({
      content: 'Failed to update category.',
      embeds: [embedService.error('An error occurred.')],
    });
  }
}
