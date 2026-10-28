import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  banners as bannersApi,
  brands as brandsApi,
  categories as categoriesApi,
  products as productsApi,
  search as searchApi,
} from '@/lib/api/endpoints';
import type { ApiError } from '@/lib/api/errors';
import type {
  Category,
  Paginated,
  ProductListItem,
  ProductListParams,
} from '@/lib/api/types';
import { flattenCategories } from '@/lib/utils/categoryTree';
import { queryKeys } from '@/lib/api/queryKeys';

/** Never burn retries on a 4xx — only transient failures deserve another go. */
export function retryUnlessClientError(failureCount: number, error: Error): boolean {
  const status = (error as ApiError)?.status ?? 0;
  if (status >= 400 && status < 500) return false;
  return failureCount < 2;
}

/* ------------------------------------------------------------------ catalog */

export function useProducts(
  params: ProductListParams,
  options?: Partial<UseQueryOptions<Paginated<ProductListItem>, ApiError>>,
) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => productsApi.list(params, { signal }),
    retry: retryUnlessClientError,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
    ...options,
  });
}

/**
 * Page-based pagination that keeps previously loaded pages on screen, so the
 * next page never flashes an empty grid.
 */
export function useProductsInfinite(baseParams: Omit<ProductListParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list({ ...baseParams, page: 0 }),
    queryFn: ({ pageParam, signal }) =>
      productsApi.list({ ...baseParams, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.links.next) return undefined;
      const nextPage = lastPage.meta.current_page + 1;
      return nextPage <= lastPage.meta.last_page ? nextPage : undefined;
    },
    retry: retryUnlessClientError,
    staleTime: 60_000,
  });
}

export function useProduct(slug: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug ?? ''),
    queryFn: ({ signal }) => productsApi.detail(String(slug), { signal }),
    enabled: Boolean(slug) && enabled,
    retry: retryUnlessClientError,
    staleTime: 5 * 60_000,
  });
}

export function useProductReviews(productId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.reviews(productId ?? 0),
    queryFn: ({ signal }) => productsApi.reviews(Number(productId), { signal }),
    enabled: Boolean(productId) && enabled,
    retry: retryUnlessClientError,
    staleTime: 2 * 60_000,
  });
}

/* ------------------------------------------------------------- categories */

export function useCategories(options?: Partial<UseQueryOptions<Category[], ApiError>>) {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => categoriesApi.list({ signal }),
    retry: retryUnlessClientError,
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug ?? ''),
    queryFn: ({ signal }) => categoriesApi.detail(String(slug), { signal }),
    enabled: Boolean(slug),
    retry: retryUnlessClientError,
    staleTime: 5 * 60_000,
  });
}

/** Flattened tree (self + descendants) for side navigation and breadcrumbs. */
export function useFlatCategories() {
  const query = useCategories();
  return useMemo(() => flattenCategories(query.data ?? []), [query.data]);
}

/* ------------------------------------------------------------------ brands */

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands.list(),
    queryFn: ({ signal }) => brandsApi.list({ signal }),
    retry: retryUnlessClientError,
    staleTime: 5 * 60_000,
  });
}

/* ---------------------------------------------------------------- banners */

/**
 * Homepage banners for one slot (`home_slider`, `home_banner`).
 *
 * The server filters by `position` but ignores `is_active` and the
 * `starts_at`/`ends_at` schedule (API.md), so both are applied here. Each
 * position gets its own cache entry; an unknown slot resolves to `[]`.
 */
export function useBanners(position: string) {
  const query = useQuery({
    queryKey: queryKeys.banners.list(position),
    queryFn: ({ signal }) => bannersApi.list(position, { signal }),
    retry: retryUnlessClientError,
    staleTime: 5 * 60_000,
  });

  const items = useMemo(() => {
    const now = Date.now();
    return (query.data ?? []).filter((banner) => {
      if (!banner.is_active) return false;
      if (banner.starts_at && Date.parse(banner.starts_at) > now) return false;
      if (banner.ends_at && Date.parse(banner.ends_at) < now) return false;
      return true;
    });
  }, [query.data]);

  return { ...query, banners: items };
}

/* ----------------------------------------------------------------- search */

/**
 * Debounced mirror of a controlled input. Typing stays instant; the request
 * fires only after the value has settled.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/**
 * `GET /search?q=` — the only search surface; the backend ignores `search`
 * and `q` on `/products` (API.md, gotcha #4).
 */
export function useSearch(q: string, enabled = true) {
  const term = useDebouncedValue(q.trim(), 250);

  return useQuery({
    queryKey: queryKeys.search.query(term),
    queryFn: ({ signal }) => searchApi.query(term, { signal }),
    enabled: enabled && term.length > 0,
    retry: retryUnlessClientError,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

/* --------------------------------------------------------------- callbacks */

export function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return useMemo(
    () => (key: readonly unknown[]) => queryClient.invalidateQueries({ queryKey: key }),
    [queryClient],
  );
}
