import type { Category } from '@/lib/api/types';

/** A category plus the full chain of slugs beneath it. */
export interface FlatCategory extends Category {
  depth: number;
  /** This slug plus every descendant slug — ready for the `category` filter. */
  slugs: string[];
}

/**
 * Flatten the `/categories` tree for breadcrumbs and side navigation.
 *
 * Note: the backend's `category` filter matches a product's **own** category
 * and does not include child categories (API.md gotcha #3). Use the `slugs`
 * collected here to run a parent-category page across its whole subtree.
 */
export function flattenCategories(categories: Category[], depth = 0): FlatCategory[] {
  return categories.flatMap((category) => {
    const children = category.children ?? [];
    const childEntries = flattenCategories(children, depth + 1);

    const slugs = [
      category.slug,
      ...childEntries.filter((child) => child.parent_id === category.id).flatMap((c) => c.slugs),
    ];

    return [{ ...category, depth, slugs }, ...childEntries];
  });
}

/** Immediate children of a given slug (empty when it is a leaf). */
export function childrenOf(categories: Category[], slug: string): Category[] {
  const parent = categories.find((category) => category.slug === slug);
  return parent?.children ?? [];
}

/** Breadcrumb trail from the root down to `slug`, or `[]` when unknown. */
export function breadcrumbTrail(categories: Category[], slug: string): Category[] {
  for (const category of categories) {
    if (category.slug === slug) return [category];
    const childTrail = breadcrumbTrail(category.children ?? [], slug);
    if (childTrail.length) return [category, ...childTrail];
  }
  return [];
}

/** Count of products per category cannot come from the API — expose a stable
 *  placeholder so cards keep a consistent layout until data exists. */
export function activeLeafCategories(categories: Category[]): Category[] {
  return flattenCategories(categories)
    .filter((category) => category.is_active)
    .map(({ children: _children, depth: _depth, slugs: _slugs, ...rest }) => rest);
}
