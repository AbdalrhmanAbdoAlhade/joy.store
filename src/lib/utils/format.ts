/* Small formatting helpers shared across the storefront. */

/** Currency used by the store. Change here to rebrand everywhere. */
export const CURRENCY = 'ج.م';

const numberFormatter = new Intl.NumberFormat('ar-EG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** The backend returns decimals as strings ("180.00") for some fields. */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPrice(value: string | number | null | undefined): string {
  return numberFormatter.format(toNumber(value));
}

/** `149` + `ج.م` — kept as a single string so `<Price>` stays simple. */
export function formatMoney(value: string | number | null | undefined): string {
  return `${formatPrice(value)} ${CURRENCY}`;
}

export function formatCount(value: number): string {
  return numberFormatter.format(value);
}

/** `"4.20"` → `4.2` — `avg_rating` arrives as a string. */
export function toRating(value: string | number | null | undefined): number {
  return toNumber(value);
}

/** ISO timestamp → a short Arabic date, e.g. `19 أكتوبر 2026`. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Percentage discount rounded for badge display. */
export function formatDiscount(value: string | number | null | undefined): string {
  const n = Math.round(toNumber(value));
  return n > 0 ? `${numberFormatter.format(n)}٪` : '';
}

/**
 * Playful, kid-friendly label for an age band.
 * `age_group.min_age`/`max_age` are in **months**.
 */
export function formatAgeGroup(minMonths: number | null, maxMonths: number | null): string | null {
  if (minMonths === null && maxMonths === null) return null;
  const toYears = (months: number) => {
    if (months < 12) return `${months} شهور`;
    const years = months / 12;
    return Number.isInteger(years) ? `${years} سنوات` : `${years.toFixed(1)} سنوات`;
  };
  if (minMonths !== null && maxMonths !== null) return `${toYears(minMonths)} – ${toYears(maxMonths)}`;
  if (minMonths !== null) return `من ${toYears(minMonths)}`;
  return `حتى ${toYears(maxMonths as number)}`;
}
