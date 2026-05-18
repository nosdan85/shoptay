import { format, formatDistanceToNow, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { formatPrice, formatPriceString } from "./utils";

// Price formatting
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatCurrencyCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(2)}`;
}

export { formatPrice, formatPriceString };

// Date formatting
export function formatDate(date: string | Date, formatStr: string = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MM/dd/yy");
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}

export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Timezone formatting
export function formatInTimezone(
  date: string | Date,
  timezone: string,
  formatStr: string = "MMM d, yyyy 'at' h:mm a"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, formatStr);
}

export function getZonedTime(date: string | Date, timezone: string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(d, timezone);
}

// Delivery slot formatting
export function formatDeliverySlot(
  startAt: string,
  endAt: string,
  timezone: string
): { owner: string; customer: string } {
  const owner = formatInTimezone(startAt, timezone, "h:mm a") +
    " - " +
    formatInTimezone(endAt, timezone, "h:mm a");

  const date = formatInTimezone(startAt, timezone, "EEEE, MMM d");

  return {
    owner: `${date} ${owner}`,
    customer: owner,
  };
}

// Order ID formatting
export function formatOrderId(orderId: string): string {
  if (orderId.length > 12) {
    return orderId.slice(0, 8).toUpperCase();
  }
  return orderId.toUpperCase();
}

// Discord username formatting
export function formatDiscordUsername(username: string, discriminator?: string): string {
  if (discriminator && discriminator !== "0") {
    return `${username}#${discriminator}`;
  }
  return username;
}

// Transaction amount formatting
export function formatTransactionAmount(cents: number, direction: "credit" | "debit"): string {
  const sign = direction === "credit" ? "+" : "-";
  return `${sign}${formatCurrency(cents)}`;
}

// Payment method formatting
export function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    paypal_ff: "PayPal F&F",
    cashapp: "Cash App",
    ltc: "Litecoin",
    wallet: "Wallet Balance",
  };
  return methods[method] || method;
}

// Status formatting
export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Quantity display
export function formatQuantity(quantity: number, unit: string = ""): string {
  if (unit) {
    return `${quantity}x ${unit}`;
  }
  return quantity.toString();
}

// Percentage formatting
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Compact number formatting
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

// Item description formatting
export function formatItemDescription(price: number, quantity: number, itemName: string): string {
  const priceStr = formatCurrency(price);
  return `${priceStr} for ${quantity}x ${itemName}`;
}
