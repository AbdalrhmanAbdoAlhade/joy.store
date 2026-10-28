import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { useSeo } from '@/lib/hooks/useSeo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';

/**
 * Login and Register share one card; only the fields and copy differ.
 *
 * After a successful sign-in we merge any guest cart/wishlist into the
 * server's, then continue to `?next=` (set by whatever guard redirected here).
 */
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  useSeo({
    title: isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد',
    description: isLogin ? 'سجّل دخولك إلى JOY.' : 'أنشئ حسابك في JOY وابدأ التسوق.',
    path: isLogin ? '/login' : '/register',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthStore();
  const cart = useCart();
  const wishlist = useWishlist();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const next = new URLSearchParams(location.search).get('next') ?? '/';
  const loading = auth.status === 'loading';

  const update = (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (!isLogin && form.password !== form.password_confirmation) {
      setLocalError('كلمتا المرور غير متطابقتين.');
      return;
    }

    try {
      if (isLogin) {
        await auth.login({ email: form.email.trim(), password: form.password });
      } else {
        await auth.register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          password_confirmation: form.password_confirmation,
          phone: form.phone.trim() || undefined,
        });
      }

      // Pull guest data into the account, then continue where we came from.
      await cart.mergeGuestCart();
      await wishlist.mergeGuestWishlist();
      navigate(next, { replace: true });
    } catch {
      /* auth.error already holds the message */
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-panel bg-joy-paper p-6 shadow-card sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-joy-coral text-2xl font-extrabold text-joy-ink shadow-[0_4px_0_0_var(--color-joy-coral-dark)]">
            J
          </span>
          <h1 className="text-2xl font-extrabold text-joy-ink">
            {isLogin ? 'أهلاً بيك تاني! 👋' : 'أنشئ حسابك 🎉'}
          </h1>
          <p className="mt-1 text-sm text-joy-muted">
            {isLogin ? 'سجّل دخولك عشان ترجّع لسلتك ومفضلتك.' : 'دقيقة واحدة وخلاص — وابدأ اجمع الألعاب.'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-1">
          {!isLogin ? (
            <TextField
              label="الاسم"
              name="name"
              value={form.name}
              onChange={update('name')}
              autoComplete="name"
              required
              placeholder="اسمك الكامل"
            />
          ) : null}

          <TextField
            label="البريد الإلكتروني"
            name="email"
            type="email"
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            required
            placeholder="you@example.com"
            dir="ltr"
          />

          {!isLogin ? (
            <TextField
              label="رقم الهاتف (اختياري)"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              autoComplete="tel"
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
          ) : null}

          <TextField
            label="كلمة المرور"
            name="password"
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            minLength={isLogin ? undefined : 8}
            hint={isLogin ? undefined : '٨ أحرف على الأقل.'}
            placeholder="••••••••"
            dir="ltr"
          />

          {!isLogin ? (
            <TextField
              label="تأكيد كلمة المرور"
              name="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={update('password_confirmation')}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              dir="ltr"
            />
          ) : null}

          {localError ? (
            <p role="alert" className="rounded-md bg-joy-coral-soft p-3 text-sm font-bold text-joy-coral-dark">
              {localError}
            </p>
          ) : null}
          {auth.error ? (
            <p role="alert" className="rounded-md bg-joy-coral-soft p-3 text-sm font-bold text-joy-coral-dark">
              {auth.error}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth loading={loading} className="mt-3">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-joy-muted">
          {isLogin ? 'لسه معندكش حساب؟ ' : 'عندك حساب بالفعل؟ '}
          <Link
            to={isLogin ? `/register${location.search}` : `/login${location.search}`}
            className="font-extrabold text-joy-grape-dark hover:underline"
          >
            {isLogin ? 'أنشئ حساب جديد' : 'سجّل دخولك'}
          </Link>
        </p>
      </div>
    </div>
  );
}
