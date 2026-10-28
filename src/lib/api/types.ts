/* =========================================================================
   JOY API — TypeScript models
   -------------------------------------------------------------------------
   Generated from API.md, which was produced by probing the live Laravel
   backend (GET / HEAD / OPTIONS only). Anything still unverified against the
   Postman collection is marked `@unverified`.

   ⚠️  Backend quirks encoded deliberately:
   - `price` / `sale_price` / `tax_rate` come back as **strings**.
   - `final_price` / `discount_percentage` are **numbers**.
   - `avg_rating` is a **string** ("4.20").
   - `brand` can be `null` (e.g. LEGO products).
   - The product detail route is keyed by **slug**, never by id.
   ========================================================================= */

/* ---------------------------------------------------------------- envelopes */

/** Laravel paginated envelope: { data, links, meta } */
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  path: string;
  links: PaginationLink[];
}

export interface PaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface Paginated<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

/** Plain envelope: { data: [...] } — used by categories, brands, search. */
export interface PlainList<T> {
  data: T[];
}

/* ------------------------------------------------------------------ catalog */

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
}

/**
 * `GET /banners` — homepage merchandising slots (verified 2026-10-26).
 * Envelope is **root-level pagination** (no `meta`), unlike `/products`.
 */
export interface Banner {
  id: number;
  title: string;
  /**
   * Relative storage path (`banners/x.jpg`) or an absolute URL — resolve
   * with `storageUrl()` from the API client.
   */
  image: string;
  /** Destination: absolute URL, internal path, or `null` (no link yet). */
  link: string | null;
  /** Server-side filterable: `home_slider`, `home_banner`, … */
  position: string;
  sort_order: number;
  /** The API ignores `?is_active=` — filter this client-side. */
  is_active: boolean;
  /** Optional schedule window; also filtered client-side. */
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Root-level pagination envelope used by `/banners` and reviews. */
export interface RootPaginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  links: PaginationLink[];
  path: string;
}

export interface AgeGroup {
  id: number;
  name: string;
  /** Lower bound in **months**. */
  min_age: number | null;
  /** Upper bound in **months**. */
  max_age: number | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: number | null;
  children?: Category[];
  sort_order: number;
  is_active: boolean;
}

/** Category as embedded inside a product — children are omitted. */
export type CategoryRef = Omit<Category, 'children'>;

export interface ProductVariant {
  id: number;
  sku: string;
  name: string;
  attributes: Record<string, unknown> | null;
  price: string | null;
  sale_price: string | null;
  final_price: number | null;
  available_stock: number;
  is_in_stock: boolean;
  is_low_stock: boolean;
  is_active: boolean;
  barcode: string | null;
}

export interface ProductImage {
  id: number;
  url: string;
  alt: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
  type: string;
}

/** Fields present in every product payload. */
interface ProductCore {
  id: number;
  /** Arabic display name. */
  name: string;
  /** Latin slug — the value that belongs in the detail route. */
  slug: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  short_description: string | null;
  /** Can be `null` — some products carry no brand. */
  brand: Brand | null;
  age_group: AgeGroup | null;
  gender: string;
  categories: CategoryRef[];
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  battery_required: boolean;
  batteries_included: boolean;
  safety_warnings: string | null;
  /** Toy-safety signal worth surfacing in the UI for parents. */
  choking_hazard: boolean;
  certifications: string[];
  pieces_count: number | null;
  educational: boolean;
  how_to_play: string | null;
  /** Decimal as a string, e.g. "180.00". */
  price: string | null;
  sale_price: string | null;
  /** Numeric and safe to render — use this one. */
  final_price: number | null;
  is_on_sale: boolean;
  discount_percentage: number | null;
  tax_rate: string | null;
  status: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  variants: ProductVariant[];
  /** Stringly-typed rating, e.g. "4.20". Parse before use. */
  avg_rating: string | null;
  reviews_count: number;
  sold_count: number;
  views_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
}

/** `GET /products` list item — no images/videos/tags, has `primary_image`. */
export interface ProductListItem extends ProductCore {
  primary_image: string | null;
}

