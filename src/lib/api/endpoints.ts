import { request, unwrapItem, unwrapList } from './client';
import type {
  Address,
  AddressPayload,
  AddToCartPayload,
  AuthResponse,
  Banner,
  Brand,
  Cart,
  Category,
  CheckoutPayload,
  LoginPayload,
  Order,
  Paginated,
  PlainList,
  ProductDetail,
  ProductListParams,
  ProductListItem,
  RegisterPayload,
  Review,
  RootPaginated,
  ToggleWishlistPayload,
  User,
  WishlistItem,
} from './types';

/* ================================================================ catalog === */

/**
 * Query params accepted by the backend, in the order they are documented in
 * API.md. Anything else (`sort`, `search`, `brand_id`, …) is silently
 * ignored, so building the query from this allow-list keeps intent honest.
 */
function productQuery(params: ProductListParams = {}): Record<string, string> {
  const query: Record<string, string> = {};

  if (params.page) query.page = String(params.page);
  if (params.per_page) query.per_page = String(params.per_page);
  if (params.category) query.category = params.category;
  if (params.brand) query.brand = params.brand;
  if (params.age_group !== undefined) query.age_group = String(params.age_group);
  if (params.featured) query.featured = '1';
  if (params.on_sale) query.on_sale = '1';
  if (params.new_arrival) query.new_arrival = '1';
  if (params.min_price !== undefined) query.min_price = String(params.min_price);
  if (params.max_price !== undefined) query.max_price = String(params.max_price);

  return query;
}

export const products = {
  /** `GET /products` — paginated. */
  list(params: ProductListParams = {}, config = {}) {
    return request<Paginated<ProductListItem>>({
      url: '/products',
      method: 'GET',
      params: productQuery(params),
      ...config,
    });
  },

  /**
   * `GET /products/{slug}` — keyed by **slug**; `/products/5` 404s.
   * Returns `{ data: ProductDetail }`, unwrapped here to `ProductDetail`
   * with `images`, `tags` and `variants[]`.
   */
  async detail(slug: string, config = {}) {
    const payload = await request<{ data: ProductDetail } | ProductDetail>({
      url: `/products/${encodeURIComponent(slug)}`,
      method: 'GET',
      ...config,
    });
    return unwrapItem(payload);
  },

  /** `GET /products/{id}/reviews` — currently empty in the live data. */
  reviews(productId: number, config = {}) {
    return request<Paginated<Review>>({
      url: `/products/${productId}/reviews`,
      method: 'GET',
      ...config,
    });
  },
};

export const categories = {
  /** `GET /categories` — plain array with nested `children[]`. */
  async list(config = {}) {
    const payload = await request<PlainList<Category>>({
      url: '/categories',
      method: 'GET',
      ...config,
    });
    return unwrapList(payload);
  },

  /** `GET /categories/{slug}` — details + children, no products. */
  async detail(slug: string, config = {}) {
    const payload = await request<{ data: Category } | Category>({
      url: `/categories/${encodeURIComponent(slug)}`,
      method: 'GET',
      ...config,
    });
    return unwrapItem(payload);
  },
};

export const brands = {
  /** `GET /brands` — plain array. */
  async list(config = {}) {
    const payload = await request<PlainList<Brand>>({
      url: '/brands',
      method: 'GET',
      ...config,
    });
    return unwrapList(payload);
  },
};

export const search = {
  /**
   * `GET /search?q=` — plain array, not paginated. Matches product name and
   * SKU only (never the slug), and is the **only** search surface: the
   * backend ignores `search`/`q` on `/products`.
   */
  async query(q: string, config = {}) {
    const payload = await request<PlainList<ProductListItem>>({
      url: '/search',
      method: 'GET',
      params: { q },
      ...config,
    });
    return unwrapList(payload);
  },
};

/* ================================================================ banners === */

export const banners = {
  /**
   * `GET /banners` 🟢 — homepage merchandising slots.
   *
   * Uses the **root-level pagination** envelope (no `meta`), and `position`
   * is one of the few filters this API actually applies server-side.
   * `is_active` and the `starts_at`/`ends_at` window are NOT applied by the
   * server, so `useBanners` filters them client-side.
   */
  async list(position?: string, config = {}) {
    const payload = await request<RootPaginated<Banner>>({
      url: '/banners',
      method: 'GET',
      params: position ? { position } : {},
      ...config,
    });
    return payload.data ?? [];
  },
};

/* =================================================================== auth === */

export const auth = {
  /** `POST /auth/login` @unverified — field names pending the collection. */
  login(payload: LoginPayload, config = {}) {
    return request<AuthResponse>({
      url: '/auth/login',
      method: 'POST',
      data: payload,
      ...config,
    });
  },

  /** `POST /auth/register` @unverified */
  register(payload: RegisterPayload, config = {}) {
    return request<AuthResponse>({
      url: '/auth/register',
      method: 'POST',
      data: payload,
      ...config,
    });
  },

  /** `POST /auth/logout` — requires a valid token. */
  logout(config = {}) {
    return request<{ message?: string }>({
      url: '/auth/logout',
      method: 'POST',
      ...config,
    });
  },

  /** `GET /auth/me` — 401 when unauthenticated. */
  async me(config = {}) {
    const payload = await request<{ data: User } | User>({ url: '/auth/me', method: 'GET', ...config });
    return unwrapItem(payload);
  },
};

