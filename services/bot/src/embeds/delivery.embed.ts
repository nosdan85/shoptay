import { APIEmbed } from 'discord.js';
import { COLORS } from '../config/constants';
import { OrderItem } from '../types';

/**
 * Build delivery ticket embed
 */
export function buildDeliveryTicketEmbed(params: {
  orderId: string;
  robloxAccount: string;
  robloxUserId?: string;
  discordAccount: string;
  discordUserId?: string;
  total: number;
  items: OrderItem[];
  ownerTime: string;
  customerTime: string;
  ownerTimezone?: string;
}): APIEmbed {
  const {
    orderId,
    robloxAccount,
    robloxUserId,
    discordAccount,
    discordUserId,
    total,
    items,
    ownerTime,
    customerTime,
    ownerTimezone,
  } = params;

  const itemList = items
    .map((item) => `• ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
    .join('\n');

  const robloxDisplay = robloxUserId ? `${robloxAccount} (${robloxUserId})` : robloxAccount;
  const discordDisplay = discordUserId ? `<@${discordUserId}>` : discordAccount;

  const fields: any[] = [
    {
      name: 'Roblox Account',
      value: robloxDisplay,
      inline: true,
    },
    {
      name: 'Discord Account',
      value: discordDisplay,
      inline: true,
    },
    {
      name: 'Order Total',
      value: `$${total.toFixed(2)}`,
      inline: true,
    },
    {
      name: 'Items',
      value: itemList || 'No items',
      inline: false,
    },
    {
      name: 'Owner Delivery Time',
      value: ownerTime,
      inline: false,
    },
    {
      name: 'Customer Selected Time',
      value: customerTime,
      inline: false,
    },
  ];

  if (ownerTimezone) {
    fields.push({
      name: 'Owner Timezone',
      value: ownerTimezone,
      inline: true,
    });
  }

  return {
    color: COLORS.delivery,
    title: 'Order Delivery',
    description: `Hello ${discordAccount}. Your order is ready for delivery!`,
    fields,
    footer: {
      text: `NosMarket | Order ${orderId}`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build delivery confirmation embed
 */
export function buildDeliveryConfirmationEmbed(params: {
  orderId: string;
  robloxAccount: string;
  deliveryTime: string;
  deliveryNote?: string;
}): APIEmbed {
  const { orderId, robloxAccount, deliveryTime, deliveryNote } = params;

  const fields: any[] = [
    {
      name: 'Roblox Account',
      value: robloxAccount,
      inline: true,
    },
    {
      name: 'Delivery Time',
      value: deliveryTime,
      inline: true,
    },
  ];

  if (deliveryNote) {
    fields.push({
      name: 'Note',
      value: deliveryNote,
      inline: false,
    });
  }

  return {
    color: COLORS.delivery,
    title: 'Delivery Confirmed',
    description: 'Your delivery has been confirmed. Please be ready at the scheduled time.',
    fields,
    footer: {
      text: `NosMarket | Order ${orderId}`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build delivery slot selection embed
 */
export function buildDeliverySlotSelectEmbed(params: {
  orderId: string;
  availableSlots: Array<{
    id: string;
    date: string;
    time: string;
    ownerTime: string;
    customerTime: string;
  }>;
}): APIEmbed {
  const { orderId, availableSlots } = params;

  if (availableSlots.length === 0) {
    return {
      color: COLORS.warning,
      title: 'No Delivery Slots Available',
      description: 'There are no delivery slots available at the moment. Please check back later.',
      footer: {
        text: `NosMarket | Order ${orderId}`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  const slotList = availableSlots
    .map((slot) => `• **${slot.date}** - ${slot.customerTime}`)
    .join('\n');

  return {
    color: COLORS.delivery,
    title: 'Select Delivery Slot',
    description: 'Please select a delivery slot that works for you.',
    fields: [
      {
        name: 'Available Slots',
        value: slotList,
        inline: false,
      },
    ],
    footer: {
      text: `NosMarket | Order ${orderId}`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build delivery pending embed
 */
export function buildDeliveryPendingEmbed(params: {
  orderId: string;
  message: string;
}): APIEmbed {
  const { orderId, message } = params;

  return {
    color: COLORS.warning,
    title: 'Delivery Pending',
    description: message,
    footer: {
      text: `NosMarket | Order ${orderId}`,
    },
    timestamp: new Date().toISOString(),
  };
}
