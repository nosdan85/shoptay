export interface TimezoneOption {
  value: string;
  label: string;
  country: string;
  currency: string;
  currencySymbol: string;
  currencyCode: string;
}

const COUNTRY_CURRENCY_MAP: Record<string, { currency: string; symbol: string }> = {
  Vietnam:       { currency: "VND", symbol: "₫" },
  Japan:         { currency: "JPY", symbol: "¥" },
  "South Korea": { currency: "KRW", symbol: "₩" },
  Singapore:     { currency: "SGD", symbol: "S$" },
  Thailand:      { currency: "THB", symbol: "฿" },
  Indonesia:     { currency: "IDR", symbol: "Rp" },
  Philippines:   { currency: "PHP", symbol: "₱" },
  Malaysia:      { currency: "MYR", symbol: "RM" },
  China:         { currency: "CNY", symbol: "¥" },
  "Hong Kong":   { currency: "HKD", symbol: "HK$" },
  Taiwan:        { currency: "TWD", symbol: "NT$" },
  India:         { currency: "INR", symbol: "₹" },
  UAE:           { currency: "AED", symbol: "Dh" },
  "United States": { currency: "USD", symbol: "$" },
  Canada:        { currency: "CAD", symbol: "C$" },
  Brazil:        { currency: "BRL", symbol: "R$" },
  Mexico:        { currency: "MXN", symbol: "MX$" },
  "United Kingdom": { currency: "GBP", symbol: "£" },
  France:        { currency: "EUR", symbol: "€" },
  Germany:       { currency: "EUR", symbol: "€" },
  Italy:         { currency: "EUR", symbol: "€" },
  Spain:         { currency: "EUR", symbol: "€" },
  Netherlands:   { currency: "EUR", symbol: "€" },
  Russia:        { currency: "RUB", symbol: "₽" },
  Turkey:        { currency: "TRY", symbol: "₺" },
  Poland:        { currency: "PLN", symbol: "zł" },
  Australia:     { currency: "AUD", symbol: "A$" },
  "New Zealand": { currency: "NZD", symbol: "NZ$" },
  Egypt:         { currency: "EGP", symbol: "E£" },
  "South Africa": { currency: "ZAR", symbol: "R" },
  Iceland:       { currency: "ISK", symbol: "kr" },
};

const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  KRW: 1340,
  CNY: 7.24,
  HKD: 7.79,
  TWD: 31.5,
  SGD: 1.34,
  THB: 35.2,
  MYR: 4.72,
  PHP: 56.5,
  IDR: 15700,
  VND: 24800,
  INR: 83.5,
  AED: 3.67,
  RUB: 92,
  TRY: 32.5,
  PLN: 4.0,
  AUD: 1.53,
  NZD: 1.63,
  BRL: 4.97,
  MXN: 17.2,
  EGP: 30.9,
  ZAR: 18.8,
  ISK: 138,
};

export interface TimezoneWithCurrency extends TimezoneOption {
  currency: string;
  currencySymbol: string;
  currencyCode: string;
}

