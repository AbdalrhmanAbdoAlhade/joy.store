import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { wishlist as wishlistApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/queryKeys';
import { primaryImage, type AnyProduct } from '@/lib/utils/product';
import { toNumber } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth.store';
import { useWishlistStore, type WishlistSnapshot } from '@/stores/wishlist.store';

/**
 * Wishlist that works signed out.
 *
 * Guests keep snapshots locally; signed-in users read and write
 * `GET/POST /wishlist`. The same `toggle(product)` call site is used either
 * way, so product cards never branch on auth state.
 *
 * @unverified the exact `POST /wishlist` body (toggle vs add) is pending the
 * Postman collection — the id travels in the body either way.
 */
export function useWishlist() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.token));
  const queryClient = useQueryClient();

  const localItems = useWishlistStore((state) => state.items);
  const toggleLocal = useWishlistStore((state) => state.toggle);
  const hydrateLocal = useWishlistStore((state) => state.hydrate);

  const serverQuery = useQuery({
    queryKey: queryKeys.wishlist.list(),
    queryFn: ({ signal }) => wishlistApi.list({ signal }),
    enabled: isAuthenticated,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status < 500) && failureCount < 1,
    staleTime: 60_000,
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: number) => wishlistApi.toggle({ product_id: productId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all }),
  });

  const ids = useMemo(() => {
    if (isAuthenticated) return (serverQuery.data ?? []).map((item) => item.product_id);
    return Object.keys(localItems).map(Number);
  }, [isAuthenticated, serverQuery.data, localItems]);

  const has = useCallback((productId: number) => ids.includes(productId), [ids]);

  return {
    isAuthenticated,
    ids,
    has,
    /** Guest snapshots, for rendering the wishlist page without the API. */
    localItems: Object.values(localItems),
    isLoading: isAuthenticated ? serverQuery.isPending : false,
    isToggling: toggleMutation.isPending,

    toggle(product: AnyProduct) {
      if (isAuthenticated) {
        toggleMutation.mutate(product.id);
        return;
      }
      toggleLocal(snapshotOf(product));
    },

    /** Remove by id — used where no product payload is available. */
    remove(productId: number) {
      if (isAuthenticated) {
        toggleMutation.mutate(productId);
        return;
      }
      hydrateLocal(Object.values(localItems).filter((item) => item.product_id !== productId));
    },

    /** Pull local ids into the server list once, right after sign-in. */
    async mergeGuestWishlist() {
      if (!isAuthenticated) return;
      const snapshots = Object.values(localItems);
      if (snapshots.length === 0) return;
      for (const snapshot of snapshots) {
        try {
          await wishlistApi.toggle({ product_id: snapshot.product_id });
        } catch {
          /* one failure must not block the rest */
        }
      }
      hydrateLocal([]);
      await queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  };
}

function snapshotOf(product: AnyProduct): WishlistSnapshot {
  const salePrice = product.is_on_sale ? toNumber(product.sale_price) : null;
  return {
    product_id: product.id,
    slug: product.slug,
    name: product.name,
    image: primaryImage(product),
    price: toNumber(product.final_price ?? product.price),
    compare_at: salePrice && salePrice > 0 ? toNumber(product.price) : null,
  };
}
