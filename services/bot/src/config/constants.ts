import { config } from './index';

// Permission bits for Discord channel overwrites
export const PERM_VIEW_CHANNEL_ONLY = 1n << 10n;

export const PERM_TICKET_CHAT =
  1n << 10n | // VIEW_CHANNEL
  1n << 11n | // SEND_MESSAGES
  1n << 14n | // EMBED_LINKS
  1n << 15n | // ATTACH_FILES
  1n << 16n | // READ_MESSAGE_HISTORY
  1n << 17n;  // ADD_REACTIONS

// Embed colors
export const COLORS = {
  paypal: 0x8ED3FF,
  ltc: 0xF5F7FA,
  delivery: 0xA7EFC0,
  wallet: 0xF7C948,
  success: 0x57F287,
  error: 0xED4245,
  info: 0x5865F2,
  warning: 0xF7C948,
} as const;

// Queue settings
export const TICKET_QUEUE_MIN_GAP_MS = parseInt(process.env.DISCORD_TICKET_CREATE_MIN_GAP_MS || '3500');
export const ADDALL_CONCURRENCY = parseInt(process.env.DISCORD_ADDALL_CONCURRENCY || '4');
export const ADDALL_MAX_RETRIES = 3;

// Retry settings
export const RETRY_MAX_RETRIES = 2;
export const RETRY_BASE_DELAY_MS = 800;
export const RETRY_MAX_DELAY_MS = 10000;

// Discord API limits
export const MAX_EMBED_DESCRIPTION_LENGTH = 4096;
export const MAX_EMBED_FIELD_VALUE_LENGTH = 1024;
export const MAX_EMBED_FIELDS = 25;
export const MAX_EMBED_TOTAL_LENGTH = 6000;
export const MAX_VOUCH_CONTENT_LENGTH = 1900;
export const MAX_IMAGES_PER_BATCH = 10;
export const IMAGE_DOWNLOAD_TIMEOUT_MS = 15000;
export const IMAGE_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
