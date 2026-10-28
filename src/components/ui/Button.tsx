import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Leading icon; the label-side padding is 2px tighter for optical balance. */
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  /** Removes the 0.96 press scale where motion would be distracting. */
  static?: boolean;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  /* Rule: vivid fills (`bg-joy-coral`, `bg-joy-sun`) carry INK text — white
     on `#ff5a5f` measures 3.05:1, far below AA for label sizes. */
  primary:
    'bg-joy-coral text-joy-ink shadow-[0_6px_0_0_var(--color-joy-coral-dark)] hover:brightness-[1.04] active:shadow-[0_3px_0_0_var(--color-joy-coral-dark)]',
  accent:
    'bg-joy-sun text-joy-ink shadow-[0_6px_0_0_var(--color-joy-sun-dark)] hover:brightness-[1.04] active:shadow-[0_3px_0_0_var(--color-joy-sun-dark)]',
  secondary:
    'bg-joy-grape text-white shadow-[0_6px_0_0_var(--color-joy-grape-dark)] hover:brightness-[1.06] active:shadow-[0_3px_0_0_var(--color-joy-grape-dark)]',
  ghost: 'bg-transparent text-joy-ink-soft hover:bg-joy-line/60',
  outline: 'bg-white text-joy-ink shadow-xs ring-1 ring-joy-line-strong hover:bg-joy-cream',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-11 px-3.5 text-sm gap-1.5',
  md: 'min-h-12 px-5 text-base gap-2',
  lg: 'min-h-14 px-7 text-lg gap-2.5',
};

/**
 * The tactile button: a chunky "sticker" shadow that collapses on press.
 *
 * Padding is deliberately 2px tighter on the icon side so a leading icon
 * reads optically centred rather than shoved outward, and press feedback is
 * `scale(0.96)` — the floor that still feels responsive.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    trailingIcon,
    loading = false,
    static: isStatic = false,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-static={isStatic || undefined}
      className={cn(
        'pressable inline-flex select-none items-center justify-center rounded-2xl font-display font-bold',
        'transition-[transform,box-shadow,background-color,filter] duration-150 ease-[var(--ease-out)]',
        'disabled:pointer-events-none disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner className="size-5 shrink-0" /> : icon ? <span className="-ms-0.5 shrink-0">{icon}</span> : null}
      {children ? <span className="truncate">{children}</span> : null}
      {trailingIcon && !loading ? (
        <span className="shrink-0 opacity-90">{trailingIcon}</span>
      ) : null}
    </button>
  );
});

/** Indeterminate loader — also used standalone for page-level states. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
