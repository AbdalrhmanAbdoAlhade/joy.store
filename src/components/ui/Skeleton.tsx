import { cn } from '@/lib/utils/cn';

/**
 * Skeleton block.
 *
 * A single shimmer layer is applied on the container (not per child) so a
 * grid of skeletons never falls out of sync, and the pulse is disabled for
 * users who asked for reduced motion (global CSS handles that).
 */
export function Skeleton({ className, rounded = 'md' }: { className?: string; rounded?: 'sm' | 'md' | 'lg' | 'full' }) {
  const radius = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' }[rounded];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'skeleton block bg-joy-line',
        radius,
        className,
      )}
    />
  );
}

/** Grid placeholder matching `ProductCard`'s proportions exactly. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-joy-paper p-2.5 shadow-card" aria-hidden="true">
      <Skeleton className="aspect-square w-full" rounded="lg" />
      <div className="space-y-2 px-1 pt-3">
        <Skeleton className="h-3.5 w-1/3" rounded="full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-9" rounded="full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function LinesSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        /* Vary the widths so the block reads as text, not a bar chart. */
        <Skeleton
          key={index}
          className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')}
          rounded="full"
        />
      ))}
    </div>
  );
}
