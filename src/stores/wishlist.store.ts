import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Wishlist for signed-out visitors.
 *
 * `GET /wishlist` requires a token, and `/products/{id}` 404s (products are
 * keyed by slug), so a guest wishlist cannot be re-resolved later from an id
 * alone. We therefore keep a small snapshot — id, slug and display fields —
 * alongside the id, and reconcile it with the server once they sign in.
 */
export interface WishlistSnapshot {
  product_id: number;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  compare_at: number | null;
}

interface WishlistState {
  items: Record<number, WishlistSnapshot>;
  toggle: (snapshot: WishlistSnapshot) => void;
  has: (productId: number) => boolean;
  /** Replace local contents (used after merging into the server list). */
  hydrate: (snapshots: WishlistSnapshot[]) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: {},

      toggle(snapshot) {
        set((state) => {
          const next = { ...state.items };
          if (next[snapshot.product_id]) {
            delete next[snapshot.product_id];
          } else {
            next[snapshot.product_id] = snapshot;
          }
          return { items: next };
        });
      },

      has(productId) {
        return Boolean(get().items[productId]);
      },

      hydrate(snapshots) {
        const items: Record<number, WishlistSnapshot> = {};
        for (const snapshot of snapshots) items[snapshot.product_id] = snapshot;
        set({ items });
      },

      clear() {
        set({ items: {} });
      },
    }),
    { name: 'joy.wishlist' },
  ),
);
