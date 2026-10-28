import { Link } from 'react-router-dom';
import { storageUrl } from '@/lib/api/client';
import { useBrands } from '@/lib/hooks/useCatalog';
import { SectionHeading } from '@/components/product/SectionHeading';
import { cn } from '@/lib/utils/cn';
import type { Brand } from '@/lib/api/types';

/**
 * Moving brand strip — `GET /brands`, replacing the old footer chip list.
 *
 * Design notes:
 * - The strip sits on a candy gradient shelf (sky → cream → pink) under the
 *   dot texture, so the white cards read with real contrast instead of
 *   white-on-cream. Every card is an elevated surface (shadow, no borders),
 *   per the elevation rule in tokens.css.
 * - Each brand gets a palette hue cycled by position: the first letter of
 *   text-only names wears it, and every card shows it as a coloured ring on
 *   hover. Colours are drawn from the `-dark` variants, which hold AA on
 *   white; pink (no dark variant) is ring-only decoration.
 * - The track is rendered **twice** and shifted by exactly 50% of its own
 *   width for a seamless loop. Every item carries its own horizontal padding
 *   instead of a flex `gap`, so the two halves are pixel-identical and the
 *   wrap point never jumps.
 * - Only some brands ship a `logo`; the rest fall back to their name so no
 *   card ever renders empty.
 * - The duplicate half is `aria-hidden` + `inert`: screen readers and the
 *   keyboard only ever meet the first set of links.
 * - Hovering or focusing the strip pauses it. Reduced motion deliberately
 *   keeps this ambient animation (see the exemption in global.css).
 */

/*
 * Text accents are the four hues that measure ≥ 4.5:1 on white (coral 5.3,
 * mint 5.2, grape 6.1, sky 5.6). Sun (~2.2) and pink (no dark variant)
 * appear as hover rings only — decoration, not text.
 */
const HUES = [
  { text: 'text-joy-coral-dark', ring: 'hover:ring-joy-coral/40' },
  { text: 'text-joy-mint-dark', ring: 'hover:ring-joy-sun/50' },
  { text: 'text-joy-grape-dark', ring: 'hover:ring-joy-grape/40' },
  { text: 'text-joy-sky-dark', ring: 'hover:ring-joy-sky/40' },
  { text: 'text-joy-coral-dark', ring: 'hover:ring-joy-pink/50' },
  { text: 'text-joy-mint-dark', ring: 'hover:ring-joy-mint/40' },
];

const SHELF =
  'rounded-panel bg-gradient-to-l from-joy-sky-soft via-joy-cream to-joy-pink-soft shadow-card';

export function BrandMarquee() {
  const query = useBrands();
  const brands = query.data ?? [];

  if (query.isError) return null;

  if (query.isPending) {
    return (
      <section aria-busy="true" aria-label="العلامات التجارية" className="mt-10">
        <SectionHeading title="علامات تجارية تعرفها الصغار" emoji="🏷️" />
        <div className={`${SHELF} py-5`}>
          <div className="flex overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="skeleton mx-2.5 h-16 w-40 rounded-card bg-joy-paper/70 sm:mx-3 sm:h-20 sm:w-48"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  const loop = [...brands, ...brands];

  return (
    <section aria-label="العلامات التجارية" className="mt-10">
      <SectionHeading title="علامات تجارية تعرفها الصغار" emoji="🏷️" />

      <div className={SHELF}>
        <div className="joy-dots overflow-hidden rounded-panel py-5 sm:py-6 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <ul className="joy-marquee flex w-max">
            {loop.map((brand, index) => {
              const duplicate = index >= brands.length;
              return (
                <li
                  key={`${brand.id}-${index}`}
                  className="px-2 sm:px-3"
                  aria-hidden={duplicate || undefined}
                  inert={duplicate}
                >
                  <BrandChip brand={brand} hue={HUES[index % HUES.length]} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function BrandChip({
  brand,
  hue,
}: {
  brand: Brand;
  hue: { text: string; ring: string };
}) {
  const logo = storageUrl(brand.logo);
  const [first = '', ...rest] = brand.name;

  const cardClass = cn(
    'group flex rounded-card bg-joy-paper',
    'shadow-sm ring-1 ring-transparent transition-[transform,box-shadow,ring-color] duration-200',
    'hover:-translate-y-0.5 hover:shadow-card-hover pressable',
    hue.ring,
  );

  /* The backend's `logo` values are photos (not wordmarks), so image
     brands render as cover tiles with the name over an ink scrim — the
     photo reads as art instead of a letterboxed thumbnail. */
  if (logo) {
    return (
      <Link
        to={`/products?brand=${encodeURIComponent(brand.slug)}`}
        className={cn(cardClass, 'relative h-16 w-44 items-end overflow-hidden sm:h-20 sm:w-52')}
      >
        <img
          src={logo}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="relative z-10 w-full bg-gradient-to-t from-joy-ink/70 to-transparent px-3 pb-1.5 pt-5 font-display text-xs font-extrabold text-white sm:text-sm">
          {brand.name}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`/products?brand=${encodeURIComponent(brand.slug)}`}
      className={cn(cardClass, 'h-16 w-40 items-center justify-center px-4 sm:h-20 sm:w-48')}
    >
      <span className="font-display text-base font-extrabold text-joy-ink sm:text-lg">
        <span className={hue.text}>{first}</span>
        {rest.join('')}
      </span>
    </Link>
  );
}
