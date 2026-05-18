import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || 'default_encryption_key_change_me_32',

  // Discord
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    ownerRoleId: process.env.DISCORD_OWNER_ROLE_ID || '',
    vouchChannelId: process.env.DISCORD_VOUCH_CHANNEL_ID || '',
    ticketCategoryId: process.env.DISCORD_TICKET_CATEGORY_ID || '',
  },

  // Owner
  ownerDiscordIds: (process.env.OWNER_DISCORD_IDS || '').split(',').filter(Boolean),

  // PayPal
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: process.env.PAYPAL_MODE || 'sandbox',
  },

  // Square
  square: {
    applicationId: process.env.SQUARE_APPLICATION_ID || '',
    accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
  },

  // NOWPayments
  nowpayments: {
    apiKey: process.env.NOWPAYMENTS_API_KEY || '',
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
  },

  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    checkoutLimit: parseInt(process.env.THROTTLE_CHECKOUT_LIMIT || '10', 10),
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '5', 10),
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },
}));
