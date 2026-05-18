import {
  Client,
  ChatInputCommandInteraction,
  ButtonInteraction,
  SelectMenuInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import { Logger } from '../types';

// Import command executors
import { ticketCommand } from '../commands/ticket';
import { verifyCommand } from '../commands/verify';
import { orderCommand } from '../commands/order';
import { stockCommand } from '../commands/stock';
import { walletCommand } from '../commands/wallet';
import { statsCommand } from '../commands/stats';
import { addAllCommand } from '../commands/admin/addall';
import { reloadCommand } from '../commands/admin/reload';
import { configCommand } from '../commands/admin/config';

// Import component handlers
import { handleCopyValueButton } from '../components/buttons/copyValue';
import { handleTicketActionButton } from '../components/buttons/ticketActions';
import { handlePaymentSelect } from '../components/buttons/paymentSelect';
import { handleTicketCategorySelect } from '../components/selectMenus/ticketCategory';
import { handleDeliveryConfirmModal } from '../components/modals/deliveryConfirm';

const commandMap: Record<string, any> = {
  ticket: ticketCommand,
  verify: verifyCommand,
  order: orderCommand,
  stock: stockCommand,
  wallet: walletCommand,
  stats: statsCommand,
  addall: addAllCommand,
  reload: reloadCommand,
  config: configCommand,
};

export default {
  name: 'interactionCreate',

  async execute(
    interaction: ChatInputCommandInteraction | ButtonInteraction | SelectMenuInteraction | ModalSubmitInteraction,
    client: Client,
    log: Logger
  ): Promise<void> {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        const command = commandMap[interaction.commandName];
        if (command) {
          await command.execute(interaction, client);
        } else {
          log.warn({ command: interaction.commandName }, '[Interaction] Unknown command');
          await interaction.reply({
            content: 'Unknown command.',
            ephemeral: true,
          });
        }
        return;
      }

      // Handle button interactions
      if (interaction.isButton()) {
        const customId = interaction.customId;

        // Copy value buttons
        if (customId.startsWith('copy_paypal_email_') ||
            customId.startsWith('copy_paypal_item_') ||
            customId.startsWith('copy_cashapp_tag_') ||
            customId.startsWith('copy_cashapp_item_') ||
            customId.startsWith('copy_ltc_wallet_')) {
          await handleCopyValueButton(interaction, log);
          return;
        }

        // Ticket action buttons
        if (customId.startsWith('ticket_confirm_') ||
            customId.startsWith('ticket_done_') ||
            customId.startsWith('ticket_close_')) {
          await handleTicketActionButton(interaction, client, log);
          return;
        }

        // Payment selection buttons
        if (customId.startsWith('payment_select_')) {
          await handlePaymentSelect(interaction, log);
          return;
        }

        log.warn({ customId }, '[Interaction] Unknown button');
        return;
      }

      // Handle select menu interactions
      if (interaction.isSelectMenu()) {
        const customId = interaction.customId;

        // Ticket category select
        if (customId.startsWith('ticket_category_')) {
          await handleTicketCategorySelect(interaction, client, log);
          return;
        }

        log.warn({ customId }, '[Interaction] Unknown select menu');
        return;
      }

      // Handle modal submissions
      if (interaction.isModalSubmit()) {
        const customId = interaction.customId;

        // Delivery confirmation modal
        if (customId.startsWith('delivery_confirm_')) {
          await handleDeliveryConfirmModal(interaction, client, log);
          return;
        }

        log.warn({ customId }, '[Interaction] Unknown modal');
        return;
      }
    } catch (error) {
      log.error({ error, interactionType: interaction.type }, '[Interaction] Error handling interaction');

      const replyOptions = {
        content: 'An error occurred while processing your request.',
        ephemeral: true,
      };

      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply(replyOptions);
      } else if (interaction.isRepliable() && interaction.deferred) {
        await interaction.editReply(replyOptions);
      }
    }
  },
};
