import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/lib/hooks/useCart';
import { useSeo } from '@/lib/hooks/useSeo';
import { formatMoney } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Skeleton } from '@/components/ui/Skeleton';
import { CartIcon, TrashIcon } from '@/components/ui/Icon';

/** Cart — reads guest (localStorage) or server lines through one hook. */
export function CartPage() {
  useSeo({ title: 'سلة التسوق', description: 'راجع منتجاتك قبل إتمام الطلب.', path: '/cart' });
  const cart = useCart();
  const navigate = useNavigate();

  if (cart.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-8 sm:px-6">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex gap-4 rounded-card bg-joy-paper p-4 shadow-card">
            <Skeleton className="size-20 shrink-0" rounded="lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cart.error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorState error={cart.error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-extrabold text-joy-ink">سلة التسوق 🛒</h1>
        <EmptyState
          icon={<CartIcon size={28} />}
          title="سلتك فاضية لسه"
          description="ابدأ التسوق وهتلاقي ألعاب كتير مناسبة لصغيرك."
          action={
            <Link to="/products">
              <Button variant="primary">تصفّح الألعاب</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-2xl font-extrabold text-joy-ink">سلة التسوق 🛒</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-3">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex gap-3 rounded-card bg-joy-paper p-3 shadow-card sm:gap-4 sm:p-4">
              <Link
                to={line.slug ? `/products/${line.slug}` : '#'}
                className="size-20 shrink-0 overflow-hidden rounded-lg bg-joy-cream sm:size-24"
              >
                {line.image ? (
                  <img src={line.image} alt={line.name} className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-3xl" aria-hidden="true">🧸</span>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={line.slug ? `/products/${line.slug}` : '#'}
                    className="line-clamp-2 font-display text-sm font-bold text-joy-ink hover:text-joy-coral-dark sm:text-base"
                  >
                    {line.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => cart.remove(line)}
                    aria-label={`حذف ${line.name} من السلة`}
                    className="pressable hit-target grid shrink-0 place-items-center rounded-full text-joy-muted transition-colors hover:bg-joy-coral-soft hover:text-joy-coral-dark"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                  <QuantityStepper
                    value={line.quantity}
                    max={Math.max(1, Math.min(line.stock, 99))}
                    onChange={(next) => cart.setQuantity(line, next)}
                    disabled={cart.isMutating}
                  />
                  <span className="price text-sm font-extrabold text-joy-coral-dark sm:text-base">
                    {formatMoney(line.price * line.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-card bg-joy-paper p-5 shadow-card" aria-label="ملخص الطلب">
          <h2 className="mb-3 font-display text-lg font-extrabold text-joy-ink">ملخص الطلب</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-joy-muted">عدد المنتجات</dt>
              <dd className="price font-bold text-joy-ink">{cart.totals.count}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-joy-line pt-2">
              <dt className="font-bold text-joy-ink">الإجمالي الفرعي</dt>
              <dd className="price text-base font-extrabold text-joy-coral-dark">
                {formatMoney(cart.totals.subtotal)}
              </dd>
            </div>
          </dl>

          <p className="mt-2 text-xs text-joy-muted">الشحن يُحسب عند إتمام الطلب.</p>

          <div className="mt-4 space-y-2">
            <Button
              size="lg"
              fullWidth
              onClick={() => navigate(cart.isAuthenticated ? '/checkout' : '/login?next=/checkout')}
            >
              إتمام الشراء
            </Button>
            <Link to="/products" className="block">
              <Button variant="ghost" fullWidth>متابعة التسوّق</Button>
            </Link>
          </div>

          {!cart.isAuthenticated ? (
            <p className="mt-3 text-center text-xs text-joy-muted">
              عندك حساب؟{' '}
              <Link to="/login?next=/cart" className="font-bold text-joy-grape-dark hover:underline">
                سجّل دخولك عشان نحفظ السلة
              </Link>
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
