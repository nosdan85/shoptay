import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================================================
// CORE ENUMS (as Zod schemas)
// ============================================================================

export const OrderStatusSchema = z.enum(['PENDING', 'WAITING_PAYMENT', 'COMPLETED', 'CANCELLED']);
export const PaymentStatusSchema = z.enum(['PENDING', 'PAID', 'CANCELLED']);
export const TicketStatusSchema = z.enum(['PENDING', 'CREATING', 'CREATED', 'READY', 'FAILED', 'PANEL', 'OPEN', 'CLOSED', 'ARCHIVED']);
export const WalletTransactionTypeSchema = z.enum(['TOPUP', 'PURCHASE', 'ADJUSTMENT', 'REFUND']);
export const WalletTransactionStatusSchema = z.enum(['PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED']);
export const WalletTransactionDirectionSchema = z.enum(['CREDIT', 'DEBIT']);
export const PaymentMethodSchema = z.enum(['PAYPAL_FF', 'CASHAPP', 'LTC', 'WALLET', 'PAYPAL_REST']);
export const PaymentAttemptStatusSchema = z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']);
export const DeliveryProofSourceSchema = z.enum(['AUTO_VOUCH']);
export const TicketTypeSchema = z.enum(['PAYMENT', 'DELIVERY', 'WALLET_TOPUP', 'SUPPORT']);
export const NotificationTypeSchema = z.enum(['ORDER_UPDATE', 'PAYMENT_CONFIRMED', 'DELIVERY_READY', 'VOUCH_POSTED', 'SYSTEM']);
export const BlacklistTypeSchema = z.enum(['IP', 'DISCORD_ID', 'EMAIL']);
export const FraudStatusSchema = z.enum(['OPEN', 'REVIEWED', 'CLEARED', 'FLAGGED']);
export const WebhookStatusSchema = z.enum(['RECEIVED', 'PROCESSED', 'FAILED']);

// ============================================================================
// PRIMITIVE SCHEMAS
// ============================================================================

export const CuidSchema = z.string().cuid();
export const DiscordIdSchema = z.string().min(17).max(20).regex(/^\d+$/);
export const EmailSchema = z.string().email().toLowerCase();
export const DiscordUsernameSchema = z.string().min(2).max(32);
export const RobloxUsernameSchema = z.string().min(2).max(20);
export const SlugSchema = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be lowercase alphanumeric with dashes');
export const OrderIdSchema = z.string().regex(/^ORD-[A-Z0-9]{5}$/, 'Must be format ORD-XXXXX');
export const TimezoneSchema = z.string().min(1).max(50);
export const CurrencyCodeSchema = z.string().length(3);

// ============================================================================
// MONEY SCHEMAS (cents)
// ============================================================================

export const CentsSchema = z.number().int().min(0);
export const PercentSchema = z.number().int().min(0).max(100);
export const PriceCentsSchema = z.number().int().positive();

// Convert cents to decimal dollars
export function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Convert decimal dollars to cents
export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100);
}

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserScopesSchema = z.array(z.string()).default([]);