/* =================================================================== cart === */

export const cart = {
  /** `GET /cart` @unverified */
  async get(config = {}) {
    const payload = await request<{ data: Cart } | Cart>({ url: '/cart', method: 'GET', ...config });
    return unwrapItem(payload);
  },

  /** `POST /cart` @unverified — payload shape pending the collection. */
  async add(payload: AddToCartPayload, config = {}) {
    const response = await request<{ data: Cart } | Cart>({ url: '/cart', method: 'POST', data: payload, ...config });
    return unwrapItem(response);
  },

  /** `PUT /cart/items/{id}` @unverified */
  async updateItem(itemId: number, quantity: number, config = {}) {
    const response = await request<{ data: Cart } | Cart>({
      url: `/cart/items/${itemId}`,
      method: 'PUT',
      data: { quantity },
      ...config,
    });
    return unwrapItem(response);
  },

  /** `DELETE /cart/items/{id}` */
  async removeItem(itemId: number, config = {}) {
    const payload = await request<{ data: Cart } | Cart>({ url: `/cart/items/${itemId}`, method: 'DELETE', ...config });
    return unwrapItem(payload);
  },

  /** `DELETE /cart` — clears the whole cart. */
  async clear(config = {}) {
    const payload = await request<{ data: Cart } | Cart>({ url: '/cart', method: 'DELETE', ...config });
    return unwrapItem(payload);
  },
};

/* ============================================================== wishlist === */

export const wishlist = {
  /** `GET /wishlist` @unverified */
  async list(config = {}) {
    const payload = await request<PlainList<WishlistItem>>({
      url: '/wishlist',
      method: 'GET',
      ...config,
    });
    return unwrapList(payload);
  },

  /** `POST /wishlist` @unverified — the id travels in the body. */
  toggle(payload: ToggleWishlistPayload, config = {}) {
    return request<PlainList<WishlistItem> | WishlistItem>({
      url: '/wishlist',
      method: 'POST',
      data: payload,
      ...config,
    });
  },
};

/* ============================================================= addresses === */

export const addresses = {
  /** `GET /addresses` — paginated envelope. */
  list(config = {}) {
    return request<Paginated<Address>>({ url: '/addresses', method: 'GET', ...config });
  },
  get(id: number, config = {}) {
    return request<{ data: Address } | Address>({ url: `/addresses/${id}`, method: 'GET', ...config }).then(unwrapItem);
  },
  create(payload: AddressPayload, config = {}) {
    return request<{ data: Address } | Address>({ url: '/addresses', method: 'POST', data: payload, ...config }).then(unwrapItem);
  },
  update(id: number, payload: Partial<AddressPayload>, config = {}) {
    return request<{ data: Address } | Address>({
      url: `/addresses/${id}`,
      method: 'PUT',
      data: payload,
      ...config,
    }).then(unwrapItem);
  },
  remove(id: number, config = {}) {
    return request<void>({ url: `/addresses/${id}`, method: 'DELETE', ...config });
  },
};

/* ================================================================ orders === */

export const orders = {
  /** `GET /orders` — paginated envelope. */
  list(config = {}) {
    return request<Paginated<Order>>({ url: '/orders', method: 'GET', ...config });
  },
  detail(id: number, config = {}) {
    return request<{ data: Order } | Order>({ url: `/orders/${id}`, method: 'GET', ...config }).then(unwrapItem);
  },
  cancel(id: number, config = {}) {
    return request<Order>({ url: `/orders/${id}/cancel`, method: 'POST', ...config });
  },
};

/* =============================================================== profile === */

export const profile = {
  update(payload: Partial<{ name: string; email: string; phone: string }>, config = {}) {
    return request<{ data: User } | User>({ url: '/profile', method: 'POST', data: payload, ...config }).then(unwrapItem);
  },
  /** `DELETE /profile` — deletes the account. Destructive; confirm first. */
  remove(config = {}) {
    return request<void>({ url: '/profile', method: 'DELETE', ...config });
  },
};

/* ============================================================== checkout === */

export const checkout = {
  /** `POST /checkout` @unverified — the only checkout route (no GET). */
  place(payload: CheckoutPayload, config = {}) {
    return request<{ data: Order } | Order>({ url: '/checkout', method: 'POST', data: payload, ...config }).then(unwrapItem);
  },
};

export const joyApi = {
  products,
  categories,
  brands,
  search,
  banners,
  auth,
  cart,
  wishlist,
  addresses,
  orders,
  profile,
  checkout,
};
