import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { cart as cartApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/errors';
import type { AddToCartPayload, Cart, ProductVariant } from '@/lib/api/types';
import { queryKeys } from '@/lib/api/queryKeys';
import { primaryImage, type AnyProduct } from '@/lib/utils/product';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore, type GuestCartLine } from '@/stores/cart.store';

/** Normalised line the UI renders regardless of guest/server origin. */
export interface CartLine {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  compare_at: number | null;
  quantity: number;
  stock: number;
  /** Server-side row id — only present for a signed-in cart. */
  serverId: number | null;
  product_id: number;
  variant_id: number | null;
}

function toViewLine(line: GuestCartLine): CartLine {
  return {
    id: line.id,
    name: line.name,
    slug: line.slug,
    image: line.image,
    price: line.price,
    compare_at: line.compare_at,
    quantity: line.quantity,
    stock: line.stock,
    serverId: null,
    product_id: line.product_id,
    variant_id: line.variant_id,
  };
}

/** Defensive mapping — the server cart shape is @unverified in API.md. */
function serverLines(cart: Cart | undefined): CartLine[] {
  if (!cart?.items?.length) return [];
  return cart.items.map((item) => {
    const variant = item.variant ?? null;
    const product = item.product;
    const price =
      typeof item.price === 'number'
        ? item.price
        : Number.parseFloat(String(item.price ?? variant?.final_price ?? product?.final_price ?? 0));
    const stock = variant?.available_stock ?? product?.variants?.[0]?.available_stock ?? 0;
    const image = product ? primaryImage(product) : null;

    return {
      id: `server:${item.id}`,
      name: product?.name ?? `منتج #${item.product_id}`,
      slug: product?.slug ?? '',
      image,
      price: Number.isFinite(price) ? price : 0,
      compare_at: null,
      quantity: item.quantity,
      stock,
      serverId: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
    };
  });
}

export function useCart() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.token));
  const queryClient = useQueryClient();

  const guestLines = useCartStore((state) => state.lines);
  const addLocal = useCartStore((state) => state.add);
  const setQuantityLocal = useCartStore((state) => state.setQuantity);
  const removeLocal = useCartStore((state) => state.remove);
  const clearLocal = useCartStore((state) => state.clear);
  const revision = useCartStore((state) => state.revision);

  const serverCart = useQuery({
    queryKey: queryKeys.cart.get(),
    queryFn: ({ signal }) => cartApi.get({ signal }),
    enabled: isAuthenticated,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status < 500) && failureCount < 1,
    staleTime: 30_000,
  });

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });

  const addMutation = useMutation({
    mutationFn: (payload: AddToCartPayload) => cartApi.add(payload),
    onSuccess: invalidateCart,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSuccess: invalidateCart,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartApi.removeItem(itemId),
    onSuccess: invalidateCart,
  });

  const clearMutation = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: invalidateCart,
  });

  const lines = useMemo<CartLine[]>(
    () => (isAuthenticated ? serverLines(serverCart.data) : guestLines.map(toViewLine)),
    // `revision` forces a re-read of the guest cart after any local change.
    [isAuthenticated, serverCart.data, guestLines, revision],
  );

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    return { subtotal, count };
  }, [lines]);

  return {
    isAuthenticated,
    lines,
    totals,
    isLoading: isAuthenticated ? serverCart.isPending : false,
    error: isAuthenticated ? serverCart.error : null,
    isMutating: addMutation.isPending || updateMutation.isPending || removeMutation.isPending,

    /** Guest lines are added locally; signed-in lines go to the API. */
    add(product: AnyProduct, variant?: ProductVariant | null, quantity = 1) {
      if (isAuthenticated) {
        return addMutation.mutateAsync({
          product_id: product.id,
          variant_id: variant?.id,
          quantity,
        });
      }
      addLocal({ product, variant, quantity });
      return Promise.resolve();
    },

    setQuantity(line: CartLine, quantity: number) {
      if (isAuthenticated && line.serverId != null) {
        updateMutation.mutate({ itemId: line.serverId, quantity });
        return;
      }
      setQuantityLocal(line.id, quantity);
    },

    remove(line: CartLine) {
      if (isAuthenticated && line.serverId != null) {
        removeMutation.mutate(line.serverId);
        return;
      }
      removeLocal(line.id);
    },

    clear() {
      if (isAuthenticated) {
        clearMutation.mutate();
        return;
      }
      clearLocal();
    },

    /** Merge the guest cart into the server cart right after sign-in. */
    async mergeGuestCart() {
      if (!isAuthenticated || guestLines.length === 0) return;
      for (const line of guestLines) {
        try {
          await cartApi.add({
            product_id: line.product_id,
            variant_id: line.variant_id ?? undefined,
            quantity: line.quantity,
          });
        } catch {
          /* one failed line must not block the rest of the merge */
        }
      }
      clearLocal();
      await invalidateCart();
    },
  };
}