export const UserCreateSchema = z.object({
  discordId: DiscordIdSchema,
  discordUsername: DiscordUsernameSchema,
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
  scopes: UserScopesSchema.optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial();

export const UserResponseSchema = z.object({
  id: CuidSchema,
  discordId: DiscordIdSchema,
  discordUsername: DiscordUsernameSchema,
  walletBalanceCents: CentsSchema,
  joinedAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export const SessionCreateSchema = z.object({
  userId: CuidSchema,
  discordSessionId: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  expiresAt: z.date(),
});

export const SessionResponseSchema = z.object({
  id: CuidSchema,
  userId: CuidSchema,
  expiresAt: z.date(),
  isRevoked: z.boolean(),
  createdAt: z.date(),
});

// ============================================================================
// GAME SCHEMAS
// ============================================================================

export const GameCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  icon: z.string().url().optional(),
  banner: z.string().url().optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const GameUpdateSchema = GameCreateSchema.partial();

export const GameResponseSchema = z.object({
  id: CuidSchema,
  name: z.string(),
  slug: SlugSchema,
  icon: z.string().nullable(),
  banner: z.string().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export const CategoryResponseSchema = z.object({
  id: CuidSchema,
  name: z.string(),
  slug: SlugSchema,
  icon: z.string().nullable(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const ProductCreateSchema = z.object({
  name: z.string().min(1).max(200),
  priceCents: PriceCentsSchema,
  originalPriceString: z.string().optional(),
  bulkPriceCents: PriceCentsSchema.optional(),
  bulkPriceString: z.string().optional(),
  image: z.string().min(1),
  imageUrl: z.string().url().optional(),
  description: z.string().max(5000).optional(),
  categoryId: CuidSchema,
  gameId: CuidSchema.optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  stock: z.number().int().min(-1).default(-1),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductResponseSchema = z.object({
  id: CuidSchema,
  name: z.string(),
  priceCents: PriceCentsSchema,
  originalPriceString: z.string().nullable(),
  bulkPriceCents: z.number().nullable(),
  bulkPriceString: z.string().nullable(),
  image: z.string(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  categoryId: CuidSchema,
  gameId: CuidSchema.nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  stock: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const ProductListQuerySchema = z.object({
  gameId: CuidSchema.optional(),
  categoryId: CuidSchema.optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'priceCents', 'sortOrder', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeInactive: z.boolean().default(false),
});

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const OrderItemCreateSchema = z.object({
  productId: CuidSchema.optional(),
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  price: PriceCentsSchema,
  lineTotal: PriceCentsSchema,
});

export const OrderCreateSchema = z.object({
  customerEmail: EmailSchema,
  items: z.array(OrderItemCreateSchema).min(1),
  couponCode: z.string().max(50).optional(),
  discordId: DiscordIdSchema.optional(),
  discordUsername: DiscordUsernameSchema.optional(),
});

export const OrderUpdateSchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  robloxUserId: z.string().optional(),
  robloxUsername: z.string().optional(),
  robloxDisplayName: z.string().optional(),
  robloxVerifiedAt: z.date().optional(),
});

export const OrderResponseSchema = z.object({
  id: CuidSchema,
  orderId: OrderIdSchema,
  customerEmail: EmailSchema,
  discordId: DiscordIdSchema.nullable(),
  discordUsername: DiscordUsernameSchema.nullable(),
  robloxUserId: z.string().nullable(),
  robloxUsername: z.string().nullable(),
  robloxDisplayName: z.string().nullable(),
  robloxVerifiedAt: z.date().nullable(),
  deliverySlotId: CuidSchema.nullable(),
  deliveryOwnerTimezone: TimezoneSchema.nullable(),
  deliveryOwnerStartAt: z.date().nullable(),
  deliveryOwnerEndAt: z.date().nullable(),
  deliveryCustomerTimezone: TimezoneSchema.nullable(),
  deliveryCustomerStartAt: z.date().nullable(),
  deliveryCustomerEndAt: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  confirmationRequestedAt: z.date().nullable(),
  confirmationRequestedBy: z.string().nullable(),
  confirmedAt: z.date().nullable(),
  confirmIp: z.string().nullable(),
  confirmUa: z.string().nullable(),
  confirmationDiscountCode: z.string().nullable(),
  subtotalAmount: CentsSchema,
  discountAmount: CentsSchema,
  discountPercent: PercentSchema.nullable(),
  couponCode: z.string().nullable(),
  total: CentsSchema,
  totalAmount: CentsSchema,
  status: OrderStatusSchema,
  paymentMethod: z.string().nullable(),
  paymentStatus: PaymentStatusSchema,
  memoExpected: z.string().nullable(),
  txnId: z.string().nullable(),
  paidAt: z.date().nullable(),
  manualPaymentNote: z.string().nullable(),
  manualPaymentConfirmedBy: z.string().nullable(),
  paypalOrderId: z.string().nullable(),
  channelId: z.string().nullable(),
  ticketStatus: TicketStatusSchema.nullable(),
  ticketError: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const OrderListQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  discordId: DiscordIdSchema.optional(),
  robloxUserId: z.string().optional(),
  search: z.string().max(200).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================================================
// CHECKOUT SCHEMAS
// ============================================================================

export const CheckoutItemSchema = z.object({
  productId: CuidSchema,
  quantity: z.number().int().positive(),
});

export const CheckoutRequestSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1),
  couponCode: z.string().max(50).optional(),
  customerEmail: EmailSchema.optional(), // Optional for logged-in users
});

export const CheckoutResponseSchema = z.object({
  order: OrderResponseSchema,
  sessionToken: z.string().optional(),
});

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const CreatePaymentRequestSchema = z.object({
  orderId: CuidSchema,
  method: PaymentMethodSchema,
});

export const PaymentInfoResponseSchema = z.object({
  order: OrderResponseSchema,
  paypalFf: z.object({
    email: z.string().email(),
    memoExpected: z.string(),
    amount: CentsSchema,
  }).nullable(),
  cashApp: z.object({
    handle: z.string(),
    amount: CentsSchema,
    conversionFee: CentsSchema,
  }).nullable(),
  ltc: z.object({
    address: z.string(),
    amount: CentsSchema,
    qrImageUrl: z.string().url().nullable(),
  }).nullable(),
  wallet: z.object({
    balance: CentsSchema,
    sufficient: z.boolean(),
  }).nullable(),
});

export const PaymentWebhookPayloadSchema = z.object({
  event_type: z.string(),
  resource: z.object({
    id: z.string(),
    status: z.string().optional(),
    amount: z.object({
      total: z.string(),
      currency: CurrencyCodeSchema,
    }).optional(),
    payer: z.object({
      email_address: z.string().email().optional(),
      payer_id: z.string().optional(),
    }).optional(),
    purchase_units: z.array(z.object({
      amount: z.object({
        value: z.string(),
        currency_code: CurrencyCodeSchema,
      }),
    })).optional(),
  }),
  create_time: z.string(),
  resource_type: z.string(),
});

// ============================================================================
// ROBLOX SCHEMAS
// ============================================================================

export const RobloxSearchResponseSchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().optional(),
});

export const LinkRobloxRequestSchema = z.object({
  robloxUserId: z.string(),
  robloxUsername: z.string(),
  robloxDisplayName: z.string(),
});

// ============================================================================
// DELIVERY SLOT SCHEMAS
// ============================================================================

export const DeliverySlotRangeSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  note: z.string().max(200).optional(),
});

export const DeliverySlotBulkCreateSchema = z.object({
  ownerTimezone: TimezoneSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  ranges: z.array(DeliverySlotRangeSchema).min(1),
});

export const DeliverySlotCreateSchema = z.object({
  startAt: z.date(),
  endAt: z.date(),
  ownerTimezone: TimezoneSchema,
  customerTimezone: TimezoneSchema.optional(),
  note: z.string().max(200).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const DeliverySlotUpdateSchema = z.object({
  startAt: z.date().optional(),
  endAt: z.date().optional(),
  ownerTimezone: TimezoneSchema.optional(),
  customerTimezone: TimezoneSchema.optional(),
  note: z.string().max(200).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const DeliverySlotResponseSchema = z.object({
  id: CuidSchema,
  startAt: z.date(),
  endAt: z.date(),
  ownerTimezone: TimezoneSchema,
  customerTimezone: TimezoneSchema.nullable(),
  note: z.string().nullable(),
  active: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SelectDeliverySlotSchema = z.object({
  slotId: CuidSchema,
  customerTimezone: TimezoneSchema,
});

// ============================================================================
// DELIVERY CONFIRMATION SCHEMAS
// ============================================================================

export const ConfirmDeliveryResponseSchema = z.object({
  confirmed: z.boolean(),
  couponCode: z.string().nullable(),
  message: z.string(),
});

// ============================================================================
// WALLET SCHEMAS
// ============================================================================

export const WalletTransactionCreateSchema = z.object({
  type: WalletTransactionTypeSchema,
  amountCents: PriceCentsSchema,
  method: PaymentMethodSchema.optional(),
  referenceCode: z.string().optional(),
  orderId: CuidSchema.optional(),
  paymentAddress: z.string().optional(),
  memoExpected: z.string().optional(),
  discordId: DiscordIdSchema.optional(),
  discordUsername: DiscordUsernameSchema.optional(),
});

export const WalletTransactionResponseSchema = z.object({
  id: CuidSchema,
  userId: CuidSchema,
  type: WalletTransactionTypeSchema,
  amountCents: CentsSchema,
  balanceBeforeCents: CentsSchema.nullable(),
  balanceAfterCents: CentsSchema.nullable(),
  method: z.string().nullable(),
  status: WalletTransactionStatusSchema,
  referenceCode: z.string().nullable(),
  orderId: CuidSchema.nullable(),
  paymentAddress: z.string().nullable(),
  memoExpected: z.string().nullable(),
  discordId: DiscordIdSchema.nullable(),
  discordUsername: DiscordUsernameSchema.nullable(),
  direction: WalletTransactionDirectionSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WalletBalanceResponseSchema = z.object({
  userId: CuidSchema,
  balanceCents: CentsSchema,
  pendingCents: CentsSchema,
  transactions: z.array(WalletTransactionResponseSchema),
});

export const WalletTopupCreateSchema = z.object({
  method: PaymentMethodSchema,
  amountCents: PriceCentsSchema,
});

export const WalletTopupResponseSchema = z.object({
  topupId: CuidSchema,
  method: PaymentMethodSchema,
  amountCents: CentsSchema,
  status: WalletTransactionStatusSchema,
  referenceCode: z.string(),
  instructions: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('paypal_ff'),
      destination: z.string().email(),
      memoExpected: z.string(),
    }),
    z.object({
      type: z.literal('cashapp'),
      square: z.object({
        applicationId: z.string(),
        locationId: z.string(),
        environment: z.enum(['sandbox', 'production']),
      }),
      referenceId: z.string(),
    }),
    z.object({
      type: z.literal('ltc'),
      address: z.string(),
      amount: CentsSchema,
      currency: z.literal('LTC'),
      qrImageUrl: z.string().url().nullable(),
    }),
  ]),
});

export const SquarePaymentCompleteSchema = z.object({
  sourceId: z.string(),
});

// ============================================================================
// COUPON SCHEMAS
// ============================================================================

export const CouponCreateSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().int().positive(),
  minOrderCents: CentsSchema.optional(),
  maxDiscountCents: CentsSchema.optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
});

export const CouponUpdateSchema = CouponCreateSchema.partial();

export const CouponResponseSchema = z.object({
  id: CuidSchema,
  code: z.string(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: CentsSchema,
  minOrderCents: CentsSchema.nullable(),
  maxDiscountCents: CentsSchema.nullable(),
  maxUses: z.number().nullable(),
  usedCount: z.number(),
  expiresAt: z.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CouponValidateSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase(),
  orderAmountCents: CentsSchema,
});

export const CouponValidateResponseSchema = z.object({
  valid: z.boolean(),
  discountAmountCents: CentsSchema.nullable(),
  discountPercent: PercentSchema.nullable(),
  message: z.string().optional(),
  coupon: CouponResponseSchema.nullable(),
});

// ============================================================================
// TICKET SCHEMAS
// ============================================================================

export const TicketCreateSchema = z.object({
  orderId: CuidSchema,
  type: TicketTypeSchema,
});

export const TicketResponseSchema = z.object({
  channelId: z.string(),
  guildId: z.string(),
  discordId: DiscordIdSchema,
  discordUsername: DiscordUsernameSchema,
  orderId: CuidSchema.nullable(),
  topupId: CuidSchema.nullable(),
  type: TicketTypeSchema,
  status: TicketStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  closedAt: z.date().nullable(),
});

export const TicketMessageCreateSchema = z.object({
  content: z.string().min(1).max(2000),
  attachments: z.array(z.string()).max(10).optional(),
});

export const TicketMessageResponseSchema = z.object({
  id: CuidSchema,
  ticketId: z.string(),
  discordId: DiscordIdSchema,
  discordUsername: DiscordUsernameSchema,
  content: z.string(),
  isStaff: z.boolean(),
  attachments: z.array(z.string()),
  createdAt: z.date(),
});

// ============================================================================
// DELIVERY PROOF SCHEMAS
// ============================================================================

export const DeliveryProofItemSchema = z.object({
  name: z.string(),
  packQuantity: z.number().int().positive().optional(),
  deliveredLabel: z.string().optional(),
  lineTotal: CentsSchema,
});

export const DeliveryProofCreateSchema = z.object({
  orderId: CuidSchema,
  discordId: DiscordIdSchema.optional(),
  discordUsername: DiscordUsernameSchema.optional(),
  totalAmount: CentsSchema,
  items: z.array(DeliveryProofItemSchema),
  imageUrls: z.array(z.string().url()),
  imageHashes: z.array(z.string()).optional(),
  vouchMessageIds: z.array(z.string()).optional(),
  source: DeliveryProofSourceSchema.default('AUTO_VOUCH'),
});

export const DeliveryProofResponseSchema = z.object({
  id: CuidSchema,
  orderId: CuidSchema,
  discordId: DiscordIdSchema.nullable(),
  discordUsername: DiscordUsernameSchema.nullable(),
  totalAmount: CentsSchema,
  items: z.array(DeliveryProofItemSchema),
  imageUrls: z.array(z.string()),
  imageHashes: z.array(z.string()),
  vouchMessageIds: z.array(z.string()),
  source: DeliveryProofSourceSchema,
  createdAt: z.date(),
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationCreateSchema = z.object({
  userId: CuidSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  data: z.record(z.unknown()).optional(),
});

export const NotificationResponseSchema = z.object({
  id: CuidSchema,
  userId: CuidSchema,
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
});

// ============================================================================
// FRAUD SCHEMAS
// ============================================================================

export const FraudCaseResponseSchema = z.object({
  id: CuidSchema,
  orderId: CuidSchema,
  score: z.number().int().min(0).max(100),
  signals: z.record(z.unknown()),
  status: FraudStatusSchema,
  reviewedBy: z.string().nullable(),
  reviewedAt: z.date().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});

export const FraudCaseReviewSchema = z.object({
  status: FraudStatusSchema,
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// ADMIN LOG SCHEMAS
// ============================================================================

export const AdminLogCreateSchema = z.object({
  adminId: z.string(),
  adminUsername: z.string(),
  action: z.string(),
  target: z.string(),
  targetId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
});

export const AdminLogResponseSchema = z.object({
  id: CuidSchema,
  adminId: z.string(),
  adminUsername: z.string(),
  action: z.string(),
  target: z.string(),
  targetId: z.string().nullable(),
  details: z.record(z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.date(),
});

// ============================================================================
// AUDIT LOG SCHEMAS
// ============================================================================

export const AuditLogCreateSchema = z.object({
  userId: z.string().optional(),
  userType: z.enum(['admin', 'user', 'system', 'bot']).optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  changes: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
});

export const AuditLogResponseSchema = z.object({
  id: CuidSchema,
  userId: z.string().nullable(),
  userType: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  changes: z.record(z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.date(),
});

// ============================================================================
// BLACKLIST SCHEMAS
// ============================================================================

export const BlacklistCreateSchema = z.object({
  ipAddress: z.string().ip().optional(),
  discordId: DiscordIdSchema.optional(),
  type: BlacklistTypeSchema,
  reason: z.string().min(1).max(500),
  expiresAt: z.date().optional(),
});

export const BlacklistResponseSchema = z.object({
  id: CuidSchema,
  ipAddress: z.string().nullable(),
  discordId: DiscordIdSchema.nullable(),
  type: BlacklistTypeSchema,
  reason: z.string(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  createdBy: z.string(),
});

// ============================================================================
// API KEY SCHEMAS
// ============================================================================

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  userId: CuidSchema.optional(),
  permissions: z.array(z.string()).default([]),
  expiresAt: z.date().optional(),
});

export const ApiKeyResponseSchema = z.object({
  id: CuidSchema,
  name: z.string(),
  userId: CuidSchema.nullable(),
  permissions: z.array(z.string()),
  lastUsedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  // Note: key itself is only returned once on creation
  key: z.string().optional(),
});

// ============================================================================
// WEBHOOK LOG SCHEMAS
// ============================================================================

export const WebhookLogCreateSchema = z.object({
  provider: z.string().min(1).max(50),
  eventType: z.string().min(1).max(100),
  payload: z.string(),
  signature: z.string().optional(),
});

export const WebhookLogResponseSchema = z.object({
  id: CuidSchema,
  provider: z.string(),
  eventType: z.string(),
  payload: z.string(),
  signature: z.string().nullable(),
  status: WebhookStatusSchema,
  errorMessage: z.string().nullable(),
  processedAt: z.date().nullable(),
  createdAt: z.date(),
});

// ============================================================================
// SHOP CONFIG SCHEMAS
// ============================================================================

export const ShopConfigUpdateSchema = z.object({
  banners: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    link: z.string().url().optional(),
  })).optional(),
  bestSellerIds: z.array(CuidSchema).optional(),
  homepageConfig: z.record(z.unknown()).optional(),
});

// ============================================================================
// PAGINATION & LIST SCHEMAS
// ============================================================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const PaginationResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasMore: z.boolean(),
    }),
  });

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) => z.union([ApiSuccessResponseSchema(dataSchema), ApiErrorResponseSchema]);

// ============================================================================
// CART SCHEMAS
// ============================================================================

export const CartItemSchema = z.object({
  productId: CuidSchema,
  quantity: z.number().int().positive().max(100000),
});

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  couponCode: z.string().max(50).optional(),
});

// ============================================================================
// CHECKOUT FLOW SCHEMAS
// ============================================================================

export const CheckoutStepSchema = z.enum(['cart', 'checkout', 'payment', 'link_accounts', 'create_ticket']);

export const CheckoutStateSchema = z.object({
  step: CheckoutStepSchema,
  orderId: CuidSchema.optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  deliverySlotId: CuidSchema.optional(),
  robloxLinked: z.boolean().default(false),
  ticketCreated: z.boolean().default(false),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type WalletTransactionType = z.infer<typeof WalletTransactionTypeSchema>;
export type WalletTransactionStatus = z.infer<typeof WalletTransactionStatusSchema>;
export type WalletTransactionDirection = z.infer<typeof WalletTransactionDirectionSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type PaymentAttemptStatus = z.infer<typeof PaymentAttemptStatusSchema>;
export type DeliveryProofSource = z.infer<typeof DeliveryProofSourceSchema>;
export type TicketType = z.infer<typeof TicketTypeSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type BlacklistType = z.infer<typeof BlacklistTypeSchema>;
export type FraudStatus = z.infer<typeof FraudStatusSchema>;
export type WebhookStatus = z.infer<typeof WebhookStatusSchema>;

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;

export type SessionCreate = z.infer<typeof SessionCreateSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export type GameCreate = z.infer<typeof GameCreateSchema>;
export type GameUpdate = z.infer<typeof GameUpdateSchema>;
export type GameResponse = z.infer<typeof GameResponseSchema>;

export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;

export type CheckoutItem = z.infer<typeof CheckoutItemSchema>;
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
export type PaymentInfoResponse = z.infer<typeof PaymentInfoResponseSchema>;
export type PaymentWebhookPayload = z.infer<typeof PaymentWebhookPayloadSchema>;

export type RobloxSearchResponse = z.infer<typeof RobloxSearchResponseSchema>;
export type LinkRobloxRequest = z.infer<typeof LinkRobloxRequestSchema>;

export type DeliverySlotRange = z.infer<typeof DeliverySlotRangeSchema>;
export type DeliverySlotBulkCreate = z.infer<typeof DeliverySlotBulkCreateSchema>;
export type DeliverySlotCreate = z.infer<typeof DeliverySlotCreateSchema>;
export type DeliverySlotUpdate = z.infer<typeof DeliverySlotUpdateSchema>;
export type DeliverySlotResponse = z.infer<typeof DeliverySlotResponseSchema>;
export type SelectDeliverySlot = z.infer<typeof SelectDeliverySlotSchema>;

export type ConfirmDeliveryResponse = z.infer<typeof ConfirmDeliveryResponseSchema>;

export type WalletTransactionCreate = z.infer<typeof WalletTransactionCreateSchema>;
export type WalletTransactionResponse = z.infer<typeof WalletTransactionResponseSchema>;
export type WalletBalanceResponse = z.infer<typeof WalletBalanceResponseSchema>;
export type WalletTopupCreate = z.infer<typeof WalletTopupCreateSchema>;
export type WalletTopupResponse = z.infer<typeof WalletTopupResponseSchema>;
export type SquarePaymentComplete = z.infer<typeof SquarePaymentCompleteSchema>;

export type CouponCreate = z.infer<typeof CouponCreateSchema>;
export type CouponUpdate = z.infer<typeof CouponUpdateSchema>;
export type CouponResponse = z.infer<typeof CouponResponseSchema>;
export type CouponValidate = z.infer<typeof CouponValidateSchema>;
export type CouponValidateResponse = z.infer<typeof CouponValidateResponseSchema>;

export type TicketCreate = z.infer<typeof TicketCreateSchema>;
export type TicketResponse = z.infer<typeof TicketResponseSchema>;
export type TicketMessageCreate = z.infer<typeof TicketMessageCreateSchema>;
export type TicketMessageResponse = z.infer<typeof TicketMessageResponseSchema>;

export type DeliveryProofItem = z.infer<typeof DeliveryProofItemSchema>;
export type DeliveryProofCreate = z.infer<typeof DeliveryProofCreateSchema>;
export type DeliveryProofResponse = z.infer<typeof DeliveryProofResponseSchema>;

export type NotificationCreate = z.infer<typeof NotificationCreateSchema>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

export type FraudCaseResponse = z.infer<typeof FraudCaseResponseSchema>;
export type FraudCaseReview = z.infer<typeof FraudCaseReviewSchema>;

export type AdminLogCreate = z.infer<typeof AdminLogCreateSchema>;
export type AdminLogResponse = z.infer<typeof AdminLogResponseSchema>;

export type AuditLogCreate = z.infer<typeof AuditLogCreateSchema>;
export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;

export type BlacklistCreate = z.infer<typeof BlacklistCreateSchema>;
export type BlacklistResponse = z.infer<typeof BlacklistResponseSchema>;

export type ApiKeyCreate = z.infer<typeof ApiKeyCreateSchema>;
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

export type WebhookLogCreate = z.infer<typeof WebhookLogCreateSchema>;
export type WebhookLogResponse = z.infer<typeof WebhookLogResponseSchema>;

export type ShopConfigUpdate = z.infer<typeof ShopConfigUpdateSchema>;

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

export type CheckoutStep = z.infer<typeof CheckoutStepSchema>;
export type CheckoutState = z.infer<typeof CheckoutStateSchema>;

// ============================================================================
// PRODUCT/SHOP SCHEMAS (catalog management)
// ============================================================================

export const ProductImageResponseSchema = z.object({
  id: CuidSchema,
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
  isPrimary: z.boolean(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const ProductResponseSchema = z.object({
  id: CuidSchema,
  gameId: CuidSchema,
  categoryId: CuidSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  price: z.string(),
  originalPriceString: z.string().nullable(),
  bulkPriceCents: z.number().nullable(),
  bulkPriceString: z.string().nullable(),
  stock: z.number(),
  maxPerOrder: z.number(),
  image: z.string(),
  imageUrls: z.array(z.string()),
  images: z.array(ProductImageResponseSchema),
  isActive: z.boolean(),
  isDigital: z.boolean(),
  deliveryInfo: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const ProductListQuerySchema = z.object({
  gameId: CuidSchema.optional(),
  categoryId: CuidSchema.optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'price', 'sortOrder', 'createdAt', 'stock']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeInactive: z.boolean().default(false),
  inStock: z.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export const ProductCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  price: z.number().positive(),
  originalPriceString: z.string().optional(),
  bulkPriceCents: z.number().int().min(0).optional(),
  bulkPriceString: z.string().optional(),
  image: z.string().min(1).default(''),
  imageUrls: z.array(z.string()).optional(),
  stock: z.number().int().min(0).default(0),
  maxPerOrder: z.number().int().min(1).default(99),
  categoryId: CuidSchema,
  gameId: CuidSchema.optional(),
  isActive: z.boolean().default(true),
  isDigital: z.boolean().default(false),
  deliveryInfo: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductStockUpdateSchema = z.object({
  delta: z.number().int(),
});

export const ProductBulkStockUpdateSchema = z.object({
  updates: z.array(z.object({
    id: CuidSchema,
    delta: z.number().int(),
  })),
});

export const ProductSearchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

export const GameResponseSchema = z.object({
  id: CuidSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  iconUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GameCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().max(1000).optional(),
  iconUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const GameUpdateSchema = GameCreateSchema.partial();

export const GameReorderSchema = z.object({
  newSortOrder: z.number().int().min(0),
});

export const GameListQuerySchema = z.object({
  includeInactive: z.boolean().default(false),
});

export type GameResponse = z.infer<typeof GameResponseSchema>;
export type GameCreate = z.infer<typeof GameCreateSchema>;
export type GameUpdate = z.infer<typeof GameUpdateSchema>;

export const CategoryResponseSchema = z.object({
  id: CuidSchema,
  gameId: CuidSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  iconUrl: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().max(500).optional(),
  iconUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export const CategoryReorderSchema = z.object({
  newSortOrder: z.number().int().min(0),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
