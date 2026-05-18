import { APIEmbed } from 'discord.js';
import { COLORS } from '../config/constants';
import { PaymentMethod, TransactionStatus } from '../types';

/**
 * Build wallet balance embed
 */
export function buildWalletBalanceEmbed(params: {
  discordId: string;
  discordUsername: string;
  balanceCents: number;
}): APIEmbed {
  const { discordId, discordUsername, balanceCents } = params;
  const balance = balanceCents / 100;

  return {
    color: COLORS.wallet,
    title: '💰 Wallet Balance',
    description: `**$${balance.toFixed(2)}**`,
    fields: [
      {
        name: 'Account',
        value: `<@${discordId}>`,
        inline: true,
      },
      {
        name: 'Username',
        value: discordUsername,
        inline: true,
      },
      {
        name: 'Status',
        value: 'Active',
        inline: true,
      },
    ],
    footer: {
      text: 'NosMarket Wallet',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build wallet ticket embed (order delivery via wallet)
 */
export function buildWalletTicketEmbed(params: {
  orderId: string;
  discordAccount: string;
  discordUserId?: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
}): APIEmbed {
  const { orderId, discordAccount, discordUserId, amount, method, reference } = params;
  const discordDisplay = discordUserId ? `<@${discordUserId}>` : discordAccount;

  const methodLabels: Record<PaymentMethod, string> = {
    paypal: 'PayPal F&F',
    cashapp: 'Cash App Pay',
    ltc: 'Litecoin',
    wallet: 'Wallet',
  };

  return {
    color: COLORS.wallet,
    title: 'Order Delivery',
    description: `Hello ${discordAccount}. Your order has been delivered via wallet!`,
    fields: [
      {
        name: 'Order ID',
        value: orderId,
        inline: true,
      },
      {
        name: 'Discord Account',
        value: discordDisplay,
        inline: true,
      },
      {
        name: 'Amount',
        value: `$${amount.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Payment',
        value: 'Paid with NosMarket Wallet',
        inline: false,
      },
      {
        name: 'Reference',
        value: reference,
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
 * Build wallet topup notification embed
 */
export function buildWalletTopupEmbed(params: {
  discordId: string;
  username: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string;
  memo?: string;
}): APIEmbed {
  const { discordId, username, amountCents, method, reference, memo } = params;
  const amount = amountCents / 100;

  const methodLabels: Record<PaymentMethod, string> = {
    paypal: 'PayPal F&F',
    cashapp: 'Cash App Pay',
    ltc: 'Litecoin',
    wallet: 'Wallet',
  };

  const fields: any[] = [
    {
      name: 'Customer',
      value: `<@${discordId}>`,
      inline: true,
    },
    {
      name: 'Username',
      value: username,
      inline: true,
    },
    {
      name: 'Amount',
      value: `$${amount.toFixed(2)}`,
      inline: true,
    },
    {
      name: 'Method',
      value: methodLabels[method],
      inline: true,
    },
    {
      name: 'Reference',
      value: reference,
      inline: false,
    },
  ];

  if (memo) {
    fields.push({
      name: 'Memo',
      value: memo,
      inline: false,
    });
  }

  return {
    color: COLORS.wallet,
    title: 'Wallet Top-up Pending',
    fields,
    footer: {
      text: 'NosMarket | Wallet Top-up',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build transaction history embed
 */
export function buildTransactionHistoryEmbed(params: {
  discordId: string;
  transactions: Array<{
    id: string;
    type: string;
    amountCents: number;
    direction: 'credit' | 'debit';
    status: TransactionStatus;
    referenceCode?: string;
    createdAt: Date;
  }>;
  limit?: number;
}): APIEmbed {
  const { discordId, transactions, limit = 10 } = params;

  const transactionList = transactions
    .slice(0, limit)
    .map((t) => {
      const amount = (t.amountCents / 100).toFixed(2);
      const direction = t.direction === 'credit' ? '+' : '-';
      const typeEmoji = t.type === 'topup' ? '💵' : t.type === 'purchase' ? '🛒' : '⚙️';
      const statusEmoji = t.status === 'completed' ? '✅' : t.status === 'pending' ? '⏳' : t.status === 'rejected' ? '❌' : '⚪';
      return `${typeEmoji} ${direction}$${amount} - ${t.type} ${statusEmoji}`;
    })
    .join('\n');

  return {
    color: COLORS.wallet,
    title: 'Transaction History',
    description: transactionList || 'No transactions yet.',
    footer: {
      text: `Showing ${Math.min(transactions.length, limit)} of ${transactions.length} transactions`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build topup instructions embed
 */
export function buildTopupInstructionsEmbed(params: {
  method: PaymentMethod;
  destination: string;
  amountCents: number;
  memoExpected?: string;
  qrCodeUrl?: string;
}): APIEmbed {
  const { method, destination, amountCents, memoExpected, qrCodeUrl } = params;
  const amount = amountCents / 100;

  const methodLabels: Record<PaymentMethod, string> = {
    paypal: 'PayPal',
    cashapp: 'Cash App',
    ltc: 'Litecoin',
    wallet: 'Wallet',
  };

  const fields: any[] = [
    {
      name: 'Amount',
      value: `$${amount.toFixed(2)}`,
      inline: true,
    },
    {
      name: 'Method',
      value: methodLabels[method],
      inline: true,
    },
    {
      name: 'Send To',
      value: destination,
      inline: false,
    },
  ];

  if (memoExpected) {
    fields.push({
      name: 'Required Memo/Note',
      value: memoExpected,
      inline: false,
    });
  }

  const embed: APIEmbed = {
    color: COLORS.wallet,
    title: 'Wallet Top-up Instructions',
    description: `Please send **$${amount.toFixed(2)}** using ${methodLabels[method]}.`,
    fields,
    footer: {
      text: 'NosMarket Wallet',
    },
    timestamp: new Date().toISOString(),
  };

  if (qrCodeUrl) {
    embed.image = {
      url: qrCodeUrl,
    };
  }

  return embed;
}
