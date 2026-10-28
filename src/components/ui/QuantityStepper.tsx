import { cn } from '@/lib/utils/cn';
import { MinusIcon, PlusIcon } from './Icon';

/**
 * Quantity stepper.
 *
 * Hit areas are 44px (touch minimum) even though the visible pill is smaller,
 * and the value is tabular so +/- never nudges its neighbours.
 */
export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled,
  className,
  label = 'الكمية',
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-pill bg-joy-cream p-1 ring-1 ring-joy-line',
        className,
      )}
      role="group"
      aria-label={label}
    >
      <StepButton
        label="إنقاص الكمية"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <MinusIcon size={16} />
      </StepButton>

      <output
        className="price min-w-9 text-center text-sm font-extrabold text-joy-ink"
        aria-live="polite"
      >
        {value}
      </output>

      <StepButton
        label="زيادة الكمية"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <PlusIcon size={16} />
      </StepButton>
    </div>
  );
}

function StepButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="pressable hit-target grid size-9 place-items-center rounded-full bg-joy-paper text-joy-ink shadow-xs transition-colors hover:bg-joy-sun-soft disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
