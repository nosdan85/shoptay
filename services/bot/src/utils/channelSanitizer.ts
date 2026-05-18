import axios from 'axios';

/**
 * Sanitize a channel name for Discord
 */
export function sanitizeChannelName(name: string): string {
  return (
    name
      .toLowerCase()
      // Replace invalid characters with dashes
      .replace(/[^a-z0-9-_]/g, '-')
      // Collapse multiple dashes
      .replace(/-+/g, '-')
      // Trim leading/trailing dashes
      .replace(/^-|-$/g, '')
      // Limit to 90 characters (Discord limit is 100, but we need room for prefix)
      .slice(0, 90) ||
    // Fallback if name is empty
    `ticket-${Date.now()}`
  );
}

/**
 * Extract Discord ID from a string
 */
export function extractDiscordId(input: string): string | null {
  // Match snowflake ID (17-20 digits)
  const match = input.match(/(\d{17,20})/);
  return match ? match[1] : null;
}

/**
 * Extract order ID from various formats
 */
export function extractOrderId(input: string): string | null {
  // Match common order ID patterns
  const patterns = [
    /([A-Z0-9]{8,})/i, // Uppercase alphanumeric, 8+ chars
    /(order[-_]?\w+)/i, // order-xxx or order_xxx
    /(#[a-z0-9]{6,})/i, // #xxxxxx format
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1].replace(/^#/, '');
    }
  }

  return null;
}

/**
 * Format a Discord timestamp for display
 */
export function formatTimestamp(date: Date, format: 'short' | 'long' = 'short'): string {
  if (format === 'short') {
    return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
  }
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

/**
 * Format currency amount
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Paginate an array
 */
export function paginate<T>(array: T[], page: number, pageSize: number): T[] {
  const startIndex = (page - 1) * pageSize;
  return array.slice(startIndex, startIndex + pageSize);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000, onRetry } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        onRetry?.(attempt + 1, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse comma-separated string to array
 */
export function parseCommaSeparated(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Check if a string is a valid Discord snowflake ID
 */
export function isValidSnowflake(id: string): boolean {
  return /^\d{17,20}$/.test(id);
}

/**
 * Build pagination components
 */
export function buildPaginationComponents(
  currentPage: number,
  totalPages: number,
  prefix: string
): Array<{ label: string; customId: string; style: number; disabled?: boolean }> {
  const buttons: Array<{ label: string; customId: string; style: number; disabled?: boolean }> = [];

  // Previous button
  buttons.push({
    label: '◀️',
    customId: `${prefix}_prev_${currentPage}`,
    style: 2, // Secondary
    disabled: currentPage <= 1,
  });

  // Page indicator
  buttons.push({
    label: `${currentPage}/${totalPages}`,
    customId: `${prefix}_page_${currentPage}`,
    style: 2,
    disabled: true,
  });

  // Next button
  buttons.push({
    label: '▶️',
    customId: `${prefix}_next_${currentPage}`,
    style: 2,
    disabled: currentPage >= totalPages,
  });

  return buttons;
}

/**
 * Parse button custom ID
 */
export function parseCustomId(customId: string): { action: string; subAction?: string; value: string } | null {
  const parts = customId.split('_');
  if (parts.length < 2) return null;

  return {
    action: parts[0],
    subAction: parts.length > 2 ? parts[1] : undefined,
    value: parts.length > 2 ? parts.slice(2).join('_') : parts[1],
  };
}

/**
 * Calculate price with bulk discount
 */
export function calculateBulkPrice(
  unitPrice: number,
  quantity: number,
  bulkPrice: number,
  bulkThreshold: number = 10
): { regularUnits: number; bulkUnits: number; total: number } {
  const regularUnits = Math.min(quantity, bulkThreshold);
  const bulkUnits = Math.max(0, quantity - bulkThreshold);
  const total = regularUnits * unitPrice + bulkUnits * bulkPrice;

  return { regularUnits, bulkUnits, total };
}
