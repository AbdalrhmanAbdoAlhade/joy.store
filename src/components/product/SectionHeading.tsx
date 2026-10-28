import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';

/** Section header with an optional "see all" link — used across Home. */
export function SectionHeading({
  title,
  emoji,
  action,
  className,
}: {
  title: string;
  emoji?: string;
  action?: { to: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-4', className)}>
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-joy-ink sm:text-2xl">
        {emoji ? (
          <span aria-hidden="true" className="text-2xl">
            {emoji}
          </span>
        ) : null}
        {title}
      </h2>

      {action ? (
        <Link
          to={action.to}
          className="group inline-flex hit-target items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-joy-grape-dark transition-colors hover:bg-joy-grape-soft"
        >
          {action.label}
          <span className="transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true">
            ←
          </span>
        </Link>
      ) : null}
    </div>
  );
}

/** Responsive card grid used by every listing surface. */
export function ProductGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
