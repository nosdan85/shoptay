// Constants for Nos Market - Gaming Marketplace

// ============================================================================
// DISCOUNT & PRICING
// ============================================================================

/** Minimum quantity before bulk pricing kicks in */
export const BULK_DISCOUNT_THRESHOLD = 10;

/** Maximum quantity a user can select for a single product */
export const MAX_UI_QUANTITY = 100000;

/** Minimum price per item in cents ($1.00) */
export const MIN_ITEM_PRICE_CENTS = 100;

/** Maximum discount percentage for any coupon */
export const MAX_DISCOUNT_PERCENT = 100;

/** Default confirmation discount percentage for next order (5%) */
export const CONFIRMATION_DISCOUNT_PERCENT = 5;

/** Cash App conversion fee percentage (10%) */
export const CASHAPP_CONVERSION_FEE_PERCENT = 10;

// ============================================================================
// TIME & TIMEOUTS
// ============================================================================

/** Session expiration in seconds (7 days) */
export const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

/** Token expiry buffer in seconds (60 seconds) */
export const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

/** Link token expiration in seconds (1 hour) */
export const LINK_TOKEN_EXPIRY_SECONDS = 60 * 60;

/** OAuth state token expiration in seconds (10 minutes) */
export const OAUTH_STATE_EXPIRY_SECONDS = 10 * 60;

/** Default request timeout in milliseconds */
export const DEFAULT_TIMEOUT_MS = 15000;

/** Payment confirmation polling interval in milliseconds */
export const PAYMENT_POLL_INTERVAL_MS = 10000;

/** Order ticket polling interval in milliseconds */
export const TICKET_POLL_INTERVAL_MS = 2000;

/** Maximum ticket polling attempts */
export const TICKET_POLL_MAX_ATTEMPTS = 12;

/** Proof page auto-refresh interval in milliseconds (15 seconds) */
export const PROOF_REFRESH_INTERVAL_MS = 15000;

// ============================================================================
// RATE LIMITS
// ============================================================================

/** Global API rate limit: requests per window */
export const API_LIMIT_REQUESTS = 100;

/** Global API rate limit: window in seconds (15 minutes) */
export const API_LIMIT_WINDOW_SECONDS = 15 * 60;

/** Checkout rate limit: requests per window */
export const CHECKOUT_LIMIT_REQUESTS = 10;

/** Checkout rate limit: window in seconds (15 minutes) */
export const CHECKOUT_LIMIT_WINDOW_SECONDS = 15 * 60;

/** Discord auth rate limit: requests per window */
export const DISCORD_AUTH_LIMIT_REQUESTS = 5;

/** Discord auth rate limit: window in seconds (15 minutes) */
export const DISCORD_AUTH_LIMIT_WINDOW_SECONDS = 15 * 60;

/** Admin login rate limit: requests per window */
export const ADMIN_LOGIN_LIMIT_REQUESTS = 5;

/** Admin login rate limit: window in seconds (15 minutes) */
export const ADMIN_LOGIN_LIMIT_WINDOW_SECONDS = 15 * 60;

// ============================================================================
// DISCORD
// ============================================================================

/** Discord OAuth2 scopes required */
export const DISCORD_OAUTH_SCOPES = ['identify', 'guilds.join'] as const;

/** Permission bits for ticket channel (VIEW, SEND, EMBED_LINKS, ATTACH_FILES, READ_MESSAGE_HISTORY, ADD_REACTIONS) */
export const DISCORD_TICKET_CHAT_PERMISSIONS = BigInt(10240) // Basic view
  | BigInt(1024)    // Send messages
  | BigInt(16384)   // Embed links
  | BigInt(32768)   // Attach files
  | BigInt(65536)   // Read message history
  | BigInt(64);     // Add reactions

/** Discord permission bits for viewing channel only */
export const DISCORD_VIEW_CHANNEL_PERMISSION = BigInt(1024);

/** Ticket creation minimum gap in milliseconds */
export const DISCORD_TICKET_CREATE_MIN_GAP_MS = 3500;

