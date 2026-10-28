import type { ProductListParams } from './types';

/**
 * Query-key factory.
 *
 * Keys are built in a stable order so cache invalidation is predictable:
 * invalidating `queryKeys.products.all` clears every product list, while
 * `queryKeys.products.detail(slug)` can be targeted precisely.
 */
export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params: ProductListParams) => ['products', 'list', params] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    reviews: (productId: number) => ['products', 'reviews', productId] as const,
  },

  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    detail: (slug: string) => ['categories', 'detail', slug] as const,
  },

  brands: {
    all: ['brands'] as const,
    list: () => ['brands', 'list'] as const,
  },

  banners: {
    all: ['banners'] as const,
    list: (position?: string) => ['banners', 'list', position ?? 'all'] as const,
  },

  search: {
    all: ['search'] as const,
    query: (q: string) => ['search', q] as const,
  },

  auth: {
    me: ['auth', 'me'] as const,
  },

  cart: {
    all: ['cart'] as const,
    get: () => ['cart', 'get'] as const,
  },

  wishlist: {
    all: ['wishlist'] as const,
    list: () => ['wishlist', 'list'] as const,
  },

  addresses: {
    all: ['addresses'] as const,
    list: () => ['addresses', 'list'] as const,
  },

  orders: {
    all: ['orders'] as const,
    list: () => ['orders', 'list'] as const,
    detail: (id: number) => ['orders', 'detail', id] as const,
  },
};