export const ALL_TIMEZONES: TimezoneOption[] = [
  { value: "Asia/Ho_Chi_Minh", label: "Vietnam (ICT)", country: "Vietnam", currency: "VND", currencySymbol: "₫", currencyCode: "VND" },
  { value: "Asia/Tokyo", label: "Japan (JST)", country: "Japan", currency: "JPY", currencySymbol: "¥", currencyCode: "JPY" },
  { value: "Asia/Seoul", label: "Korea (KST)", country: "South Korea", currency: "KRW", currencySymbol: "₩", currencyCode: "KRW" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", country: "Singapore", currency: "SGD", currencySymbol: "S$", currencyCode: "SGD" },
  { value: "Asia/Bangkok", label: "Thailand (ICT)", country: "Thailand", currency: "THB", currencySymbol: "฿", currencyCode: "THB" },
  { value: "Asia/Jakarta", label: "Indonesia (WIB)", country: "Indonesia", currency: "IDR", currencySymbol: "Rp", currencyCode: "IDR" },
  { value: "Asia/Manila", label: "Philippines (PST)", country: "Philippines", currency: "PHP", currencySymbol: "₱", currencyCode: "PHP" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia (MYT)", country: "Malaysia", currency: "MYR", currencySymbol: "RM", currencyCode: "MYR" },
  { value: "Asia/Shanghai", label: "China (CST)", country: "China", currency: "CNY", currencySymbol: "¥", currencyCode: "CNY" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", country: "Hong Kong", currency: "HKD", currencySymbol: "HK$", currencyCode: "HKD" },
  { value: "Asia/Taipei", label: "Taiwan (CST)", country: "Taiwan", currency: "TWD", currencySymbol: "NT$", currencyCode: "TWD" },
  { value: "Asia/Kolkata", label: "India (IST)", country: "India", currency: "INR", currencySymbol: "₹", currencyCode: "INR" },
  { value: "Asia/Dubai", label: "UAE (GST)", country: "UAE", currency: "AED", currencySymbol: "Dh", currencyCode: "AED" },
  { value: "America/New_York", label: "US Eastern (EST)", country: "United States", currency: "USD", currencySymbol: "$", currencyCode: "USD" },
  { value: "America/Chicago", label: "US Central (CST)", country: "United States", currency: "USD", currencySymbol: "$", currencyCode: "USD" },
  { value: "America/Denver", label: "US Mountain (MST)", country: "United States", currency: "USD", currencySymbol: "$", currencyCode: "USD" },
  { value: "America/Los_Angeles", label: "US Pacific (PST)", country: "United States", currency: "USD", currencySymbol: "$", currencyCode: "USD" },
  { value: "America/Anchorage", label: "Alaska (AKST)", country: "United States", currency: "USD", currencySymbol: "$", currencyCode: "USD" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)", country: "United States", currency: "USD", currencySymbol: "$", currencyCode: "USD" },
  { value: "America/Toronto", label: "Canada Eastern (EST)", country: "Canada", currency: "CAD", currencySymbol: "C$", currencyCode: "CAD" },
  { value: "America/Vancouver", label: "Canada Pacific (PST)", country: "Canada", currency: "CAD", currencySymbol: "C$", currencyCode: "CAD" },
  { value: "America/Sao_Paulo", label: "Brazil (BRT)", country: "Brazil", currency: "BRL", currencySymbol: "R$", currencyCode: "BRL" },
  { value: "America/Mexico_City", label: "Mexico City (CST)", country: "Mexico", currency: "MXN", currencySymbol: "MX$", currencyCode: "MXN" },
  { value: "Europe/London", label: "UK (GMT/BST)", country: "United Kingdom", currency: "GBP", currencySymbol: "£", currencyCode: "GBP" },
  { value: "Europe/Paris", label: "France (CET)", country: "France", currency: "EUR", currencySymbol: "€", currencyCode: "EUR" },
  { value: "Europe/Berlin", label: "Germany (CET)", country: "Germany", currency: "EUR", currencySymbol: "€", currencyCode: "EUR" },
  { value: "Europe/Rome", label: "Italy (CET)", country: "Italy", currency: "EUR", currencySymbol: "€", currencyCode: "EUR" },
  { value: "Europe/Madrid", label: "Spain (CET)", country: "Spain", currency: "EUR", currencySymbol: "€", currencyCode: "EUR" },
  { value: "Europe/Amsterdam", label: "Netherlands (CET)", country: "Netherlands", currency: "EUR", currencySymbol: "€", currencyCode: "EUR" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", country: "Russia", currency: "RUB", currencySymbol: "₽", currencyCode: "RUB" },
  { value: "Europe/Istanbul", label: "Turkey (TRT)", country: "Turkey", currency: "TRY", currencySymbol: "₺", currencyCode: "TRY" },
  { value: "Europe/Warsaw", label: "Poland (CET)", country: "Poland", currency: "PLN", currencySymbol: "zł", currencyCode: "PLN" },
  { value: "Australia/Sydney", label: "Sydney (AEST)", country: "Australia", currency: "AUD", currencySymbol: "A$", currencyCode: "AUD" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST)", country: "Australia", currency: "AUD", currencySymbol: "A$", currencyCode: "AUD" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)", country: "Australia", currency: "AUD", currencySymbol: "A$", currencyCode: "AUD" },
  { value: "Australia/Perth", label: "Perth (AWST)", country: "Australia", currency: "AUD", currencySymbol: "A$", currencyCode: "AUD" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)", country: "New Zealand", currency: "NZD", currencySymbol: "NZ$", currencyCode: "NZD" },
  { value: "Africa/Cairo", label: "Egypt (EET)", country: "Egypt", currency: "EGP", currencySymbol: "E£", currencyCode: "EGP" },
  { value: "Africa/Johannesburg", label: "South Africa (SAST)", country: "South Africa", currency: "ZAR", currencySymbol: "R", currencyCode: "ZAR" },
  { value: "Atlantic/Reykjavik", label: "Iceland (GMT)", country: "Iceland", currency: "ISK", currencySymbol: "kr", currencyCode: "ISK" },
];

export function detectUserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  }
  catch (_) { }
  return "Asia/Ho_Chi_Minh";
}

export function getTimezoneInfo(tzValue: string): TimezoneOption {
  return ALL_TIMEZONES.find((t) => t.value === tzValue) || {
    value: tzValue,
    label: tzValue,
    country: "Other",
    currency: "USD",
    currencySymbol: "$",
    currencyCode: "USD",
  };
}

export function filterTimezones(query: string): TimezoneOption[] {
  if (!query.trim()) return ALL_TIMEZONES;
  const q = query.toLowerCase();
  return ALL_TIMEZONES.filter(
    (t) =>
      t.label.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.value.toLowerCase().includes(q) ||
      t.currency.toLowerCase().includes(q)
  );
}

export function convertPrice(usdPrice: number, targetCurrency: string): number {
  const rate = USD_RATES[targetCurrency] || 1;
  const converted = usdPrice * rate;
  if (targetCurrency === "JPY" || targetCurrency === "KRW" || targetCurrency === "IDR" || targetCurrency === "VND" || targetCurrency === "ISK") {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

export function formatPrice(usdPrice: number, currency: string, symbol: string): string {
  const converted = convertPrice(usdPrice, currency);
  if (currency === "USD" || currency === "EUR" || currency === "GBP" || currency === "AUD" || currency === "CAD" || currency === "NZD" || currency === "SGD" || currency === "HKD" || currency === "TWD" || currency === "CNY") {
    return symbol + converted.toFixed(2);
  }
  return symbol + Math.round(converted).toLocaleString();
}