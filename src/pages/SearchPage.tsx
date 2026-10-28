import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearch } from '@/lib/hooks/useCatalog';
import { useSeo } from '@/lib/hooks/useSeo';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGrid } from '@/components/product/SectionHeading';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { SearchIcon } from '@/components/ui/Icon';

/**
 * Search results — `GET /search?q=`, the API's only search surface.
 *
 * The query lives in the URL so a search is shareable and survives reload.
 * The input here rewrites `?q=`, which the hook debounces before requesting.
 */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [term, setTerm] = useState(q);

  useSeo({
    title: q ? `نتائج البحث عن «${q}»` : 'بحث',
    description: 'ابحث في ألعاب JOY بالاسم أو كود المنتج.',
    path: '/search',
  });

  // Keep the input in step when navigation changes ?q= (back/forward).
  useEffect(() => setTerm(q), [q]);

  const query = useSearch(q);
  const results = query.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5 max-w-xl">
        <h1 className="mb-3 text-2xl font-extrabold text-joy-ink">البحث 🔍</h1>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchParams(term.trim() ? { q: term.trim() } : {}, { replace: true });
          }}
          className="flex items-center gap-2 rounded-pill bg-joy-paper px-4 py-3 shadow-card ring-1 ring-joy-line transition-[ring-color] focus-within:ring-joy-grape focus-within:ring-4 focus-within:ring-joy-grape-soft"
        >
          <SearchIcon size={20} className="shrink-0 text-joy-muted" />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="اكتب اسم اللعبة أو كودها…"
            aria-label="بحث"
            autoFocus
            className="w-full bg-transparent font-semibold text-joy-ink outline-none placeholder:font-normal placeholder:text-joy-muted"
          />
          <Button type="submit" size="sm">ابحث</Button>
        </form>
        {q ? (
          <p className="mt-2 text-sm text-joy-muted" aria-live="polite">
            {query.isPending ? 'جاري البحث…' : `${results.length} نتيجة لـ «${q}»`}
          </p>
        ) : null}
      </header>

      {query.isPending ? (
        <ProductGridSkeleton count={8} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : q.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title="اكتب اسم اللعبة اللي تدور عليها"
          description="البحث بيطابق اسم المنتج وكوده (SKU)."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<span className="text-3xl">🕵️</span>}
          title={`مفيش نتائج لـ «${q}»`}
          description="جرّب كلمة أقصر أو مختلف — البحث بيطابق الاسم وكود المنتج بس."
          action={
            <Button variant="primary" onClick={() => { setTerm(''); setSearchParams({}, { replace: true }); }}>
              مسح البحث
            </Button>
          }
        />
      ) : (
        <ProductGrid>
          {results.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </ProductGrid>
      )}
    </div>
  );
}
