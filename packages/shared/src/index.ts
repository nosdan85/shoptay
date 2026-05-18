// TypeScript types for Nos Market - Generated from Prisma schema
// Re-export Prisma client types and add custom types

export * from './constants';

// Re-export all Prisma types
export type {
  // User & Auth
  User,
  Session,
  // Catalog
  Game,
  Category,
  Product,
  // Orders
  Order,
  OrderItem,
  // Delivery
  DeliverySlot,
  // Wallet
  WalletTransaction,
  // Payments
  PaymentAttempt,
  // Delivery Proof
  DeliveryProof,
  DeliveryProofImage,
  // Tickets
  Ticket,
  TicketMessage,
  // Configuration
  ShopConfig,
  // Coupons
  Coupon,
  // Admin & Audit
  AdminLog,
  AuditLog,
  // Fraud
  FraudCase,
  // Notifications
  Notification,
  // Security
  Blacklist,
  ApiKey,
  // Webhooks
  WebhookLog,
  // Counters
  Counter,
} from '@prisma/client';

// Re-export enum types
export {
  // Order enums
  OrderStatus,
  PaymentStatus,
  // Ticket enums
  TicketStatus,
  // Wallet enums
  WalletTransactionType,
  WalletTransactionStatus,
  WalletTransactionDirection,
  // Payment enums
  PaymentMethod,
  PaymentAttemptStatus,
  // Delivery Proof enums
  DeliveryProofSource,
  // Ticket Type enums
  TicketType,
  // Notification enums
  NotificationType,
  // Blacklist enums
  BlacklistType,
  // Fraud enums
  FraudStatus,
  // Webhook enums
  WebhookStatus,
} from '@prisma/client';

// Re-export Zod schemas and types
export * from './schemas';
export * from './schemas/base.schemas';
export * from './schemas/product.schemas';
export * from './schemas/game.schemas';
export * from './schemas/category.schemas';

// Re-export wallet and admin types
export * from './types/wallet';

// ============================================================================
// CUSTOM TYPE AUGMENTATIONS
// ============================================================================

import type {
  User,
  Session,
  Game,
  Category,
  Product,
  Order,
  OrderItem,
  DeliverySlot,
  WalletTransaction,
  PaymentAttempt,
  DeliveryProof,
  DeliveryProofImage,
  Ticket,
  TicketMessage,
  ShopConfig,
  Coupon,
  AdminLog,
  AuditLog,
  FraudCase,
  Notification,
  Blacklist,
  ApiKey,
  WebhookLog,
  Counter,
  OrderStatus,
  PaymentStatus,
  TicketStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletTransactionDirection,
  PaymentMethod,
  PaymentAttemptStatus,
  DeliveryProofSource,
  TicketType,
  NotificationType,
  BlacklistType,
  FraudStatus,
  WebhookStatus,
} from '@prisma/client';

// ============================================================================
// PRISMA INCLUDE TYPES (for eager loading)
// ============================================================================

export interface UserWithSessions extends User {
  sessions: Session[];
}

export interface UserWithOrders extends User {
  orders: Order[];
}

export interface UserWithWalletTransactions extends User {
  walletTransactions: WalletTransaction[];
}

