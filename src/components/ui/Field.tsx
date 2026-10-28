import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Form controls.
 *
 * Labels are always rendered (never a placeholder standing in for one), the
 * error slot reserves its own line so fixing a field never jumps the form,
 * and the control grows to a 44px+ hit area without looking oversized.
 */

const CONTROL =
  'w-full rounded-md border border-joy-line-strong bg-joy-paper px-4 py-3 text-base text-joy-ink ' +
  'placeholder:text-joy-muted transition-[border-color,box-shadow] duration-150 ' +
  'hover:border-joy-line-strong focus:border-joy-grape focus:outline-none focus:ring-4 focus:ring-joy-grape-soft ' +
  'aria-[invalid=true]:border-joy-coral aria-[invalid=true]:focus:ring-joy-coral-soft';

interface FieldShellProps {
  label: string;
  /** Rendered below the control; reserves height only when present. */
  error?: string | undefined;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}

function FieldShell({ label, error, hint, required, className, children, htmlFor }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-joy-ink-soft">
        {label}
        {required ? <span className="text-joy-coral" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {/* Both slots exist whether filled or not, so the form never reflows. */}
      <div className="min-h-5">
        {error ? (
          <p className="text-xs font-semibold text-joy-coral-dark" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-joy-muted">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, required, className, id, ...rest },
  ref,
) {
  const inputId = id ?? `field-${rest.name}`;
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
      htmlFor={inputId}
    >
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={CONTROL}
        {...rest}
      />
    </FieldShell>
  );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

export function TextArea({ label, error, hint, required, className, id, ...rest }: TextAreaProps) {
  const inputId = id ?? `field-${rest.name}`;
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
      htmlFor={inputId}
    >
      <textarea
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, 'min-h-28 resize-y')}
        {...rest}
      />
    </FieldShell>
  );
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string | undefined;
}

export function SelectField({ label, error, className, id, children, required, ...rest }: SelectFieldProps) {
  const inputId = id ?? `field-${rest.name}`;
  return (
    <FieldShell label={label} error={error} required={required} className={className} htmlFor={inputId}>
      <select id={inputId} className={cn(CONTROL, 'appearance-none pe-10')} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}
