import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useCart } from '@/lib/hooks/useCart';
import { useCategories, useSearch } from '@/lib/hooks/useCatalog';
import { Button, Spinner } from '@/components/ui/Button';
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '@/components/ui/Icon';

/* ------------------------------------------------------------- search ---- */

/**
 * Search field that opens `GET /search?q=` as you type (debounced inside the
 * hook) and shows a small results flyout — the only search surface the API
 * offers (API.md gotcha #5).
 */
function SearchBox({ onNavigate }: { onNavigate?: () => void }) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const results = useSearch(term, open);

  // Close the flyout when focus or pointer leaves the field.
  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const items = results.data ?? [];

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!term.trim()) return;
          setOpen(false);
          onNavigate?.();
          navigate(`/search?q=${encodeURIComponent(term.trim())}`);
        }}
        className="flex items-center gap-2 rounded-pill bg-joy-cream px-4 py-2.5 ring-1 ring-joy-line transition-[ring-color,box-shadow] duration-150 focus-within:ring-joy-grape focus-within:ring-4 focus-within:ring-joy-grape-soft"
      >
        <SearchIcon size={18} className="shrink-0 text-joy-muted" />
        <input
          type="search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="دور على لعبة…"
          aria-label="بحث في المتجر"
          className="w-full bg-transparent text-sm font-semibold text-joy-ink outline-none placeholder:font-normal placeholder:text-joy-muted"
        />
        {results.isFetching ? <Spinner className="size-4 shrink-0 text-joy-grape" /> : null}
      </form>

      {open && term.trim().length > 0 ? (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-card bg-joy-paper shadow-pop ring-1 ring-joy-line">
          {results.isPending ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="skeleton h-10 rounded-md bg-joy-line" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="p-4 text-center text-sm text-joy-muted">
              مفيش نتائج لـ «{term.trim()}» — جرّب كلمة تانية.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.slice(0, 6).map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                      navigate(`/products/${product.slug}`);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-joy-cream"
                  >
                    {product.primary_image ? (
                      <img
                        src={product.primary_image}
                        alt=""
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-md bg-joy-cream text-xl"
                        aria-hidden="true"
                      >
                        🧸
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-joy-ink">{product.name}</span>
                      <span className="price block text-xs text-joy-coral-dark">
                        {product.final_price != null ? `${product.final_price} ج.م` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t border-joy-line p-2">
                <Link
                  to={`/search?q=${encodeURIComponent(term.trim())}`}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="block rounded-md px-2 py-2 text-center text-sm font-bold text-joy-grape-dark hover:bg-joy-grape-soft"
                >
                  عرض كل النتائج
                </Link>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------- header ---- */

const NAV_LINKS = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/categories', label: 'الأقسام' },
  { to: '/products', label: 'كل الألعاب' },
  { to: '/products?filter=new', label: 'جديدنا' },
  { to: '/products?filter=sale', label: 'عروض' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const cart = useCart();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const categoriesQuery = useCategories();

  // Any navigation closes the mobile drawer.
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  const topCategories = (categoriesQuery.data ?? []).slice(0, 6);

  return (
    <header className="sticky top-0 z-50 border-b border-joy-line/80 bg-joy-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Mobile: menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          className="pressable hit-target -ms-1 grid shrink-0 place-items-center rounded-full text-joy-ink hover:bg-joy-cream lg:hidden"
        >
          {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>

        {/* Logo */}
        <Link to="/" className="hit-target flex shrink-0 items-center gap-2" aria-label="JOY — الصفحة الرئيسية">
          <span className="grid size-9 place-items-center rounded-xl bg-joy-coral text-lg font-extrabold text-joy-ink shadow-[0_3px_0_0_var(--color-joy-coral-dark)]">
            J
          </span>
          <span className="hidden font-display text-2xl font-extrabold tracking-tight text-joy-ink sm:block">
            JOY
          </span>
        </Link>

        {/* Desktop search */}
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBox />
        </div>

        <div className="ms-auto flex items-center gap-1">
          {/* Wishlist */}
          <NavLink
            to="/wishlist"
            aria-label="المفضلة"
            className={({ isActive }) =>
              cn(
                'pressable hit-target relative grid place-items-center rounded-full text-joy-ink transition-colors hover:bg-joy-cream',
                isActive && 'text-joy-coral',
              )
            }
          >
            <HeartIcon size={21} />
          </NavLink>

          {/* Cart with count badge */}
          <NavLink
            to="/cart"
            aria-label={`سلة التسوق، ${cart.totals.count} منتج`}
            className={({ isActive }) =>
              cn(
                'pressable hit-target relative grid place-items-center rounded-full text-joy-ink transition-colors hover:bg-joy-cream',
                isActive && 'text-joy-coral',
              )
            }
          >
            <CartIcon size={21} />
            {cart.totals.count > 0 ? (
              <span className="price absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-joy-coral-dark px-1 py-0.5 text-[10px] font-extrabold leading-none text-white ring-2 ring-joy-paper">
                {cart.totals.count > 99 ? '99+' : cart.totals.count}
              </span>
            ) : null}
          </NavLink>

          {/* Account / user menu */}
          {token ? (
            <div className="flex items-center gap-1">
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  cn(
                    'pressable flex items-center gap-2 rounded-pill py-1.5 pe-3 ps-1.5 text-sm font-bold transition-colors',
                    isActive ? 'bg-joy-grape-soft text-joy-grape-dark' : 'text-joy-ink hover:bg-joy-cream',
                  )
                }
              >
                <span className="grid size-7 place-items-center rounded-full bg-joy-grape text-xs font-extrabold text-white">
                  {(user?.name ?? 'م').slice(0, 1)}
                </span>
                <span className="hidden max-w-24 truncate sm:block">{user?.name ?? 'حسابي'}</span>
              </NavLink>
              <button
                type="button"
                onClick={() => void logout()}
                className="hidden text-xs font-bold text-joy-muted transition-colors hover:text-joy-coral-dark sm:block"
              >
                خروج
              </button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="primary" icon={<UserIcon size={16} />}>
                <span className="hidden sm:inline">دخول</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search — its own row so it never fights the logo for space */}
      <div className="border-t border-joy-line/70 px-4 py-2 md:hidden">
        <SearchBox />
      </div>

      {/* Category strip (desktop) */}
      <nav aria-label="الأقسام" className="hidden border-t border-joy-line/70 bg-joy-cream/60 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6 py-1.5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-pill px-3.5 py-1.5 text-sm font-bold transition-colors',
                  isActive ? 'bg-joy-paper text-joy-coral-dark shadow-xs' : 'text-joy-ink-soft hover:bg-joy-paper/70',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}

          <span className="mx-2 h-5 w-px shrink-0 bg-joy-line-strong" aria-hidden="true" />

          {topCategories.map((category) => (
            <NavLink
              key={category.id}
              to={`/categories/${category.slug}`}
              className="shrink-0 rounded-pill px-3 py-1.5 text-sm font-semibold text-joy-ink-soft transition-colors hover:bg-joy-paper/70 hover:text-joy-grape-dark"
            >
              {category.name}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="border-t border-joy-line bg-joy-paper lg:hidden" id="mobile-menu">
          <nav aria-label="القائمة الرئيسية" className="max-h-[70dvh] overflow-y-auto px-4 py-3">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-md px-3 py-2.5 font-bold transition-colors',
                        isActive ? 'bg-joy-coral-soft text-joy-coral-dark' : 'text-joy-ink hover:bg-joy-cream',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li className="my-2 border-t border-joy-line pt-2" />
              <li className="px-3 pb-1 text-xs font-extrabold text-joy-muted">تصفّح حسب القسم</li>
              {topCategories.map((category) => (
                <li key={category.id}>
                  <NavLink
                    to={`/categories/${category.slug}`}
                    className="block rounded-md px-3 py-2 font-semibold text-joy-ink-soft transition-colors hover:bg-joy-cream"
                  >
                    {category.name}
                  </NavLink>
                </li>
              ))}
              <li className="my-2 border-t border-joy-line pt-2" />
              <li>
                <NavLink
                  to={token ? '/account' : '/login'}
                  className="block rounded-md px-3 py-2.5 font-bold text-joy-grape-dark hover:bg-joy-grape-soft"
                >
                  {token ? 'حسابي' : 'تسجيل الدخول'}
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
