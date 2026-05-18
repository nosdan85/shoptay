import { APIEmbed, MessageCreateOptions } from 'discord.js';

// Payment method types
export type PaymentMethod = 'paypal' | 'cashapp' | 'ltc' | 'wallet';

// Ticket type
export type TicketType = 'payment' | 'support' | 'other';

// Order status
export type OrderStatus = 'Pending' | 'Waiting Payment' | 'Completed' | 'Cancelled';

// Payment status
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

// Ticket status
export type TicketStatus = 'pending' | 'creating' | 'created' | 'ready' | 'failed' | 'panel';

// Transaction type
export type TransactionType = 'topup' | 'purchase' | 'adjustment';

// Transaction status
export type TransactionStatus = 'pending' | 'completed' | 'rejected' | 'cancelled';

// Transaction direction
export type TransactionDirection = 'credit' | 'debit';

// Proof source
export type ProofSource = 'auto_vouch';

// Order interface
export interface Order {
  orderId: string;
  customerEmail?: string;
  discordId?: string;
  discordUsername?: string;
  robloxUserId?: string;
  robloxUsername?: string;
  robloxDisplayName?: string;
  deliverySlotId?: string;
  deliveryOwnerTimezone?: string;
  deliveryOwnerStartAt?: Date;
  deliveryOwnerEndAt?: Date;
  deliveryCustomerTimezone?: string;
  deliveryCustomerStartAt?: Date;
  deliveryCustomerEndAt?: Date;
  deliveredAt?: Date;
  confirmationRequestedAt?: Date;
  confirmedAt?: Date;
  items: OrderItem[];
  subtotalAmount: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  memoExpected?: string;
  txnId?: string;
  channelId?: string;
  ticketStatus: TicketStatus;
}

// Order item
export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// User interface
export interface User {
  discordId: string;
  discordUsername: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  walletBalanceCents: number;
}

// Wallet topup
export interface WalletTopup {
  id: string;
  discordId: string;
  discordUsername?: string;
  amountCents: number;
  method: PaymentMethod;
  status: TransactionStatus;
  referenceCode: string;
  destination?: string;
  memoExpected?: string;
  createdAt: Date;
}

// Vouch data
export interface VouchData {
  discordId: string;
  discordUsername: string;
  items: string[];
  total: number;
}

// Proof data
export interface ProofData {
  orderId: string;
  discordId: string;
  discordUsername: string;
  totalAmount: number;
  items: ProofItem[];
  imageUrls: string[];
}

// Proof item
export interface ProofItem {
  name: string;
  packQuantity: number;
  deliveredLabel: string;
  lineTotal: number;
}

// Discord bot error
export class DiscordBotError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly data?: unknown,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'DiscordBotError';
  }
}

// API response types
export interface OrderPaymentInfo {
  orderId: string;
  discordId?: string;
  discordUsername?: string;
  customerEmail?: string;
  total: number;
  items: OrderItem[];
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  channelId?: string;
  ticketStatus: TicketStatus;
  memoExpected?: string;
  paypalEmail?: string;
  cashAppTag?: string;
  ltcAddress?: string;
  robloxUsername?: string;
  deliverySlotId?: string;
}

export interface WalletInfo {
  balanceCents: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amountCents: number;
  balanceBeforeCents: number;
  balanceAfterCents: number;
  status: TransactionStatus;
  referenceCode?: string;
  orderId?: string;
  method?: PaymentMethod;
  createdAt: Date;
}

// Embed builders
export interface EmbedBuilders {
  paymentTicket(params: PaymentTicketParams): APIEmbed;
  deliveryTicket(params: DeliveryTicketParams): APIEmbed;
  walletTicket(params: WalletTicketParams): APIEmbed;
  walletTopup(params: WalletTopupParams): APIEmbed;
  vouch(params: VouchParams): string;
  thankYouDM(params: ThankYouDMParams): MessageCreateOptions;
  error(message: string): APIEmbed;
  success(message: string): APIEmbed;
  info(message: string): APIEmbed;
}

export interface PaymentTicketParams {
  orderId: string;
  method: PaymentMethod;
  buyer: string;
  ownerRole?: string;
  total: number;
  email?: string;
  items: OrderItem[];
  memoExpected?: string;
  cashAppTag?: string;
  ltcAddress?: string;
  ltcAmount?: number;
}

export interface DeliveryTicketParams {
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
}

export interface WalletTicketParams {
  orderId: string;
  discordAccount: string;
  discordUserId?: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
}

export interface WalletTopupParams {
  discordId: string;
  username: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string;
  memo?: string;
}

export interface VouchParams {
  discordId: string;
  discordUsername: string;
  items: string[];
  total: number;
}

export interface ThankYouDMParams {
  items: string[];
}

// AddAll result
export interface AddAllResult {
  added: number;
  alreadyIn: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// Logger type - imported from pino in services
export type Logger = import('pino').Logger<import('pino').Level>;
