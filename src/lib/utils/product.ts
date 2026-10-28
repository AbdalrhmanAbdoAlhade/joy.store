import type { ProductDetail, ProductListItem } from '@/lib/api/types';

/** Any product payload — the list and detail responses differ slightly. */
export type AnyProduct = ProductListItem | ProductDetail;

/**
 * Resolve the main image across both payload variants.
 * `GET /products` returns `primary_image`; `GET /products/{slug}` returns an
 * `images[]` gallery instead (see API.md).
 */
export function primaryImage(product: AnyProduct): string | null {
  if ('primary_image' in product && product.primary_image) return product.primary_image;
  if ('images' in product && product.images?.length) return product.images[0]?.url ?? null;
  return null;
}

/** Gallery images, falling back to a single entry built from `primary_image`. */
export function galleryImages(product: AnyProduct): { url: string; alt: string }[] {
  if ('images' in product && product.images.length) {
    return product.images.map((image) => ({ url: image.url, alt: image.alt ?? product.name }));
  }
  const main = primaryImage(product);
  return main ? [{ url: main, alt: product.name }] : [];
}

/** Tag labels (e.g. "الأكثر مبيعاً") shown as badges. */
export function productTags(product: AnyProduct): string[] {
  if ('tags' in product) return product.tags.map((tag) => tag.name);
  return [];
}

/** Best available SEO values, falling back to live product content. */
export function seoFor(product: AnyProduct): { title: string; description: string } {
  return {
    title: product.meta_title || product.name,
    description:
      product.meta_description ||
      product.short_description ||
      product.description ||
      product.name,
  };
}
