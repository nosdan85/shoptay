import axios from 'axios';
import { Logger } from 'pino';
import {
  APIEmbed,
  MessageCreateOptions,
} from 'discord.js';
import { config } from '../config';
import { COLORS } from '../config/constants';
import {
  PaymentMethod,
  OrderItem,
  PaymentTicketParams,
  DeliveryTicketParams,
  WalletTicketParams,
  WalletTopupParams,
  VouchParams,
  ThankYouDMParams,
} from '../types';

export class EmbedService {
  constructor(private readonly log: Logger) {}

  paymentTicket(params: PaymentTicketParams): APIEmbed {
    const { orderId, method, buyer, ownerRole, total, email, items, memoExpected, cashAppTag, ltcAddress, ltcAmount } = params;

    const methodLabel = this.getPaymentMethodLabel(method, email, cashAppTag, ltcAddress, ltcAmount);
    const color = this.getMethodColor(method);

    const embed: APIEmbed = {
      color,
      title: `${this.getMethodName(method)} Payment`,
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
          value: methodLabel,
          inline: false,
        },
        {
          name: 'Items',
          value: this.formatItems(items),
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

    if (memoExpected && method === 'paypal') {
      embed.fields?.push({
        name: 'Important Note',
        value: `PayPal Note: **${memoExpected}**`,
        inline: false,
      });
    }

    if (ownerRole) {
      const ownerField = embed.fields?.find(f => f.name === 'Buyer');
      if (ownerField) {
        ownerField.value = `${buyer}\nNote: Ping ${ownerRole} after payment`;
      }
    }

    return embed;
  }

  deliveryTicket(params: DeliveryTicketParams): APIEmbed {
    const { orderId, robloxAccount, robloxUserId, discordAccount, discordUserId, total, items, ownerTime, customerTime } = params;

    const robloxDisplay = robloxUserId ? `${robloxAccount} (${robloxUserId})` : robloxAccount;
    const discordDisplay = discordUserId ? `<@${discordUserId}>` : discordAccount;

    return {
      color: COLORS.delivery,
      title: 'Order Delivery',
      description: `Hello ${discordAccount}. Your order is ready for delivery!`,
      fields: [
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
          value: this.formatItems(items),
          inline: false,
        },
        {
          name: 'Owner Delivery Time',
          value: ownerTime,
          inline: false,
        },
        {
          name: 'Your Selected Time',
          value: customerTime,
          inline: false,
        },
      ],
      footer: {
        text: `NosMarket | Order ${orderId}`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  walletTicket(params: WalletTicketParams): APIEmbed {
    const { orderId, discordAccount, discordUserId, amount, method, reference } = params;

    const discordDisplay = discordUserId ? `<@${discordUserId}>` : discordAccount;
    const methodLabel = this.getMethodLabel(method);

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
          value: 'Paid with NosMarket wallet',
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

  walletTopup(params: WalletTopupParams): APIEmbed {
    const { discordId, username, amountCents, method, reference, memo } = params;

    const amount = amountCents / 100;
    const methodLabel = this.getMethodLabel(method);
    const discordDisplay = `<@${discordId}>`;

    return {
      color: COLORS.wallet,
      title: 'Wallet Top-up Pending',
      fields: [
        {
          name: 'Customer',
          value: discordDisplay,
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
          value: methodLabel,
          inline: true,
        },
        {
          name: 'Reference',
          value: reference,
          inline: false,
        },
      ],
      footer: {
        text: 'NosMarket | Wallet Top-up',
      },
      timestamp: new Date().toISOString(),
    };
  }

  error(message: string): APIEmbed {
    return {
      color: COLORS.error,
      title: 'Error',
      description: message,
      timestamp: new Date().toISOString(),
    };
  }

  success(message: string): APIEmbed {
    return {
      color: COLORS.success,
      title: 'Success',
      description: message,
      timestamp: new Date().toISOString(),
    };
  }

  info(message: string): APIEmbed {
    return {
      color: COLORS.info,
      title: 'Info',
      description: message,
      timestamp: new Date().toISOString(),
    };
  }

  private getMethodColor(method: PaymentMethod): number {
    switch (method) {
      case 'paypal':
        return COLORS.paypal;
      case 'ltc':
        return COLORS.ltc;
      case 'cashapp':
        return COLORS.paypal; // Same as PayPal
      case 'wallet':
        return COLORS.wallet;
      default:
        return COLORS.info;
    }
  }

  private getMethodName(method: PaymentMethod): string {
    switch (method) {
      case 'paypal':
        return 'PayPal';
      case 'ltc':
        return 'Litecoin';
      case 'cashapp':
        return 'Cash App';
      case 'wallet':
        return 'Wallet';
      default:
        return 'Payment';
    }
  }

  private getPaymentMethodLabel(
    method: PaymentMethod,
    email?: string,
    cashAppTag?: string,
    ltcAddress?: string,
    ltcAmount?: number
  ): string {
    switch (method) {
      case 'paypal':
        return `$${0.00.toFixed(2)} to ${email || 'email'} (Friends & Family)`;
      case 'cashapp':
        return `Send to ${cashAppTag || '$cashapp'}`;
      case 'ltc':
        return `$${ltcAmount?.toFixed(2) || '0.00'} equivalent LTC to ${ltcAddress || 'address'}`;
      case 'wallet':
        return 'Paid with NosMarket Wallet';
      default:
        return 'Unknown payment method';
    }
  }

  private getMethodLabel(method: PaymentMethod): string {
    switch (method) {
      case 'paypal':
        return 'PayPal F&F';
      case 'cashapp':
        return 'Cash App Pay';
      case 'ltc':
        return 'Litecoin';
      case 'wallet':
        return 'Wallet';
      default:
        return method;
    }
  }

  private formatItems(items: OrderItem[]): string {
    return items
      .map(item => `• ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
      .join('\n');
  }
}
