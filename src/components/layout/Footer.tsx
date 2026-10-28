import { Link } from 'react-router-dom';
import { useCategories } from '@/lib/hooks/useCatalog';

/** Footer: store identity, category shortcuts, trust signals. */
export function Footer() {
  const categoriesQuery = useCategories();

  const columns = (categoriesQuery.data ?? []).slice(0, 5);

  return (
    <footer className="mt-16 border-t border-joy-line bg-joy-paper">
      {/* Trust strip */}
      <div className="border-b border-joy-line/70 bg-joy-cream/70">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-4">
          {[
            { emoji: '🚚', title: 'توصيل سريع', text: 'لكل المحافظات' },
            { emoji: '🔒', title: 'دفع آمن', text: 'عند الاستلام' },
            { emoji: '🛡️', title: 'منتجات آمنة', text: 'معتمدة للأطفال' },
            { emoji: '↩️', title: 'استبدال سهل', text: 'خلال 14 يوم' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-joy-paper text-xl shadow-xs" aria-hidden="true">
                {item.emoji}
              </span>
              <span>
                <span className="block text-sm font-extrabold text-joy-ink">{item.title}</span>
                <span className="block text-xs text-joy-muted">{item.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <div className="space-y-3">
          <Link to="/" className="hit-target flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-joy-coral text-lg font-extrabold text-joy-ink shadow-[0_3px_0_0_var(--color-joy-coral-dark)]">
              J
            </span>
            <span className="font-display text-2xl font-extrabold text-joy-ink">JOY</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-joy-muted">
            JOY — إلعب وتعلم. متجر ألعاب الأطفال: ألعاب تعليمية ومرحة تناسب كل الأعمار،
            بمكونات آمنة ومعتمدة.
          </p>
        </div>

        <nav aria-label="الأقسام">
          <h3 className="mb-3 text-sm font-extrabold text-joy-ink">الأقسام</h3>
          <ul className="space-y-2 text-sm">
            {columns.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/categories/${category.slug}`}
                  className="text-joy-muted transition-colors hover:text-joy-coral-dark"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/categories" className="font-bold text-joy-grape-dark hover:underline">
                كل الأقسام ←
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="روابط سريعة">
          <h3 className="mb-3 text-sm font-extrabold text-joy-ink">تسوّق</h3>
          <ul className="space-y-2 text-sm text-joy-muted">
            <li><Link to="/products" className="hover:text-joy-coral-dark">كل الألعاب</Link></li>
            <li><Link to="/products?filter=new" className="hover:text-joy-coral-dark">وصل حديثاً</Link></li>
            <li><Link to="/products?filter=sale" className="hover:text-joy-coral-dark">العروض</Link></li>
            <li><Link to="/wishlist" className="hover:text-joy-coral-dark">المفضلة</Link></li>
            <li><Link to="/account" className="hover:text-joy-coral-dark">طلباتي</Link></li>
          </ul>
        </nav>

      </div>

      <div className="border-t border-joy-line/70 py-4">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-joy-muted sm:px-6">
          © {new Date().getFullYear()} JOY — إلعب وتعلم. كل الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
