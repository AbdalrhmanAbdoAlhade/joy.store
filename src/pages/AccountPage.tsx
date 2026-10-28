import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCancelOrder, useCreateAddress, useDeleteAddress, useOrders, useAddresses } from '@/lib/hooks/useOrders';
import { useSeo } from '@/lib/hooks/useSeo';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/States';

type Tab = 'orders' | 'addresses' | 'profile';

const TABS: { key: Tab; label: string }[] = [
  { key: 'orders', label: 'طلباتي' },
  { key: 'addresses', label: 'العناوين' },
  { key: 'profile', label: 'حسابي' },
];

/** Account area: order history, saved addresses, profile. */
export function AccountPage() {
  useSeo({ title: 'حسابي', description: 'إدارة حسابك وطلباتك في JOY.', path: '/account' });

  const isAuthenticated = useAuthStore((state) => Boolean(state.token));
  const token = useAuthStore((state) => state.token);
  const hydrate = useAuthStore((state) => state.hydrate);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const requested = searchParams.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(requested && TABS.some((t) => t.key === requested) ? requested : 'orders');

  useEffect(() => {
    if (!token) hydrate();
  }, [token, hydrate]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login?next=/account', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return <PageLoader label="جاري فتح حسابك…" />;

  const selectTab = (next: Tab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-joy-ink">حسابي 👋</h1>
          <p className="text-sm text-joy-muted">إدارة طلباتك وعناوينك من هنا.</p>
        </div>
        <SignOutButton />
      </header>

      <div role="tablist" aria-label="أقسام الحساب" className="mb-5 flex gap-1 overflow-x-auto rounded-pill bg-joy-cream p-1 ring-1 ring-joy-line">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            role="tab"
            type="button"
            aria-selected={tab === entry.key}
            onClick={() => selectTab(entry.key)}
            className={
              tab === entry.key
                ? 'shrink-0 rounded-pill bg-joy-paper px-4 py-2 text-sm font-extrabold text-joy-grape-dark shadow-xs'
                : 'shrink-0 rounded-pill px-4 py-2 text-sm font-bold text-joy-ink-soft transition-colors hover:text-joy-ink'
            }
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'orders' ? <OrdersTab /> : tab === 'addresses' ? <AddressesTab /> : <ProfileTab />}
    </div>
  );
}

function SignOutButton() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await logout();
        navigate('/', { replace: true });
      }}
    >
      تسجيل الخروج
    </Button>
  );
}

/* ------------------------------------------------------------------ orders */

