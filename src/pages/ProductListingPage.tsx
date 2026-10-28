import { useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useQuery } from '@tanstack/react-query';
import { useBrands, useFlatCategories } from '@/lib/hooks/useCatalog';
import { useSeo } from '@/lib/hooks/useSeo';
import { breadcrumbTrail } from '@/lib/utils/categoryTree';
import { products as productsApi } from '@/lib/api/endpoints';
import { retryUnlessClientError } from '@/lib/hooks/useCatalog';
import { ApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Paginated, ProductListItem, ProductListParams } from '@/lib/api/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGrid } from '@/components/product/SectionHeading';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'الأبرز' },
  { key: 'newest', label: 'الأحدث' },
  { key: 'price-asc', label: 'السعر: الأقل' },
  { key: 'price-desc', label: 'السعر: الأعلى' },
  { key: 'rating', label: 'الأعلى تقييماً' },
];

/**
 * Product listing.
 *
 * Server-side filters (from the verified query matrix in API.md):
 * `category`, `brand`, `age_group`, `featured`, `on_sale`, `new_arrival`,
 * `min_price`, `max_price`.
 *
 * Two backend gaps are closed here:
 *  - `category` does **not** include child categories (gotcha #3), so a
 *    category page requests every descendant slug in parallel and merges.
 *  - there is **no sort param** (gotcha #4), so ordering runs client-side.
 */
