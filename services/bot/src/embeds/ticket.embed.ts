import { APIEmbed } from 'discord.js';
import { COLORS } from '../config/constants';

/**
 * Ticket header embed builder
 */
export function buildTicketHeader(params: {
  orderId: string;
  ticketType: 'payment' | 'support' | 'delivery' | 'wallet';
}): APIEmbed {
  const { orderId, ticketType } = params;

  const typeLabels = {
    payment: 'Payment Ticket',
    support: 'Support Ticket',
    delivery: 'Delivery Ticket',
    wallet: 'Wallet Ticket',
  };

  const typeColors = {
    payment: COLORS.paypal,
    support: COLORS.info,
    delivery: COLORS.delivery,
    wallet: COLORS.wallet,
  };

  return {
    color: typeColors[ticketType],
    title: typeLabels[ticketType],
    description: `Ticket for order \`${orderId}\``,
    footer: {
      text: `NosMarket | Ticket ${orderId}`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Ticket footer embed builder
 */
export function buildTicketFooter(params: {
  status: 'open' | 'pending' | 'closed';
  createdAt?: Date;
}): APIEmbed {
  const { status, createdAt } = params;

  const statusEmojis = {
    open: '🟢',
    pending: '🟡',
    closed: '🔴',
  };

  const fields: any[] = [];

  if (createdAt) {
    fields.push({
      name: 'Created',
      value: `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`,
      inline: true,
    });
  }

  fields.push({
    name: 'Status',
    value: `${statusEmojis[status]} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    inline: true,
  });

  return {
    color: COLORS.info,
    fields,
    footer: {
      text: 'NosMarket Support',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generic ticket embed
 */
export function buildTicketEmbed(params: {
  title: string;
  description: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
}): APIEmbed {
  const { title, description, color = COLORS.info, fields = [], footer = 'NosMarket' } = params;

  return {
    color,
    title,
    description,
    fields,
    footer: {
      text: footer,
    },
    timestamp: new Date().toISOString(),
  };
}
