import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils/cn';
import { Button, Spinner } from './Button';
import { AlertIcon, SearchIcon } from './Icon';

/**
 * Empty state — the illustration slot keeps a fixed size so swapping between
 * empty / error never shifts the surrounding layout.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-3 rounded-panel bg-joy-paper px-6 py-12 text-center shadow-card',
        className,
      )}
    >
      <div className="grid size-16 place-items-center rounded-full bg-joy-grape-soft text-joy-grape-dark">
        {icon ?? <SearchIcon size={28} />}
      </div>
      <h2 className="text-lg font-bold text-joy-ink">{title}</h2>
      {description ? <p className="text-sm leading-relaxed text-joy-muted">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

/** Error state that understands `ApiError` and offers a retry when it can. */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const apiError = error instanceof ApiError ? error : null;
  const message = apiError?.userMessage ?? 'حدث خطأ ما أثناء تحميل البيانات.';

  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-3 rounded-panel bg-joy-paper px-6 py-10 text-center shadow-card',
        className,
      )}
    >
      <div className="grid size-16 place-items-center rounded-full bg-joy-coral-soft text-joy-coral-dark">
        <AlertIcon size={28} />
      </div>
      <h2 className="text-lg font-bold text-joy-ink">Opps! حصل خطأ</h2>
      <p className="text-sm leading-relaxed text-joy-muted">{message}</p>
      {onRetry ? (
        <div className="pt-2">
          <Button variant="outline" onClick={onRetry}>
            حاول مرة أخرى
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Full-page loader used while auth or a route-level query boots. */
export function PageLoader({ label = 'جاري التحميل…' }: { label?: string }) {
  return (
    <div className="grid min-h-[50dvh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-joy-muted">
        <Spinner className="size-8 text-joy-coral" />
        <span className="text-sm font-bold">{label}</span>
      </div>
    </div>
  );
}

/** Friendly 404 with a way back into the store. */
export function NotFoundBlock({ what = 'الصفحة' }: { what?: string }) {
  return (
    <EmptyState
      icon={<span className="text-3xl">🧸</span>}
      title={`لم نعثر على ${what}`}
      description="ربما تم نقلها أو أن الرابط غير صحيح. جرّب العودة إلى المتجر."
      action={
        <Link to="/" className="inline-block">
          <Button variant="primary">العودة للرئيسية</Button>
        </Link>
      }
    />
  );
}
