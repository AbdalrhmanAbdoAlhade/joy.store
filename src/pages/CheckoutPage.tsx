import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAddresses, usePlaceOrder } from '@/lib/hooks/useOrders';
import { useCart } from '@/lib/hooks/useCart';
import { useSeo } from '@/lib/hooks/useSeo';
import { useAuthStore } from '@/stores/auth.store';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { EmptyState, PageLoader } from '@/components/ui/States';
import { CheckIcon, PackageIcon, TruckIcon } from '@/components/ui/Icon';

const PAYMENT_METHODS = [
  { value: 'cash_on_delivery', label: 'الدفع عند الاستلام 💵' },
  { value: 'card', label: 'بطاقة ائتمان 💳' },
];

/**
 * Checkout.
 *
 * `POST /checkout` is the only checkout route — there is no GET (API.md), so
 * the whole flow is: pick address → pick payment → place order → success.
 * Address creation lives behind the same page because the backend expects an
 * existing `address_id`.
 */
export function CheckoutPage() {
  useSeo({ title: 'إتمام الطلب', description: 'أكمل طلبك من JOY.', path: '/checkout' });

  const isAuthenticated = useAuthStore((state) => Boolean(state.token));
  const cart = useCart();
  const addressesQuery = useAddresses();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  const [addressId, setAddressId] = useState<number | null>(null);
  const [payment, setPayment] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  /** Order id of a completed checkout — switches the page to success. */
  const [placed, setPlaced] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login?next=/checkout', { replace: true });
  }, [isAuthenticated, navigate]);

  const addresses = addressesQuery.data?.data ?? [];

  useEffect(() => {
    if (addressId === null && addresses.length) setAddressId(addresses[0]!.id);
  }, [addresses, addressId]);

  if (!isAuthenticated) return <PageLoader label="جاري تحويلك لتسجيل الدخول…" />;

  // ---- success screen ----
  if (placed != null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <EmptyState
          icon={<span className="text-3xl">🎉</span>}
          title="تم استلام طلبك!"
          description="هنكلمك قريب لتأكيد موعد التوصيل. تقدر تتابع حالة طلبك من حسابك."
          action={
            <div className="flex gap-2">
              <Link to="/account">
                <Button variant="primary">متابعة الطلب</Button>
              </Link>
              <Link to="/products">
                <Button variant="outline">كمّل تسوّق</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <EmptyState
          icon={<span className="text-3xl">🛒</span>}
          title="سلتك فاضية"
          description="أضف منتجات الأول عشان تكمّل الطلب."
          action={
            <Link to="/products">
              <Button variant="primary">تصفّح الألعاب</Button>
            </Link>
          }
        />
      </div>
    );
  }

  async function submit() {
    if (addressId == null) return;
    try {
      const order = await placeOrder.mutateAsync({
        address_id: addressId,
        payment_method: payment,
        notes: notes || undefined,
      });
      cart.clear();
      setPlaced(order.id);
    } catch {
      /* the mutation's error is surfaced below */
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-2xl font-extrabold text-joy-ink">إتمام الطلب ✨</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-6">
          {/* Address */}
          <section className="rounded-card bg-joy-paper p-5 shadow-card">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold text-joy-ink">
              <TruckIcon size={18} className="text-joy-grape-dark" /> عنوان التوصيل
            </h2>

            {addressesQuery.isPending ? (
              <div className="skeleton h-24 rounded-md bg-joy-line" />
            ) : addresses.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-joy-muted">
                  مفيش عناوين محفوظة — أضف عنوانك الأول في{' '}
                  <Link to="/account?tab=addresses" className="font-bold text-joy-grape-dark hover:underline">
                    صفحة الحساب
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={
                      addressId === address.id
                        ? 'flex cursor-pointer items-start gap-3 rounded-md bg-joy-grape-soft p-3 ring-2 ring-joy-grape'
                        : 'flex cursor-pointer items-start gap-3 rounded-md p-3 ring-1 ring-joy-line transition-shadow hover:ring-joy-line-strong'
                    }
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                      className="mt-1 accent-joy-grape"
                    />
                    <span className="text-sm">
                      <span className="block font-bold text-joy-ink">{address.full_name}</span>
                      <span className="block text-joy-ink-soft">
                        {address.city} — {address.street}
                      </span>
                      <span className="block text-xs text-joy-muted">{address.phone}</span>
                    </span>
                  </label>
                ))}
                <Link
                  to="/account?tab=addresses"
                  className="inline-block text-sm font-bold text-joy-grape-dark hover:underline"
                >
                  + إضافة عنوان جديد
                </Link>
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-card bg-joy-paper p-5 shadow-card">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold text-joy-ink">
              <PackageIcon size={18} className="text-joy-grape-dark" /> طريقة الدفع
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => (                  <label
                    key={method.value}
                    /* The radio itself is visually hidden, so the focus ring
                       must land on the label — otherwise keyboard users get
                       no visible focus on this control. */
                    className={
                      payment === method.value
                        ? 'cursor-pointer rounded-md bg-joy-grape-soft p-3 text-sm font-bold text-joy-ink ring-2 ring-joy-grape'
                        : 'cursor-pointer rounded-md p-3 text-sm font-bold text-joy-ink-soft ring-1 ring-joy-line transition-shadow hover:ring-joy-line-strong has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-joy-grape'
                    }
                  >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={payment === method.value}
                    onChange={() => setPayment(method.value)}
                    className="sr-only"
                  />
                  {method.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-joy-muted">
              طرق الدفع المتاحة قد تختلف — لو واجهت مشكلة جرّب الدفع عند الاستلام.
            </p>
          </section>

          <section className="rounded-card bg-joy-paper p-5 shadow-card">
            <TextField
              label="ملاحظات للطلب (اختياري)"
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="مثال: اتصل قبل التوصيل بساعة"
              hint="أي تفاصيل تساعد فريق التوصيل."
            />
          </section>

          {placeOrder.isError ? (
            <p role="alert" className="rounded-md bg-joy-coral-soft p-3 text-sm font-bold text-joy-coral-dark">
              {(placeOrder.error as Error).message || 'تعذر إتمام الطلب. حاول مرة أخرى.'}
            </p>
          ) : null}
        </form>

        {/* Summary */}
        <aside className="h-fit rounded-card bg-joy-paper p-5 shadow-card" aria-label="ملخص الطلب">
          <h2 className="mb-3 font-display text-lg font-extrabold text-joy-ink">ملخص الطلب</h2>
          <ul className="mb-3 max-h-64 space-y-2 overflow-y-auto pe-1">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex items-center gap-2 text-sm">
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-joy-cream">
                  {line.image ? <img src={line.image} alt="" className="size-full object-cover" /> : '🧸'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-joy-ink">{line.name}</span>
                  <span className="price block text-xs text-joy-muted">×{line.quantity}</span>
                </span>
                <span className="price shrink-0 font-bold text-joy-ink">
                  {formatMoney(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-dashed border-joy-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-joy-muted">الإجمالي الفرعي</dt>
              <dd className="price font-bold text-joy-ink">{formatMoney(cart.totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-joy-muted">الشحن</dt>
              <dd className="text-sm font-bold text-joy-mint-dark">يُحسب لاحقاً</dd>
            </div>
            <div className="flex justify-between border-t border-joy-line pt-2">
              <dt className="font-extrabold text-joy-ink">الإجمالي</dt>
              <dd className="price text-lg font-extrabold text-joy-coral-dark">
                {formatMoney(cart.totals.subtotal)}
              </dd>
            </div>
          </dl>

          <Button
            size="lg"
            fullWidth
            className="mt-4"
            loading={placeOrder.isPending}
            disabled={addressId == null}
            onClick={() => void submit()}
          >
            {addressId == null ? 'اختر عنواناً أولاً' : 'تأكيد الطلب'}
          </Button>
        </aside>
      </div>
    </div>
  );
}

/** Compact order row shared by the account page. */
export function OrderRow({ order }: { order: { id: number; status: string; total?: string | number | null; created_at: string } }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-joy-paper p-4 shadow-card">
      <div>
        <p className="font-display font-extrabold text-joy-ink">طلب #{order.id}</p>
        <p className="text-xs text-joy-muted">{formatDate(order.created_at)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-joy-mint-soft px-3 py-1 text-xs font-extrabold text-joy-mint-dark">
          {order.status}
        </span>
        {order.total != null ? (
          <span className="price font-bold text-joy-coral-dark">{formatMoney(order.total)}</span>
        ) : null}
        <CheckIcon size={16} className="text-joy-mint-dark" />
      </div>
    </li>
  );
}
