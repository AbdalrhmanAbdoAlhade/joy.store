import { Link } from 'react-router-dom';
import { useCategories } from '@/lib/hooks/useCatalog';
import { useSeo } from '@/lib/hooks/useSeo';
import { ErrorState, NotFoundBlock } from '@/components/ui/States';
import { ChevronDownIcon } from '@/components/ui/Icon';

/**
 * Categories index.
 *
 * The API returns a tree (`children[]`), so we render it as an accordion:
 * parents first, children revealed on tap — a full tree sidebar would be
 * unusable on a phone.
 */
export function CategoriesPage() {
  useSeo({ title: 'كل الأقسام', description: 'تصفّح أقسام ألعاب JOY حسب الفئة.', path: '/categories' });
  const query = useCategories();

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton h-24 rounded-card bg-joy-line" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const roots = query.data ?? [];
  if (roots.length === 0) return <NotFoundBlock what="أقسام" />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-joy-ink sm:text-3xl">كل الأقسام 🧸</h1>
        <p className="mt-1 text-joy-muted">اختار القسم اللي يناسب صغيرك وابدأ التسوق.</p>
      </header>

      <ul className="space-y-3">
        {roots.map((category) => {
          const children = category.children ?? [];
          return (
            <li key={category.id} className="overflow-hidden rounded-card bg-joy-paper shadow-card">
              <div className="flex items-center gap-4 p-4">
                <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-joy-cream">
                  {category.image ? (
                    <img src={category.image} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="text-2xl" aria-hidden="true">🎁</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/categories/${category.slug}`}
                    className="font-display text-lg font-extrabold text-joy-ink transition-colors hover:text-joy-coral-dark"
                  >
                    {category.name}
                  </Link>
                  {category.description ? (
                    <p className="line-clamp-1 text-sm text-joy-muted">{category.description}</p>
                  ) : null}
                  {children.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          to={`/categories/${child.slug}`}
                          className="rounded-full bg-joy-cream px-2.5 py-1 text-xs font-bold text-joy-ink-soft ring-1 ring-joy-line transition-colors hover:bg-joy-grape-soft hover:text-joy-grape-dark"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>

                <ChevronDownIcon size={18} className="hidden shrink-0 rotate-[-90deg] text-joy-muted sm:block" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
