// API Routes - all backend endpoints
// Base URL is configured via NEXT_PUBLIC_API_URL env var

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Public routes
export const API_ROUTES = {
  // Products & Shop
  PRODUCTS: "/api/shop/products",
  GAMES: "/api/shop/games",
  CONFIG: "/api/shop/config",
  RECENT_PURCHASES: "/api/shop/recent-purchases",
  PROOFS: "/api/shop/proofs",

  // Auth
  DISCORD_AUTH: "/api/shop/auth/discord",
  CHECK_OWNER: "/api/shop/check-owner",

  // User-specific (optional auth)
  ORDER_PAYMENT_INFO: (orderId: string) => `/api/shop/orders/${orderId}/payment-info`,
  DELIVERY_SLOTS: "/api/shop/delivery-slots",
  ROBLOX_SEARCH: "/api/shop/roblox/search",

  // Protected routes (require Discord JWT)
  WALLET: "/api/shop/wallet",
  WALLET_TOPUP: "/api/shop/wallet/topup",
  WALLET_TOPUP_SQUARE_COMPLETE: (topupId: string) =>
    `/api/shop/wallet/topup/square/${topupId}/complete`,

  // Checkout
  CHECKOUT: "/api/shop/checkout",
  COUPON_PREVIEW: "/api/shop/coupon/preview",
  CREATE_PAYMENT: "/api/shop/create-payment",
  CREATE_TICKET: "/api/shop/create-ticket",
  CREATE_TICKET_PAYPAL_FF: "/api/shop/create-ticket-paypal-ff",
  CREATE_TICKET_LTC: "/api/shop/create-ticket-ltc",

  // Order actions
  LINK_ROBLOX: (orderId: string) => `/api/shop/orders/${orderId}/link-roblox`,
  DELIVERY_SLOT: (orderId: string) => `/api/shop/orders/${orderId}/delivery-slot`,
  CONFIRM_DELIVERY: (orderId: string) => `/api/shop/orders/${orderId}/confirm-delivery`,

  // Admin/Owner routes
  ADMIN_STATS: "/api/shop/owner/stats",
  ADMIN_STATS_REVENUE: "/api/shop/owner/stats/revenue",
  ADMIN_USERS: "/api/shop/owner/users",
  ADMIN_USER: (userId: string) => `/api/shop/owner/users/${userId}`,
  ADMIN_ORDERS: "/api/shop/owner/orders",
  ADMIN_ORDER: (orderId: string) => `/api/shop/owner/orders/${orderId}`,
  ADMIN_ORDER_MARK_PAID: (orderId: string) => `/api/shop/owner/orders/${orderId}/mark-paid`,
  ADMIN_ORDER_CANCEL: (orderId: string) => `/api/shop/owner/orders/${orderId}/cancel`,
  ADMIN_ORDER_MARK_DELIVERED: (orderId: string) => `/api/shop/owner/orders/${orderId}/mark-delivered`,
  ADMIN_TOPUPS: "/api/shop/owner/topups",
  ADMIN_TOPUP: (topupId: string) => `/api/shop/owner/topups/${topupId}`,
  ADMIN_TOPUP_APPROVE: (topupId: string) => `/api/shop/owner/topups/${topupId}/approve`,
  ADMIN_TOPUP_REJECT: (topupId: string) => `/api/shop/owner/topups/${topupId}/reject`,
  ADMIN_PRODUCTS: "/api/shop/owner/products",
  ADMIN_PRODUCT_IMAGES: "/api/shop/owner/product-images",
  ADMIN_GAMES: "/api/shop/owner/games",
  WALLET_ADMIN_TOPUPS: "/api/shop/wallet/admin/topups",
  WALLET_ADMIN_TRANSACTIONS: "/api/shop/wallet/admin/transactions",
  WALLET_ADMIN_ADJUST: "/api/shop/wallet/admin/adjust",
  WALLET_TOPUP_CANCEL: (topupId: string) => `/api/shop/wallet/topup/${topupId}/cancel`,
  DELIVERY_SLOTS_MANAGE: "/api/shop/delivery-slots/manage",
  DELIVERY_SLOTS_BULK: "/api/shop/delivery-slots/bulk",
  DELIVERY_SLOT_UPDATE: (slotId: string) => `/api/shop/delivery-slots/${slotId}`,

  // Config
  CONFIG_BEST_SELLERS: "/api/shop/owner/config/best-sellers",
  CONFIG_BANNERS: "/api/shop/owner/config/banners",

  // Webhooks
  WEBHOOK_NOWPAYMENTS: "/api/shop/webhook/nowpayments",
  WEBHOOK_SQUARE: "/api/shop/webhook/square",

  // Images
  PRODUCT_IMAGE: (filename: string) => `/api/shop/product-images/${filename}`,
  BANNER_IMAGE: (filename: string) => `/api/banners/${filename}`,
} as const;

// Frontend routes
export const ROUTES = {
  HOME: "/",
  PROOFS: "/proofs",
  WALLET: "/wallet",
  LOGIN: "/login",
  AUTH_CALLBACK: "/auth/discord/callback",
  PAY: (orderId: string) => `/pay?orderId=${orderId}`,
  ADMIN: "/admin",
  ADMIN_PRODUCTS: "/admin/products",
  ADMIN_GAMES: "/admin/games",
  ADMIN_SLOTS: "/admin/slots",
  ADMIN_HOMEPAGE: "/admin/homepage",
  ADMIN_WALLET: "/admin/wallet",
} as const;

// Discord OAuth
export const DISCORD_OAUTH = {
  AUTHORIZE_URL: "https://discord.com/oauth2/authorize",
  TOKEN_URL: "https://discord.com/api/oauth2/token",
  API_URL: "https://discord.com/api/v10",

  getAuthorizeUrl: (redirectUri: string, state: string) => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const scopes = encodeURIComponent("identify guilds.join");
    const encodedRedirect = encodeURIComponent(redirectUri);
    return `${DISCORD_OAUTH.AUTHORIZE_URL}?client_id=${clientId}&redirect_uri=${encodedRedirect}&response_type=code&scope=${scopes}&state=${state}`;
  },

  getAppAuthorizeUrl: (redirectUri: string) => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const scopes = encodeURIComponent("identify guilds.join");
    const encodedRedirect = encodeURIComponent(redirectUri);
    return `discord://-/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirect}&response_type=code&scope=${scopes}`;
  },
} as const;

// Discord server links
export const getDiscordInviteUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ||
    process.env.NEXT_PUBLIC_DISCORD_VOUCH_URL ||
    "https://discord.gg/nosmarket"
  );
};
