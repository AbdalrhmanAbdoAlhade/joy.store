import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { useSeo } from '@/lib/hooks/useSeo';
import { wishlist as wishlistApi } from '@/lib/api/endpoints';
import { retryUnlessClientError } from '@/lib/hooks/useCatalog';
import { queryKeys } from '@/lib/api/queryKeys';
import type { ProductDetail, WishlistItem } from '@/lib/api/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGrid } from '@/components/product/SectionHeading';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { HeartIcon, TrashIcon } from '@/components/ui/Icon';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Wishlist.
 *
 * Guests render their local snapshots directly — ids alone could never be
 * re-resolved, because `/products/{id}` 404s (API.md gotcha #2). Signed-in
 * users read `GET /wishlist`; when the server embeds the full product we
 * render a real card, otherwise we fall back to the fields it does return.
 */
export function WishlistPage() {
  useSeo({ title: 'المفضلة', description: 'ألعابك المحفوظة في JOY.', path: '/wishlist' });
  const wishlist = useWishlist();

  const serverQuery = useQuery({
    queryKey: queryKeys.wishlist.list(),
    enabled: wishlist.isAuthenticated,
    retry: retryUnlessClientError,
    staleTime: 30_000,
    queryFn: ({ signal }) => wishlistApi.list({ signal }),
  });

  const serverItems = serverQuery.data ?? [];
  const guestItems = wishlist.localItems;

  const fullProducts = useMemo(
    () =>
      serverItems
        .map((item) => item.product)
        .filter((product): product is ProductDetail => Boolean(product)),
    [serverItems],
  );

  const isLoading =
    wishlist.isLoading || (wishlist.isAuthenticated && serverQuery.isPending);
  const isEmpty = wishlist.isAuthenticated
    ? serverItems.length === 0
    : guestItems.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-joy-ink">المفضلة 💖</h1>
        <p className="price text-sm text-joy-muted">
          {isLoading ? '…' : isEmpty ? 'مفيش منتجات محفوظة' : `${wishlist.ids.length} منتج محفوظ`}
        </p>
      </header>

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : isEmpty ? (
        <EmptyState
          icon={<HeartIcon size={28} />}
          title="مفيش ألعاب محفوظة لسه"
          description="اضغط على القلب في أي منتج عشان تحفظه هنا وترجع له بعدين."
          action={
            <Link to="/products">
              <Button variant="primary">تصفّح الألعاب</Button>
            </Link>
          }
        />
      ) : wishlist.isAuthenticated ? (
        fullProducts.length > 0 ? (
          <ProductGrid>
            {fullProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </ProductGrid>
        ) : (
          /* Server returned ids without embedded products — render what we can. */
          <ul className="grid gap-3 sm:grid-cols-2">
            {serverItems.map((item) => (
              <WishlistRow key={item.id} item={item} onRemove={() => wishlist.remove(item.product_id)} />
            ))}
          </ul>
        )
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guestItems.map((snapshot) => (
            <li
              key={snapshot.product_id}
              className="flex items-center gap-3 rounded-card bg-joy-paper p-3 shadow-card"
            >
              <RouterLink
                to={`/products/${snapshot.slug}`}
                className="size-16 shrink-0 overflow-hidden rounded-lg bg-joy-cream"
              >
                {snapshot.image ? (
                  <img src={snapshot.image} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-2xl" aria-hidden="true">🧸</span>
                )}
              </RouterLink>

              <div className="min-w-0 flex-1">
                <RouterLink
                  to={`/products/${snapshot.slug}`}
                  className="line-clamp-2 text-sm font-bold text-joy-ink hover:text-joy-coral-dark"
                >
                  {snapshot.name}
                </RouterLink>
                <Price value={snapshot.price} compareAt={snapshot.compare_at} size="sm" />
              </div>

              <button
                type="button"
                onClick={() => wishlist.remove(snapshot.product_id)}
                aria-label={`إزالة ${snapshot.name} من المفضلة`}
                className="pressable hit-target grid shrink-0 place-items-center rounded-full text-joy-muted transition-colors hover:bg-joy-coral-soft hover:text-joy-coral-dark"
              >
                <TrashIcon size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WishlistRow({ item, onRemove }: { item: WishlistItem; onRemove: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-card bg-joy-paper p-4 shadow-card">
      <span className="text-sm font-bold text-joy-ink">منتج #{item.product_id}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs font-bold text-joy-muted hover:text-joy-coral-dark"
      >
        إزالة
      </button>
    </li>
  );
}