export function ProductListingPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const flatCategories = useFlatCategories();
  const brandsQuery = useBrands();
  const [sort, setSort] = useState<SortKey>('relevance');

  const filter = searchParams.get('filter');
  const brandSlug = searchParams.get('brand') ?? undefined;
  const ageGroup = searchParams.get('age_group') ?? undefined;

  const breadcrumb = slug ? breadcrumbTrail(flatCategories, slug) : [];

  useSeo({
    title: breadcrumb.at(-1)?.name ?? (filter === 'sale' ? 'العروض' : 'كل الألعاب'),
    description: 'تسوّق ألعاب الأطفال التعليمية والمرحة في JOY — فلترة حسب القسم والعمر والعلامة التجارية.',
    path: slug ? `/categories/${slug}` : '/products',
  });

  // This slug plus every descendant — the subtree the API must be asked for.
  const categorySlugs = useMemo(() => {
    if (!slug) return [] as string[];
    const entry = flatCategories.find((category) => category.slug === slug);
    return entry ? entry.slugs : [slug];
  }, [slug, flatCategories]);

  const params: ProductListParams = {
    brand: brandSlug,
    age_group: ageGroup,
    featured: filter === 'featured' ? 1 : undefined,
    on_sale: filter === 'sale' ? 1 : undefined,
    new_arrival: filter === 'new' ? 1 : undefined,
    per_page: 48,
  };

  const subtreeKey = [...categorySlugs].sort();

  const query = useQuery({
    queryKey: [...queryKeys.products.list(params), 'subtree', subtreeKey],
    enabled: slug ? subtreeKey.length > 0 : true,
    retry: retryUnlessClientError,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      // No category selected → a single request, exactly as documented.
      if (subtreeKey.length === 0) {
        return productsApi.list(params, { signal });
      }
      // Otherwise fetch the subtree in parallel and merge into one envelope.
      const pages = await Promise.all(
        subtreeKey.map((category) => productsApi.list({ ...params, category }, { signal })),
      );
      const data = pages.flatMap((page) => page.data);
      const total = pages.reduce((sum, page) => sum + page.meta.total, 0);
      const template = pages[0]!.meta;
      const merged: Paginated<ProductListItem> = {
        data,
        links: { first: null, last: null, prev: null, next: null },
        meta: { ...template, total, from: data.length ? 1 : null, to: data.length || null },
      };
      return merged;
    },
  });

  // ---- client-side sorting (API has no sort param — gotcha #4) ----
  const items = useMemo(() => {
    const all = [...(query.data?.data ?? [])];
    switch (sort) {
      case 'price-asc':
        return all.sort((a, b) => (a.final_price ?? 0) - (b.final_price ?? 0));
      case 'price-desc':
        return all.sort((a, b) => (b.final_price ?? 0) - (a.final_price ?? 0));
      case 'rating':
        return all.sort(
          (a, b) => Number.parseFloat(b.avg_rating ?? '0') - Number.parseFloat(a.avg_rating ?? '0'),
        );
      case 'newest':
        return all.sort((a, b) => b.id - a.id);
      default:
        return all;
    }
  }, [query.data, sort]);

  const total = query.data?.meta.total ?? 0;
  const isLoading = query.isPending && (slug ? subtreeKey.length > 0 : true);

  // Cards animate in once data lands, or whenever the order changes.
  const gridRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (isLoading || !gridRef.current) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from(gridRef.current.children, {
        y: 20,
        opacity: 0,
        duration: 0.45,
        ease: 'power3.out',
        stagger: 0.04,
        clearProps: 'all',
      });
    },
    { dependencies: [isLoading, sort, total], scope: gridRef },
  );

  // The URL is the source of truth for filters — removing one edits the URL.
  const removeParam = (key: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const activeChips: { key: string; label: string }[] = [];
  if (slug)
    activeChips.push({ key: 'category', label: `القسم: ${breadcrumb.at(-1)?.name ?? slug}` });
  if (brandSlug)
    activeChips.push({
      key: 'brand',
      label: `العلامة: ${brandsQuery.data?.find((b) => b.slug === brandSlug)?.name ?? brandSlug}`,
    });
  if (ageGroup) activeChips.push({ key: 'age_group', label: 'فلتر عمري' });
  if (filter)
    activeChips.push({
      key: 'filter',
      label: filter === 'sale' ? 'عرض الخصومات' : filter === 'new' ? 'وصل حديثاً' : 'ألعاب مميّزة',
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {breadcrumb.length ? (
        <nav aria-label="مسار التنقل" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-joy-muted">
          <Link to="/" className="hover:text-joy-coral-dark">الرئيسية</Link>
          <span aria-hidden="true">/</span>
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {index < breadcrumb.length - 1 ? (
                <>
                  <Link to={`/categories/${crumb.slug}`} className="hover:text-joy-coral-dark">{crumb.name}</Link>
                  <span aria-hidden="true">/</span>
                </>
              ) : (
                <span className="font-bold text-joy-ink">{crumb.name}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-joy-ink sm:text-3xl">
            {breadcrumb.at(-1)?.name ??
              (filter === 'sale' ? 'العروض 🔥' : filter === 'new' ? 'وصل حديثاً ✨' : 'كل الألعاب 🎮')}
          </h1>
          <p className="price mt-1 text-sm text-joy-muted">{total} منتج</p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-bold text-joy-ink-soft">ترتيب:</label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-pill border border-joy-line-strong bg-joy-paper px-3 py-2 text-sm font-bold text-joy-ink focus:border-joy-grape focus:outline-none focus:ring-4 focus:ring-joy-grape-soft"
          >
            {SORTS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </div>
      </header>

      {activeChips.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeParam(chip.key)}
              className="pressable inline-flex items-center gap-1.5 rounded-full bg-joy-grape-soft px-3 py-1.5 text-xs font-extrabold text-joy-grape-dark"
            >
              {chip.label}
              <span aria-hidden="true">×</span>
              <span className="sr-only">إزالة الفلتر</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSearchParams({}, { replace: true })}
            className="rounded-full px-3 py-1.5 text-xs font-bold text-joy-muted underline decoration-dotted hover:text-joy-coral-dark"
          >
            مسح الكل
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : query.isError ? (
        <ErrorState
          error={query.error instanceof ApiError ? query.error : query.error}
          onRetry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<span className="text-3xl">🔍</span>}
          title="مفيش منتجات مطابقة"
          description="جرّب تغيّر الفلاتر أو تتصفّح كل الأقسام."
          action={
            <Button variant="primary" onClick={() => setSearchParams({}, { replace: true })}>
              عرض كل المنتجات
            </Button>
          }
        />
      ) : (
        <ProductGrid>
          <div ref={gridRef} className="contents">
            {items.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </ProductGrid>
      )}
    </div>
  );
}