export interface UserWithNotifications extends User {
  notifications: Notification[];
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderWithDeliverySlot extends Order {
  deliverySlot: DeliverySlot | null;
}

export interface OrderWithDeliveryProof extends Order {
  deliveryProof: DeliveryProof | null;
}

export interface OrderWithPaymentAttempts extends Order {
  paymentAttempts: PaymentAttempt[];
}

export interface ProductWithCategory extends Product {
  category: Category;
}

export interface ProductWithGame extends Product {
  game: Game | null;
}

export interface ProductWithRelations extends Product {
  category: Category;
  game: Game | null;
}

export interface DeliveryProofWithImages extends DeliveryProof {
  images: DeliveryProofImage[];
}

export interface TicketWithMessages extends Ticket {
  messages: TicketMessage[];
}

export interface OrderFull extends Order {
  items: OrderItem[];
  deliverySlot: DeliverySlot | null;
  deliveryProof: DeliveryProof | null;
  paymentAttempts: PaymentAttempt[];
  user: User | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface SessionData {
  userId: string;
  discordId: string;
  discordUsername: string;
  isOwner: boolean;
  isStaff: boolean;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentInstructions {
  paypal_ff?: {
    email: string;
    memoExpected: string;
  };
  cashapp?: {
    handle: string;
    amount: number;
    conversionFee: number;
  };
  ltc?: {
    address: string;
    amount: number;
    qrImageUrl: string | null;
  };
  wallet?: {
    balance: number;
    sufficient: boolean;
  };
}

export interface PayPalWebhookEvent {
  event_type: string;
  create_time: string;
  resource_type: string;
  resource: {
    id: string;
    status?: string;
    amount?: {
      total: string;
      currency: string;
    };
    payer?: {
      email_address?: string;
      payer_id?: string;
    };
    purchase_units?: Array<{
      amount: {
        value: string;
        currency_code: string;
      };
    }>;
  };
}

export interface SquareWebhookEvent {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: {
      payment?: {
        id: string;
        status: string;
        amount_money: {
          amount: number;
          currency: string;
        };
        receipt_url: string;
      };
    };
  };
}

export interface NOWPaymentsWebhookEvent {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  pay_amount: string;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CART TYPES
// ============================================================================

export interface CartItem {
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    priceCents: number;
    bulkPriceCents: number | null;
    image: string;
    imageUrl: string | null;
    category: {
      name: string;
    };
  };
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
}

export interface CartPricing {
  subtotalCents: number;
  discountCents: number;
  discountPercent: number | null;
  totalCents: number;
  itemPricing: Map<string, ItemPricing>;
}

export interface ItemPricing {
  regularPriceCents: number;
  bulkPriceCents: number | null;
  quantity: number;
  regularUnits: number;
  bulkUnits: number;
  lineTotalCents: number;
  bulkApplied: boolean;
}

// ============================================================================
// CHECKOUT TYPES
// ============================================================================

export interface CheckoutFlowState {
  step: 'cart' | 'checkout' | 'payment' | 'link_accounts' | 'create_ticket';
  orderId?: string;
  paymentMethod?: PaymentMethod;
  deliverySlotId?: string;
  robloxLinked: boolean;
  ticketCreated: boolean;
  discordLinked: boolean;
}

export interface CheckoutResult {
  order: Order;
  sessionToken?: string;
  paymentInstructions?: PaymentInstructions;
}

// ============================================================================
// DELIVERY TYPES
// ============================================================================

export interface DeliverySlotDisplay {
  id: string;
  startAt: Date;
  endAt: Date;
  ownerTimezone: string;
  customerTimezone: string;
  ownerStartText: string;
  ownerEndText: string;
  customerStartText: string;
  customerEndText: string;
  dateLabel: string;
  note?: string;
}

export interface DeliveryConfirmationResult {
  confirmed: boolean;
  couponCode: string | null;
  message: string;
}

// ============================================================================
// ROBLOX TYPES
// ============================================================================

export interface RobloxUser {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface RobloxSearchResult {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

// ============================================================================
// DISCORD TYPES
// ============================================================================

export interface TicketChannelInfo {
  channelId: string;
  channelName: string;
  inviteUrl?: string;
}

export interface VouchPostResult {
  messageIds: string[];
  imageUrls: string[];
  imageHashes: string[];
}

// ============================================================================
// SHOP CONFIG TYPES
// ============================================================================

export interface ShopConfigValue {
  banners: Banner[];
  bestSellerIds: string[];
  homepageConfig?: Record<string, unknown>;
}

export interface Banner {
  url: string;
  alt?: string;
  link?: string;
}

// ============================================================================
// FRAUD TYPES
// ============================================================================

export interface FraudSignal {
  type: string;
  score: number;
  details: Record<string, unknown>;
}

export interface FraudAnalysisResult {
  score: number;
  signals: FraudSignal[];
  recommendReview: boolean;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminStats {
  revenueCents: number;
  totalOrders: number;
  totalUsers: number;
  pendingOrders: number;
  pendingPayments: number;
  recentOrders: Order[];
}

export interface AdminLogEntry {
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

export type RealtimeEvent =
  | { type: 'ORDER_CREATED'; order: Order }
  | { type: 'ORDER_PAID'; orderId: string }
  | { type: 'ORDER_DELIVERED'; orderId: string }
  | { type: 'PAYMENT_CONFIRMED'; orderId: string; method: PaymentMethod }
  | { type: 'STOCK_UPDATED'; productId: string; stock: number }
  | { type: 'PROOF_POSTED'; proof: DeliveryProof }
  | { type: 'TICKET_CREATED'; channelId: string }
  | { type: 'NOTIFICATION'; notification: Notification };

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

export type XOR<T, U> = T | U extends object
  ? (RequireAtLeastOne<T> & { [K in Exclude<keyof U, keyof T>]?: never }) |
    (RequireAtLeastOne<U> & { [K in Exclude<keyof T, keyof U>]?: never })
  : T | U;

// ============================================================================
// PRISMA CLIENT RE-EXPORT WITH DEFAULTS
// ============================================================================

// Re-export Prisma for convenience
export { PrismaClient } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export { prisma } from '@shared/prisma';

export { Decimal } from '@prisma/client/runtime/library';

// Default Prisma client instance getter
export function getPrismaClient(): PrismaClient {
  return new PrismaClient();
}
