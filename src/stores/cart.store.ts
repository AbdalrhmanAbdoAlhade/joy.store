import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductVariant } from '@/lib/api/types';
import { primaryImage, type AnyProduct } from '@/lib/utils/product';

/**
 * Guest cart.
 *
 * `GET /cart` requires a token, so a signed-out visitor still needs somewhere
 * to put things. Items live in localStorage and are merged into the server
 * cart on sign-in (see `useCart`).
 *
 * A snapshot of the product travels with each line so the cart renders
 * without refetching every item, and stale prices are visible rather than
 * silently wrong.
 */
export interface GuestCartLine {
  id: string;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  /** Denormalised for rendering. */
  name: string;
  slug: string;
  image: string | null;
  price: number;
  /** Original price, for showing the strike-through. */
  compare_at: number | null;
  stock: number;
}

interface CartState {
  lines: GuestCartLine[];
  /** Bumped whenever the list changes, so effects can react precisely. */
  revision: number;

  add: (input: {
    product: AnyProduct;
    variant?: ProductVariant | null;
    quantity?: number;
  }) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  /** Replace local contents (used after merging into the server cart). */
  hydrate: (lines: GuestCartLine[]) => void;
}

function lineId(productId: number, variantId: number | null): string {
  return `${productId}:${variantId ?? 'default'}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      revision: 0,

      add({ product, variant, quantity = 1 }) {
        set((state) => {
          const id = lineId(product.id, variant?.id ?? null);
          const existing = state.lines.find((line) => line.id === id);
          const stock = variant?.available_stock ?? 0;

          if (existing) {
            return {
              revision: state.revision + 1,
              lines: state.lines.map((line) =>
                line.id === id
                  ? { ...line, quantity: clampQuantity(line.quantity + quantity, stock) }
                  : line,
              ),
            };
          }

          const price = variant?.final_price ?? product.final_price ?? 0;
          const compareAt =
            variant?.sale_price && product.price ? Number.parseFloat(product.price) : null;

          return {
            revision: state.revision + 1,
            lines: [
              ...state.lines,
              {
                id,
                product_id: product.id,
                variant_id: variant?.id ?? null,
                quantity: clampQuantity(quantity, stock),
                name: product.name,
                slug: product.slug,
                image: primaryImage(product),
                price,
                compare_at: compareAt,
                stock,
              },
            ],
          };
        });
      },

      setQuantity(lineIdValue, quantity) {
        set((state) => ({
          revision: state.revision + 1,
          lines: state.lines.flatMap((line) => {
            if (line.id !== lineIdValue) return [line];
            if (quantity <= 0) return [];
            return [{ ...line, quantity: clampQuantity(quantity, line.stock) }];
          }),
        }));
      },

      remove(lineIdValue) {
        set((state) => ({
          revision: state.revision + 1,
          lines: state.lines.filter((line) => line.id !== lineIdValue),
        }));
      },

      clear() {
        set((state) => ({ revision: state.revision + 1, lines: [] }));
      },

      hydrate(lines) {
        set((state) => ({ revision: state.revision + 1, lines }));
      },
    }),
    { name: 'joy.cart' },
  ),
);

/** Never allow more than stock; at least 1 when in stock, 0 when not. */
function clampQuantity(quantity: number, stock: number): number {
  const max = Number.isFinite(stock) && stock > 0 ? stock : Number.POSITIVE_INFINITY;
  return Math.max(1, Math.min(Math.floor(quantity), max));
}
