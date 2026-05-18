import { hash, verify } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export function encrypt(text: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(encryptionKey.substring(0, 32).padEnd(32, '0'), 'utf8');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string, encryptionKey: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = Buffer.from(encryptionKey.substring(0, 32).padEnd(32, '0'), 'utf8');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function generateOrderNumber(sequence: number): string {
  const prefix = 'NOS';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

export function calculateBulkDiscount(
  quantity: number,
  unitPrice: number,
  bulkDiscounts: Array<{ minQuantity: number; discountPercent: number }>,
): { discount: number; finalPrice: number } {
  if (!bulkDiscounts || bulkDiscounts.length === 0) {
    return { discount: 0, finalPrice: unitPrice };
  }

  // Find applicable bulk discount (highest discount for quantity)
  const applicableDiscount = bulkDiscounts
    .filter((d) => quantity >= d.minQuantity)
    .sort((a, b) => b.discountPercent - a.discountPercent)[0];

  if (!applicableDiscount) {
    return { discount: 0, finalPrice: unitPrice };
  }

  const discount = (unitPrice * applicableDiscount.discountPercent) / 100;
  return {
    discount: Math.round(discount * 100) / 100,
    finalPrice: Math.round((unitPrice - discount) * 100) / 100,
  };
}

export function calculateCouponDiscount(
  subtotal: number,
  coupon: { type: string; value: number; minOrderAmount?: number | null },
): { discount: number; finalTotal: number } | null {
  // Check minimum order amount
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return null;
  }

  let discount: number;

  if (coupon.type === 'PERCENTAGE') {
    discount = (subtotal * coupon.value) / 100;
  } else if (coupon.type === 'FIXED_AMOUNT') {
    discount = Math.min(coupon.value, subtotal);
  } else {
    return null;
  }

  return {
    discount: Math.round(discount * 100) / 100,
    finalTotal: Math.round((subtotal - discount) * 100) / 100,
  };
}

export function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
  } = options;

  return new Promise((resolve, reject) => {
    let attempt = 0;
    let currentDelay = delay;

    const attemptFn = async () => {
      attempt++;
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (attempt >= maxAttempts) {
          reject(error);
        } else {
          if (onRetry) {
            onRetry(attempt, error as Error);
          }
          setTimeout(attemptFn, currentDelay);
          currentDelay *= backoff;
        }
      }
    };

    attemptFn();
  });
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function parseTimezone(timezone: string): string {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return 'America/New_York'; // Default fallback
  }
}

export function convertToTimezone(date: Date, timezone: string): Date {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone,
  };

  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(date);
  
  const getPart = (type: string) => 
    parts.find((p) => p.type === type)?.value || '0';

  return new Date(
    `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`,
  );
}
