import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatPriceString(priceInCents: number): string {
  const dollars = priceInCents / 100;
  if (dollars >= 1) {
    return `$${dollars.toFixed(2)}`;
  }
  return `${(dollars * 100).toFixed(0)}¢`;
}

export function parsePrice(value: string | number): number {
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^0-9.]/g, "");
  return Math.round(parseFloat(cleaned) * 100);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function normalizeCategory(category: string): string {
  const normalized = category.trim();
  const validCategories = ["Chest", "Reroll", "Shard", "Seal", "Relic", "Sets", "Combo", "Other"];
  if (validCategories.includes(normalized)) return normalized;
  return "Other";
}

export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "/products/placeholder.png";
  if (imagePath.startsWith("http")) return imagePath;
  return `/products/${imagePath}`;
}

export function getBannerUrl(bannerPath: string | null | undefined): string {
  if (!bannerPath) return "/banners/placeholder.png";
  if (bannerPath.startsWith("http")) return bannerPath;
  return `/banners/${bannerPath}`;
}

export const MAX_UI_QUANTITY = 100000;
export const BULK_DISCOUNT_THRESHOLD = 10;

export function calculateItemPricing(
  price: number,
  bulkPrice: number | undefined,
  quantity: number
) {
  const regularPrice = Math.max(price, 100); // Minimum $1.00
  const bulkPriceEffective = bulkPrice ?? regularPrice;

  if (quantity <= BULK_DISCOUNT_THRESHOLD) {
    return {
      regularPrice,
      bulkPrice: bulkPriceEffective,
      regularUnits: quantity,
      bulkUnits: 0,
      lineTotal: regularPrice * quantity,
      bulkApplied: false,
    };
  }

  const regularUnits = BULK_DISCOUNT_THRESHOLD;
  const bulkUnits = quantity - regularUnits;
  const lineTotal = regularUnits * regularPrice + bulkUnits * bulkPriceEffective;

  return {
    regularPrice,
    bulkPrice: bulkPriceEffective,
    regularUnits,
    bulkUnits,
    lineTotal,
    bulkApplied: bulkUnits > 0,
  };
}
