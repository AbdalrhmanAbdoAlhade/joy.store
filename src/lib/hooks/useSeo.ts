import { useEffect } from 'react';

export interface SeoInput {
  title?: string;
  description?: string;
  /** Absolute or app-relative URL for og:image. */
  image?: string | null;
  /** Canonical path, e.g. `/products/lego-classic`. */
  path?: string;
}

const SITE_NAME = import.meta.env.VITE_STORE_NAME ?? 'JOY';
const SUFFIX = `${SITE_NAME} — إلعب وتعلم`;

function upsertMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

/**
 * Per-page document metadata.
 *
 * The API ships `meta_title` / `meta_description` on products, but they are
 * frequently `null`, so every page supplies its own fallback and this hook
 * only overrides what it is given.
 */
export function useSeo({ title, description, image, path }: SeoInput) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SUFFIX}` : SUFFIX;
    document.title = fullTitle;

    upsertMeta('meta[name="description"]', 'name', 'description', description ?? SUFFIX);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description ?? SUFFIX);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');

    if (image) upsertMeta('meta[property="og:image"]', 'property', 'og:image', image);
    if (path) upsertLink('canonical', new URL(path, window.location.origin).toString());
  }, [title, description, image, path]);
}
