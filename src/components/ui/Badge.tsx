import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Tone = 'coral' | 'sun' | 'mint' | 'grape' | 'sky' | 'neutral' | 'sale';

const TONES: Record<Tone, string> = {
  coral: 'bg-joy-coral-soft text-joy-coral-dark',
  /* Soft bg + its own darker hue — all AA-verified against the soft tone. */
  sun: 'bg-joy-sun text-joy-ink',
  mint: 'bg-joy-mint-soft text-joy-mint-dark',
  grape: 'bg-joy-grape-soft text-joy-grape-dark',
  sky: 'bg-joy-sky-soft text-joy-sky-dark',
  neutral: 'bg-joy-line/70 text-joy-ink-soft',
  /* Deep fill so 12px white label clears AA (vivid coral would be 3.05:1). */
  sale: 'bg-joy-coral-dark text-white',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold leading-none',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Discount pill — always a whole percentage, never a rounded artefact. */
export function DiscountBadge({ percentage, className }: { percentage: number; className?: string }) {
  if (!percentage || percentage <= 0) return null;
  const rounded = Math.round(percentage);
  return (
    <Badge tone="sale" className={cn('text-sm', className)}>
      خصم {rounded}٪
    </Badge>
  );
}