/** Ticket creation max retries */
export const DISCORD_TICKET_CREATE_MAX_RETRIES = 2;

/** Ticket creation base retry delay in milliseconds */
export const DISCORD_TICKET_CREATE_BASE_DELAY_MS = 900;

/** Ticket creation max retry delay in milliseconds */
export const DISCORD_TICKET_CREATE_MAX_DELAY_MS = 5000;

/** Image download timeout in milliseconds */
export const DISCORD_IMAGE_DOWNLOAD_TIMEOUT_MS = 15000;

/** Maximum image size in bytes (25MB) */
export const DISCORD_IMAGE_MAX_SIZE_BYTES = 25 * 1024 * 1024;

/** Maximum images per auto-vouch batch */
export const DISCORD_VOUCH_BATCH_SIZE = 10;

/** Add-all command concurrency limit */
export const DISCORD_ADDALL_CONCURRENCY = 4;

/** Add-all command max retries per user */
export const DISCORD_ADDALL_MAX_RETRIES = 3;

// ============================================================================
// PAYMENT
// ============================================================================

/** Supported payment methods */
export const PAYMENT_METHODS = ['PAYPAL_FF', 'CASHAPP', 'LTC', 'WALLET', 'PAYPAL_REST'] as const;

/** PayPal IPN verification URL */
export const PAYPAL_IPN_VERIFY_URL = 'https://ipnpb.paypal.com/cgi-bin/webscr';

/** PayPal sandbox IPN verification URL */
export const PAYPAL_IPN_SANDBOX_VERIFY_URL = 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr';

/** Square sandbox URL */
export const SQUARE_SANDBOX_URL = 'https://web.squarecdn.com/v1/square.js';

/** Square production URL */
export const SQUARE_PRODUCTION_URL = 'https://web.squarecdn.com/v1/square.js';

// ============================================================================
// ROBLOX
// ============================================================================

/** Roblox API base URL */
export const ROBLOX_API_BASE_URL = 'https://users.roblox.com';

/** Roblox users endpoint */
export const ROBLOX_USERS_BY_USERNAME_ENDPOINT = '/v1/users/get-by-username';

/** Roblox thumbnail API base URL */
export const ROBLOX_THUMBNAIL_API_BASE_URL = 'https://thumbnails.roblox.com';

// ============================================================================
// DATABASE
// ============================================================================

/** Order ID prefix */
export const ORDER_ID_PREFIX = 'ORD';

/** Order ID length (without prefix) */
export const ORDER_ID_LENGTH = 5;

/** Character set for order ID generation */
export const ORDER_ID_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Reference code length */
export const REFERENCE_CODE_LENGTH = 8;

/** Maximum recent purchases to show in ticker */
export const RECENT_PURCHASES_LIMIT = 30;

/** Proofs page default limit */
export const PROOFS_PAGE_DEFAULT_LIMIT = 48;

// ============================================================================
// DELIVERY
// ============================================================================

/** Delivery slot minimum advance booking in hours */
export const DELIVERY_SLOT_MIN_ADVANCE_HOURS = 1;

/** Delivery slot maximum advance booking in days */
export const DELIVERY_SLOT_MAX_ADVANCE_DAYS = 30;

/** Default owner timezone */
export const DEFAULT_OWNER_TIMEZONE = 'America/New_York';

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Order errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  WALLET_INSUFFICIENT_BALANCE: 'WALLET_INSUFFICIENT_BALANCE',

  // Ticket errors
  TICKET_CREATION_IN_PROGRESS: 'TICKET_CREATION_IN_PROGRESS',
  TICKET_ALREADY_EXISTS: 'TICKET_ALREADY_EXISTS',
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',

  // Discord errors
  DISCORD_RATE_LIMITED: 'DISCORD_RATE_LIMITED',
  USER_NOT_IN_GUILD: 'USER_NOT_IN_GUILD',
  DISCORD_API_ERROR: 'DISCORD_API_ERROR',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  COUPON_NOT_FOUND: 'COUPON_NOT_FOUND',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  COUPON_USAGE_LIMIT: 'COUPON_USAGE_LIMIT',
  COUPON_MIN_ORDER_NOT_MET: 'COUPON_MIN_ORDER_NOT_MET',

  // Product errors
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_INACTIVE: 'PRODUCT_INACTIVE',

  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// FILE UPLOADS
