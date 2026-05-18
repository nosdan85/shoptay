export interface TimezoneOption {
  value: string;
  label: string;
  country: string;
}

export const ALL_TIMEZONES: TimezoneOption[] = [
  { value: "Asia/Ho_Chi_Minh", label: "Vietnam Time (ICT)", country: "Vietnam" },
  { value: "Asia/Tokyo", label: "Japan Time (JST)", country: "Japan" },
  { value: "Asia/Seoul", label: "Korea Time (KST)", country: "South Korea" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)", country: "Singapore" },
  { value: "Asia/Bangkok", label: "Thailand Time (ICT)", country: "Thailand" },
  { value: "Asia/Jakarta", label: "Indonesia Time (WIB)", country: "Indonesia" },
  { value: "Asia/Manila", label: "Philippines Time (PST)", country: "Philippines" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia Time (MYT)", country: "Malaysia" },
  { value: "Asia/Shanghai", label: "China Time (CST)", country: "China" },
  { value: "Asia/Hong_Kong", label: "Hong Kong Time (HKT)", country: "Hong Kong" },
  { value: "Asia/Taipei", label: "Taiwan Time (CST)", country: "Taiwan" },
  { value: "Asia/Kolkata", label: "India Time (IST)", country: "India" },
  { value: "Asia/Dubai", label: "Gulf Time (GST)", country: "UAE" },
  { value: "America/New_York", label: "US Eastern (EST/EDT)", country: "United States" },
  { value: "America/Chicago", label: "US Central (CST/CDT)", country: "United States" },
  { value: "America/Denver", label: "US Mountain (MST/MDT)", country: "United States" },
  { value: "America/Los_Angeles", label: "US Pacific (PST/PDT)", country: "United States" },
  { value: "America/Anchorage", label: "Alaska (AKST/AKDT)", country: "United States" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)", country: "United States" },
  { value: "America/Toronto", label: "Canada Eastern (EST/EDT)", country: "Canada" },
  { value: "America/Vancouver", label: "Canada Pacific (PST/PDT)", country: "Canada" },
  { value: "America/Sao_Paulo", label: "Brasilia Time (BRT)", country: "Brazil" },
  { value: "America/Mexico_City", label: "Mexico City (CST)", country: "Mexico" },
  { value: "Europe/London", label: "UK (GMT/BST)", country: "United Kingdom" },
  { value: "Europe/Paris", label: "France (CET/CEST)", country: "France" },
  { value: "Europe/Berlin", label: "Germany (CET/CEST)", country: "Germany" },
  { value: "Europe/Rome", label: "Italy (CET/CEST)", country: "Italy" },
  { value: "Europe/Madrid", label: "Spain (CET/CEST)", country: "Spain" },
  { value: "Europe/Amsterdam", label: "Netherlands (CET/CEST)", country: "Netherlands" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", country: "Russia" },
  { value: "Europe/Istanbul", label: "Turkey (TRT)", country: "Turkey" },
  { value: "Europe/Warsaw", label: "Poland (CET)", country: "Poland" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)", country: "Australia" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)", country: "Australia" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)", country: "Australia" },
  { value: "Australia/Perth", label: "Perth (AWST)", country: "Australia" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST/NZDT)", country: "New Zealand" },
  { value: "Africa/Cairo", label: "Egypt (EET)", country: "Egypt" },
  { value: "Africa/Johannesburg", label: "South Africa (SAST)", country: "South Africa" },
  { value: "Atlantic/Reykjavik", label: "Iceland (GMT)", country: "Iceland" },
];

export function detectUserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  }
  catch ($e) { }
  return "Asia/Ho_Chi_Minh";
}

export function filterTimezones(query: string): TimezoneOption[] {
  if (!query.trim()) return ALL_TIMEZONES;
  const q = query.toLowerCase();
  return ALL_TIMEZONES.filter(
    (t) =>
      t.label.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.value.toLowerCase().includes(q)
  );
}