/** `GET /products/{slug}` — adds gallery and tags, drops `primary_image`. */
export interface ProductDetail extends ProductCore {
  primary_image?: string | null;
  images: ProductImage[];
  /** @unverified — shape not confirmed yet. */
  videos: ProductVideo[];
  tags: ProductTag[];
}

export interface ProductVideo {
  id?: number;
  url: string;
  type?: string;
}

/** Normalised view model used by the UI regardless of payload variant. */
export type Product = ProductListItem | ProductDetail;

/* ------------------------------------------------------------------ reviews */

/**
 * @unverified — `GET /products/{id}/reviews` currently returns an empty list
 * even though `reviews_count` is populated, so the row shape is inferred from
 * the POST body we expect to send. Reconcile with the Postman collection.
 */
export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  user_name?: string | null;
  created_at: string;
}

/* --------------------------------------------------------------- pagination */

/** Query params accepted by `GET /products` (verified against the backend). */
export interface ProductListParams {
  page?: number;
  per_page?: number;
  /** Category **slug**. Does not include child categories. */
  category?: string;
  /** Brand **slug** (not the numeric id). */
  brand?: string;
  /** Numeric age-group **id** (not the label). */
  age_group?: number | string;
  featured?: 1 | boolean;
  on_sale?: 1 | boolean;
  new_arrival?: 1 | boolean;
  min_price?: number;
  max_price?: number;
}

/** Params the backend silently ignores — kept out of the type on purpose. */
export type UnsupportedProductParams =
  | 'sort'
  | 'order'
  | 'search'
  | 'q'
  | 'keyword'
  | 'brand_id'
  | 'category_id'
  | 'status'
  | 'tag'
  | 'educational';

/* --------------------------------------------------------------------- auth */

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  /** @unverified */
  [key: string]: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

/**
 * @unverified — exact envelope (token at root vs under `data`) pending the
 * Postman collection.
 */
export interface AuthResponse {
  token?: string;
  user?: User;
  data?: { token?: string; user?: User };
}

/* --------------------------------------------------------------------- cart */

/**
 * @unverified — the server cart shape has not been observed yet (requires a
 * token). These mirror the product/variant shapes we already know plus the
 * fields a checkout step would need.
 */
export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  price: string | number | null;
  total?: string | number | null;
  /** Full detail payload when the backend populates it. */
  product?: ProductDetail;
  variant?: ProductVariant | null;
}

export interface Cart {
  id?: number;
  items: CartItem[];
  subtotal?: string | number | null;
  tax_total?: string | number | null;
  shipping_total?: string | number | null;
  discount_total?: string | number | null;
  total?: string | number | null;
}

export interface AddToCartPayload {
  product_id: number;
  variant_id?: number;
  quantity: number;
}

/* ----------------------------------------------------------------- wishlist */

export interface WishlistItem {
  id: number;
  product_id: number;
  product?: ProductDetail;
}

export interface ToggleWishlistPayload {
  product_id: number;
}

/* ---------------------------------------------------------------- addresses */

export interface Address {
  id: number;
  full_name: string;
  phone: string;
  city: string;
  area?: string | null;
  street: string;
  building?: string | null;
  floor?: string | null;
  landmark?: string | null;
  is_default?: boolean;
  notes?: string | null;
}

export interface AddressPayload {
  full_name: string;
  phone: string;
  city: string;
  area?: string;
  street: string;
  building?: string;
  floor?: string;
  landmark?: string;
  is_default?: boolean;
  notes?: string;
}

/* ------------------------------------------------------------------- orders */

export interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: string | number;
  total?: string | number;
  product?: ProductDetail;
}

export interface Order {
  id: number;
  number?: string;
  status: string;
  items?: OrderItem[];
  subtotal?: string | number | null;
  shipping_total?: string | number | null;
  total?: string | number | null;
  payment_method?: string | null;
  address?: Address | null;
  created_at: string;
}

export interface CheckoutPayload {
  address_id: number;
  payment_method: string;
  coupon_code?: string;
  notes?: string;
}

/* ------------------------------------------------------------- raw responses */

export type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
  exception?: string;
  trace?: unknown[];
};