// ============================================================================

/** Maximum product image size in bytes (5MB) */
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Maximum banner image size in bytes (10MB) */
export const MAX_BANNER_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/** Allowed image extensions */
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  CART: 'nosmarket_cart',
  DISCORD_LINK_METHOD: 'discordLinkMethod',
  PRODUCTS_CACHE: 'productsCache',
  PROOF_NOTICE_SEEN: 'orderProofNoticeSeenV1',
  THEME: 'nosmarket_theme',
  AUTH_TOKEN: 'nosmarket_auth_token',
} as const;

// ============================================================================
// DISCORD EMBED COLORS (hex)
// ============================================================================

export const DISCORD_EMBED_COLORS = {
  PAYMENT: 0x8ED3FF,    // Light blue - PayPal
  LTC: 0xF5F7FA,        // Near white - Litecoin
  DELIVERY: 0xA7EFC0,   // Light green - Delivery
  WALLET: 0xF7C948,     // Gold - Wallet
  SUCCESS: 0x57F287,    // Green - Success
  ERROR: 0xED4245,      // Red - Error
  INFO: 0x5865F2,      // Blue - Info
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const PATTERNS = {
  /** Time format: HH:MM or HH:MM:SS */
  TIME: /^\d{2}:\d{2}(:\d{2})?$/,

  /** Date format: YYYY-MM-DD */
  DATE: /^\d{4}-\d{2}-\d{2}$/,

  /** Order ID format: ORD-XXXXX */
  ORDER_ID: /^ORD-[A-Z0-9]{5}$/,

  /** Discord snowflake ID */
  DISCORD_ID: /^\d{17,20}$/,

  /** Currency amount (positive decimal) */
  CURRENCY: /^\d+(\.\d{1,2})?$/,

  /** Slug format */
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  /** Hex color */
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,

  /** IPv4 address */
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  /** IPv6 address */
  IPV6: /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i,
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  /** Enable wallet system */
  WALLET_ENABLED: true,

  /** Enable delivery slot booking */
  DELIVERY_SLOTS_ENABLED: true,

  /** Enable coupon system */
  COUPONS_ENABLED: true,

  /** Enable fraud detection */
  FRAUD_DETECTION_ENABLED: true,

  /** Enable proof/delivery gallery */
  PROOFS_ENABLED: true,

  /** Enable notifications */
  NOTIFICATIONS_ENABLED: true,

  /** Enable API key authentication */
  API_KEYS_ENABLED: true,

  /** Enable webhook logging */
  WEBHOOK_LOGGING_ENABLED: true,

  /** Require Discord guild membership for purchases */
  REQUIRE_GUILD_MEMBERSHIP: true,

  /** Require Roblox account linking for delivery */
  REQUIRE_ROBLOX_LINKING: true,
} as const;

// ============================================================================
// CACHE TTLS (in seconds)
// ============================================================================

export const CACHE_TTL = {
  /** Products cache: 5 minutes */
  PRODUCTS: 5 * 60,

  /** Games cache: 10 minutes */
  GAMES: 10 * 60,

  /** Categories cache: 10 minutes */
  CATEGORIES: 10 * 60,

  /** Shop config cache: 5 minutes */
  SHOP_CONFIG: 5 * 60,

  /** Recent purchases cache: 1 minute */
  RECENT_PURCHASES: 60,

  /** Proofs cache: 1 minute */
  PROOFS: 60,

  /** Delivery slots cache: 30 seconds */
  DELIVERY_SLOTS: 30,
} as const;

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

/** Toast auto-dismiss duration in milliseconds */
export const TOAST_DISMISS_MS = 3000;

/** Toast max visible at once */
export const TOAST_MAX_VISIBLE = 3;