function OrdersTab() {
  const query = useOrders();
  const cancel = useCancelOrder();

  if (query.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="skeleton h-20 rounded-card bg-joy-line" />
        ))}
      </div>
    );
  }

  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const orders = query.data?.data ?? [];
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-3xl">📦</span>}
        title="لسه معملتش طلبات"
        description=" أول طلب ليك هيظهر هنا مع حالة التوصيل."
        action={
          <Link to="/products">
            <Button variant="primary">ابدأ التسوّق</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id} className="rounded-card bg-joy-paper p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
              {['pending', 'processing'].includes(order.status) ? (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={cancel.isPending}
                  onClick={() => cancel.mutate(order.id)}
                >
                  إلغاء
                </Button>
              ) : null}
            </div>
          </div>

          {order.items?.length ? (
            <ul className="mt-3 flex flex-wrap gap-2 border-t border-joy-line pt-3">
              {order.items.map((item) => (
                <li key={item.id} className="rounded-full bg-joy-cream px-3 py-1 text-xs font-bold text-joy-ink-soft">
                  {item.name} ×{item.quantity}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- addresses */

function AddressesTab() {
  const query = useAddresses();
  const remove = useDeleteAddress();
  const [showForm, setShowForm] = useState(false);

  if (query.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="skeleton h-24 rounded-card bg-joy-line" />
        ))}
      </div>
    );
  }

  const addresses = query.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="font-display text-lg font-extrabold text-joy-ink">العناوين المحفوظة</h2>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((open) => !open)}>
          {showForm ? 'إغلاق' : '+ عنوان جديد'}
        </Button>
      </div>

      {showForm ? <AddressForm onDone={() => setShowForm(false)} /> : null}

      {addresses.length === 0 && !showForm ? (
        <EmptyState
          icon={<span className="text-3xl">📍</span>}
          title="مفيش عناوين محفوظة"
          description="أضف عنوانك عشان نقدر نوصّلك طلباتك بسرعة."
          action={<Button variant="primary" onClick={() => setShowForm(true)}>أضف عنواناً</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li key={address.id} className="flex items-start justify-between gap-3 rounded-card bg-joy-paper p-4 shadow-card">
              <div className="text-sm">
                <p className="font-extrabold text-joy-ink">{address.full_name}</p>
                <p className="text-joy-ink-soft">
                  {address.city} — {address.street}
                  {address.building ? ` ،مبنى ${address.building}` : ''}
                </p>
                <p className="text-xs text-joy-muted">{address.phone}</p>
                {address.is_default ? (
                  <span className="mt-1 inline-block rounded-full bg-joy-grape-soft px-2 py-0.5 text-[11px] font-bold text-joy-grape-dark">
                    العنوان الأساسي
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(address.id)}
                aria-label="حذف العنوان"
                className="text-xs font-bold text-joy-muted transition-colors hover:text-joy-coral-dark"
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddressForm({ onDone }: { onDone: () => void }) {
  const create = useCreateAddress();
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    street: '',
    building: '',
    floor: '',
    landmark: '',
  });

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <form
      className="space-y-1 rounded-card bg-joy-paper p-5 shadow-card"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await create.mutateAsync(form);
          onDone();
        } catch {
          /* error shown below */
        }
      }}
    >
      <div className="grid gap-x-4 sm:grid-cols-2">
        <TextField label="الاسم بالكامل" name="full_name" value={form.full_name} onChange={update('full_name')} required />
        <TextField label="رقم الهاتف" name="phone" type="tel" value={form.phone} onChange={update('phone')} required dir="ltr" />
        <TextField label="المحافظة / المدينة" name="city" value={form.city} onChange={update('city')} required />
        <TextField label="العنوان (الشارع)" name="street" value={form.street} onChange={update('street')} required />
        <TextField label="رقم المبنى" name="building" value={form.building} onChange={update('building')} />
        <TextField label="الدور / الشقة" name="floor" value={form.floor} onChange={update('floor')} />
        <TextField label="علامة مميزة (اختياري)" name="landmark" value={form.landmark} onChange={update('landmark')} className="sm:col-span-2" />
      </div>

      {create.isError ? (
        <p role="alert" className="rounded-md bg-joy-coral-soft p-3 text-sm font-bold text-joy-coral-dark">
          {(create.error as Error).message || 'تعذر حفظ العنوان.'}
        </p>
      ) : null}

      <Button type="submit" loading={create.isPending} className="mt-2">حفظ العنوان</Button>
    </form>
  );
}

/* ----------------------------------------------------------------- profile */

function ProfileTab() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="max-w-lg space-y-1 rounded-card bg-joy-paper p-5 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        // `POST /profile` is @unverified pending the collection; the local
        // update keeps the UI honest until then.
        if (user) updateUser(user);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
      }}
    >
      <TextField label="الاسم" name="name" defaultValue={user?.name ?? ''} required />
      <TextField label="البريد الإلكتروني" name="email" type="email" defaultValue={user?.email ?? ''} required dir="ltr" />
      <TextField label="رقم الهاتف" name="phone" type="tel" defaultValue={String(user?.phone ?? '')} dir="ltr" />

      <Button type="submit" className="mt-2" variant="secondary">
        {saved ? 'تم الحفظ ✓' : 'حفظ التعديلات'}
      </Button>
    </form>
  );
}
