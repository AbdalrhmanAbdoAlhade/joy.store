import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { storageUrl } from '@/lib/api/client';
import type { Banner } from '@/lib/api/types';

/**
 * Hero backdrop — `GET /banners?position=home_slider` as a full-bleed,
 * crossfading background behind the transparent hero copy.
 *
 * Design notes:
 *  - `object-cover`: nothing textual lives on the artwork — the offer sits
 *    directly on top — so cropping for full-bleed coverage costs nothing.
 *  - Purely decorative: images are `aria-hidden`, unlinked and
 *    pointer-events-none, so the hero copy and its CTAs are the only
 *    interactive layer. The dots stay real buttons for anyone who wants to
 *    step through (both live banners currently ship `link: null` anyway).
 *  - Autoplay parks itself entirely under `prefers-reduced-motion`.
 */
export function BannerBackdrop({ banners }: { banners: Banner[] }) {
  const count = banners.length;
  const [active, setActive] = useState(0);
  const index = count > 0 ? active % count : 0;

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % count), 5000);
    return () => window.clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      <div aria-hidden="true" className="absolute inset-0">
        {banners.map((banner, slideIndex) => {
          const src = storageUrl(banner.image);
          if (!src) return null;
          return (
            <img
              key={banner.id}
              src={src}
              alt=""
              draggable={false}
              loading={slideIndex === 0 ? 'eager' : 'lazy'}
              fetchPriority={slideIndex === 0 ? 'high' : 'auto'}
              className={cn(
                'absolute inset-0 size-full object-cover transition-opacity duration-500 ease-[var(--ease-out)]',
                slideIndex === index ? 'opacity-100' : 'opacity-0',
              )}
            />
          );
        })}

        {/* Legibility scrim — the copy sits directly on the artwork (no
            panel), so ink text needs a light wash under it:
            uniform on mobile where copy spans full width; directional on
            desktop, strongest on the RTL-start side and fading to almost
            nothing on the far side so the banner stays vivid. */}
        <div className="absolute inset-0 bg-joy-cream/75 lg:hidden" />
        <div className="absolute inset-0 hidden bg-linear-to-l from-joy-cream/95 via-joy-cream/75 to-joy-cream/10 lg:block" />
      </div>

      {count > 1 ? (
        <div className="absolute bottom-4 end-4 z-10 flex items-center gap-1.5 rounded-pill bg-joy-ink/45 px-2.5 py-1.5 pointer-events-auto backdrop-blur-sm sm:bottom-5 sm:end-5">
          {banners.map((banner, dotIndex) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`الشريحة ${dotIndex + 1}: ${banner.title}`}
              aria-current={dotIndex === index ? 'true' : undefined}
              onClick={() => setActive(dotIndex)}
              className={cn(
                'h-2 rounded-full transition-[width,background-color] duration-200',
                dotIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/90',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Single wide banner — `GET /banners?position=home_banner`.
 *
 * The live asset is 16:9 (1376×768), so the mobile stage matches it exactly
 * (zero crop); the wider desktop stage trims ~11% from top and bottom, which
 * keeps centred artwork intact while avoiding a viewport-tall banner.
 */
export function WideBanner({ banner }: { banner: Banner }) {
  const src = storageUrl(banner.image);
  if (!src) return null;

  const frame = (
    <div className="overflow-hidden rounded-panel bg-joy-cream shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <img
        src={src}
        alt={banner.title}
        loading="lazy"
        className="aspect-[16/9] w-full object-cover sm:aspect-[16/7]"
      />
    </div>
  );

  if (!banner.link) return frame;

  const isExternal = /^https?:\/\//i.test(banner.link);
  return isExternal ? (
    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block">
      {frame}
      <span className="sr-only"> (يفتح في تبويب جديد)</span>
    </a>
  ) : (
    <Link to={banner.link} className="block">
      {frame}
    </Link>
  );
}
