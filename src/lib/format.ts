export function formatPrice(priceCents: number, currency = "USD"): string {
  if (priceCents <= 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    priceCents / 100,
  );
}

/** Server-side date text (UTC). Prefer the <LocalTime> component for display. */
export function formatDateUTC(date: Date): string {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function spotsLeft(capacity: number | null, confirmed: number): number | null {
  if (capacity === null) return null;
  return Math.max(capacity - confirmed, 0);
}
