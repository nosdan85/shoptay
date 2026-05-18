import { APIEmbed } from 'discord.js';
import { COLORS } from '../config/constants';
import { PaymentMethod, OrderItem } from '../types';

/**
 * Build PayPal payment embed
 */
export function buildPayPalEmbed(params: {
  orderId: string;
  buyer: string;
  ownerRole?: string;
  total: number;
  email: string;
  items: OrderItem[];
  memoExpected: string;
}): APIEmbed {
  const { orderId, buyer, ownerRole, total, email, items, memoExpected } = params;

  const itemList = items
    .map((item) => `• ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
    .join('\n');

  return {
    color: COLORS.paypal,
    title: 'PayPal Payment',
    description: `Hello ${buyer}. Please complete your payment to proceed with the order.`,
    fields: [
      {
        name: 'Buyer',
        value: buyer,
        inline: true,
      },
      {
        name: 'Order Total',
        value: `$${total.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Payment',
        value: `$${total.toFixed(2)} to ${email} (Friends & Family)`,
        inline: false,
      },
      {
        name: 'Items',
        value: itemList || 'No items',
        inline: false,
      },
      {
        name: 'Proof of Payment',
        value: 'Send your payment screenshot in this channel after completing the payment.',
        inline: false,
      },
      {
        name: 'Important Note',
        value: `PayPal Note: **${memoExpected}**`,
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
 * Build CashApp payment embed
 */
export function buildCashAppEmbed(params: {
  orderId: string;
  buyer: string;
  ownerRole?: string;
  total: number;
  cashAppTag: string;
  items: OrderItem[];
  conversionFee?: number;
}): APIEmbed {
  const { orderId, buyer, ownerRole, total, cashAppTag, items, conversionFee = 0 } = params;

  const itemList = items
    .map((item) => `• ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
    .join('\n');

  const finalAmount = conversionFee > 0 ? total * (1 + conversionFee / 100) : total;

  return {
    color: COLORS.paypal,
    title: 'Cash App Payment',
    description: `Hello ${buyer}. Please complete your payment to proceed with the order.`,
    fields: [
      {
        name: 'Buyer',
        value: buyer,
        inline: true,
      },
      {
        name: 'Order Total',
        value: `$${total.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Amount to Send',
        value: `$${finalAmount.toFixed(2)} (includes ${conversionFee}% conversion fee)`,
        inline: false,
      },
      {
        name: 'Send To',
        value: cashAppTag,
        inline: false,
      },
      {
        name: 'Items',
        value: itemList || 'No items',
        inline: false,
      },
      {
        name: 'Proof of Payment',
        value: 'Send your payment screenshot in this channel after completing the payment.',
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
 * Build Litecoin payment embed
 */
export function buildLitecoinEmbed(params: {
  orderId: string;
  buyer: string;
  ownerRole?: string;
  total: number;
  ltcAddress: string;
  ltcAmount: number;
  items: OrderItem[];
}): APIEmbed {
  const { orderId, buyer, ownerRole, total, ltcAddress, ltcAmount, items } = params;

  const itemList = items
    .map((item) => `• ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
    .join('\n');

  return {
    color: COLORS.ltc,
    title: 'Litecoin Payment',
    description: `Hello ${buyer}. Please complete your payment to proceed with the order.`,
    fields: [
      {
        name: 'Buyer',
        value: buyer,
        inline: true,
      },
      {
        name: 'Order Total',
        value: `$${total.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Payment',
        value: `$${ltcAmount.toFixed(2)} equivalent LTC to ${ltcAddress}`,
        inline: false,
      },
      {
        name: 'Items',
        value: itemList || 'No items',
        inline: false,
      },
      {
        name: 'Proof of Payment',
        value: 'Send your payment screenshot in this channel after completing the payment.',
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
 * Build generic payment method selection embed
 */
export function buildPaymentMethodSelectEmbed(params: {
  orderId: string;
  total: number;
  buyer: string;
}): APIEmbed {
  const { orderId, total, buyer } = params;

  return {
    color: COLORS.info,
    title: 'Select Payment Method',
    description: `Hello ${buyer}. Please select your preferred payment method below.`,
    fields: [
      {
        name: 'Order Total',
        value: `$${total.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Available Methods',
        value: '• PayPal (Friends & Family)\n• Cash App\n• Litecoin (LTC)',
        inline: false,
      },
    ],
    footer: {
      text: `NosMarket | Order ${orderId}`,
    },
    timestamp: new Date().toISOString(),
  };
}
