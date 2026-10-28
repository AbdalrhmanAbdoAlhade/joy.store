import { formatMoney, toNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Price with an optional strike-through original.
 *
 * The sale price is the loud one; the original is quieter and struck out, so
 * the discount reads before the numbers do. Both stay tabular so a changing
 * quantity never shifts the row.
 */
export function Price({
  value,
  compareAt,
  size = 'md',
  className,
}: {
  value: string | number | null | undefined;
  compareAt?: string | number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const price = toNumber(value);
  const original = compareAt != null ? toNumber(compareAt) : 0;
  const hasDiscount = original > price && original > 0;

  const sizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <span className={cn('price inline-flex items-baseline gap-2', className)}>
      <span className={cn('font-extrabold text-joy-coral-dark', sizes)}>{formatMoney(price)}</span>
      {hasDiscount ? (
        <span className="text-sm text-joy-muted line-through decoration-joy-coral/60">
          {formatMoney(original)}
        </span>
      ) : null}
    </span>
  );
}
