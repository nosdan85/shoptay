// User types
export interface User {
  id: string;
  discordId: string;
  discordUsername: string;
  username?: string;
  email?: string;
  avatar?: string;
  role?: string;
  isOwner?: boolean;
}

// Game types
export interface Game {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  banner?: string;
  description?: string;
  isActive: boolean;
}

// Product types
export type ProductCategory = "Chest" | "Reroll" | "Shard" | "Seal" | "Relic" | "Sets" | "Combo" | "Other";

export interface Product {
  _id: string;
  name: string;
  price: number; // in cents
  originalPriceString?: string;
  bulkPrice?: number; // in cents
  bulkPriceString?: string;
  image: string;
  desc?: string;
  category: ProductCategory;
  gameId?: string;
  game?: Game;
}

// Cart types
export interface CartItemPricing {
  regularPrice: number;
  bulkPrice: number;
  regularUnits: number;
  bulkUnits: number;
  lineTotal: number;
  bulkApplied: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  pricing: CartItemPricing;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  discountAmount: number; // in cents
}

// Order types
export type OrderStatus = "Pending" | "Waiting Payment" | "Completed" | "Cancelled";
export type PaymentStatus = "pending" | "paid" | "cancelled";
export type TicketStatus = "pending" | "creating" | "created" | "ready" | "failed" | "panel";

export interface OrderItem {
  product: string | Product;
  name: string;
  quantity: number;
  price: number; // in cents
}

export interface DeliverySlot {
  _id: string;
  startAt: string;
  endAt: string;
  ownerTimezone: string;
  customerTimezone?: string;
  note?: string;
  active: boolean;
}

export interface Order {
  _id: string;
  orderId: string;
  customerEmail?: string;
  discordId?: string;
  discordUsername?: string;
  robloxUserId?: string;
  robloxUsername?: string;
  robloxDisplayName?: string;
  deliverySlotId?: string;
  deliveryOwnerTimezone?: string;
  deliveryOwnerStartAt?: string;
  deliveryOwnerEndAt?: string;
  deliveryCustomerTimezone?: string;
  deliveryCustomerStartAt?: string;
  deliveryCustomerEndAt?: string;
  deliveredAt?: string;
  confirmationRequestedAt?: string;
  confirmedAt?: string;
  confirmIp?: string;
  confirmUa?: string;
  confirmationDiscountCode?: string;
  items: OrderItem[];
  subtotalAmount: number;
  discountAmount: number;
  discountPercent: number;
  couponCode?: string;
  total: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  memoExpected?: string;
  txnId?: string;
  paidAt?: string;
  channelId?: string;
  ticketStatus?: TicketStatus;
  createdAt: string;
}

// Wallet types
export type TransactionType = "topup" | "purchase" | "adjustment";
export type TransactionStatus = "pending" | "completed" | "rejected" | "cancelled";
export type TransactionDirection = "credit" | "debit";

export interface WalletTransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amountCents: number;
  balanceBeforeCents: number;
  balanceAfterCents: number;
  method?: string;
  status: TransactionStatus;
  referenceCode?: string;
  orderId?: string;
  paymentAddress?: string;
  memoExpected?: string;
  discordId?: string;
  discordUsername?: string;
  direction: TransactionDirection;
  createdAt: string;
}

export interface Wallet {
  balanceCents: number;
  transactions: WalletTransaction[];
}

// Proof types
export interface ProofItem {
  name: string;
  packQuantity?: number;
  deliveredLabel: string;
  lineTotal: number;
}

export interface Proof {
  id: string;
  orderId: string;
  discordId?: string;
  discordUsername?: string;
  totalAmount: number;
  items: ProofItem[];
  imageUrls: string[];
  source: "auto_vouch" | "manual" | "admin";
  vouchMessageId?: string;
  createdAt: string;
}

// Legacy alias for backward compatibility
export type LegacyProof = Proof & { _id?: string };
function toLegacyProof(proof: Proof): LegacyProof {
  return { ...proof, _id: proof.id };
}

// Shop config types
export interface ShopConfig {
  banners: string[];
  bestSellerIds: string[];
  featuredProductIds?: string[];
  ownerRoleId?: string;
  ticketCategoryId?: string;
}

// Recent purchase for ticker
export interface RecentPurchase {
  discordUsername: string;
  productName: string;
  quantity: number;
}

// Payment types
export type PaymentMethod = "paypal_ff" | "cashapp" | "ltc" | "wallet";
export type PaymentAttemptStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface PaymentAttempt {
  id: string;
  orderId?: string;
  userId?: string;
  method: PaymentMethod;
  status: PaymentAttemptStatus;
  amountCents?: number;
  currency?: string;
  providerReference?: string;
  memoExpected?: string;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
}

export interface PayPalFFData {
  destination: string;
  memoExpected: string;
  channelId?: string;
}

export interface CashAppData {
  handle: string;
  amount: number;
}

export interface LTCData {
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  qrImageUrl?: string;
}

export interface TopupInstructions {
  paypal_ff?: {
    destination: string;
    memoExpected: string;
  };
  cashapp?: {
    square: {
      applicationId: string;
      locationId: string;
      environment: string;
    };
    referenceId: string;
  };
  ltc?: {
    payAddress: string;
    payAmount: number;
    payCurrency: string;
    qrImageUrl?: string;
  };
}

// Roblox types
export interface RobloxUser {
  robloxUsername: string;
  robloxUserId: string;
  robloxDisplayName: string;
}

// Admin types
export interface AdminStats {
  revenue: number;
  orders: number;
  users: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CheckoutResponse {
  orderId: string;
  order: Order;
}

export interface OrderPaymentInfo {
  order: Order;
  isPaid: boolean;
  channelId?: string;
  ticketStatus?: TicketStatus;
}

// Country timezone mapping
export const COUNTRY_TIMEZONES: Record<string, string> = {
  US: "America/New_York",
  CA: "America/Toronto",
  UK: "Europe/London",
  AU: "Australia/Sydney",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  JP: "Asia/Tokyo",
  SG: "Asia/Singapore",
  HK: "Asia/Hong_Kong",
  BR: "America/Sao_Paulo",
  MX: "America/Mexico_City",
  OTHER: "UTC",
};
