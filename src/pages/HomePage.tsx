import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useBanners, useCategories, useProducts } from '@/lib/hooks/useCatalog';
import { useSeo } from '@/lib/hooks/useSeo';
import { BannerBackdrop, WideBanner } from '@/components/banner/BannerSlider';
import { BrandMarquee } from '@/components/brand/BrandMarquee';
import { ProductCard } from '@/components/product/ProductCard';
import { SectionHeading } from '@/components/product/SectionHeading';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Age-band shortcuts — the API has no age-group endpoint, so these link into
 *  the verified `age_group` filter using the ids observed in the data. */
const AGE_SHORTCUTS = [
  { emoji: '👶', label: '٠ – ٢ سنة', age: 1, color: 'bg-joy-sky-soft text-joy-sky-dark' },
  { emoji: '🧒', label: '٣ – ٥ سنوات', age: 2, color: 'bg-joy-sun text-joy-ink' },
  { emoji: '🎒', label: '٦ – ٨ سنوات', age: 3, color: 'bg-joy-mint-soft text-joy-mint-dark' },
  { emoji: '🧠', label: '٩+ سنوات', age: 4, color: 'bg-joy-grape-soft text-joy-grape-dark' },
];

const PROMOS = [
  { to: '/products?filter=sale', emoji: '🎉', title: 'خصومات تصل إلى ٥٠٪', text: 'على مجموعة مختارة', tone: 'bg-joy-coral-soft' },
  { to: '/products?filter=new', emoji: '✨', title: 'وصل حديثاً', text: 'أحدث الألعاب التعليمية', tone: 'bg-joy-grape-soft' },
  { to: '/categories', emoji: '🧸', title: 'كل الأقسام', text: 'تسوّق حسب الفئة', tone: 'bg-joy-mint-soft' },
];

export function HomePage() {
  useSeo({
    title: 'JOY — إلعب وتعلم',
    description:
      'متجر JOY للأطفال: ألعاب تعليمية ومرحة تناسب كل الأعمار، منتجات آمنة ومعتمدة وتوصيل سريع لكل المحافظات.',
    path: '/',
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const categoriesQuery = useCategories();
  const featuredQuery = useProducts({ featured: 1, per_page: 8 });
  const newestQuery = useProducts({ new_arrival: 1, per_page: 8 });
  const saleQuery = useProducts({ on_sale: 1, per_page: 8 });
  // Merchandising slots from `GET /banners` (position is server-filtered).
  const sliderQuery = useBanners('home_slider');
  const wideQuery = useBanners('home_banner');

  /* ---- page-load choreography: hero rises, then cards stagger in ---- */
  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;

      gsap.from('[data-hero]', {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        clearProps: 'all',
      });

      // Each section's cards reveal once, when the section enters view.
      gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
        gsap.from(group.children, {
          scrollTrigger: { trigger: group, start: 'top 88%', once: true },
          y: 28,
          opacity: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.06,
          clearProps: 'all',
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden rounded-panel bg-joy-grape-soft lg:min-h-[380px]">
        {sliderQuery.banners.length > 0 ? (
          <BannerBackdrop banners={sliderQuery.banners} />
        ) : (
          <div className="joy-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        )}

        <div className="relative grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Transparent copy layer — legibility comes from the scrim below,
              not from a panel, so the banner artwork stays the hero. */}
          <div className="max-w-2xl space-y-4">
            <span
              data-hero
              className="inline-flex items-center gap-1.5 rounded-full bg-joy-paper px-3 py-1.5 text-xs font-extrabold text-joy-grape-dark shadow-xs"
            >
              🌟 إلعب وتعلم
            </span>
            <h1 data-hero className="text-3xl leading-tight text-joy-ink sm:text-5xl">
              ألعاب تفرّح <span className="text-joy-coral">وتعلّم</span> صغارك
            </h1>
            <p data-hero className="max-w-lg text-base text-joy-ink-soft sm:text-lg">
              مجموعة مختارة من الألعاب التعليمية والمرحة، بمواد آمنة ومعتمدة تناسب كل عمر —
              مع توصيل سريع لحد باب البيت.
            </p>
            <div data-hero className="flex flex-wrap gap-3 pt-1">
              <Link to="/products">
                <Button size="lg" trailingIcon={<ArrowIcon size={18} />}>
                  تسوّق الآن
                </Button>
              </Link>
              <Link to="/categories">
                <Button size="lg" variant="outline">
                  تصفّح الأقسام
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- age bands */}
      <section className="mt-8" aria-labelledby="age-heading">
        <h2 id="age-heading" className="sr-only">
          تسوّح حسب العمر
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGE_SHORTCUTS.map((band) => (
            <Link
              key={band.age}
              to={`/products?age_group=${band.age}`}
              className={cn(
                'pressable flex items-center gap-3 rounded-card p-4 shadow-card transition-shadow hover:shadow-card-hover',
                band.color,
              )}
            >
              <span className="text-3xl" aria-hidden="true">
                {band.emoji}
              </span>
              <span className="font-display text-sm font-extrabold">{band.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- categories */}
      <section className="mt-10" aria-labelledby="categories-heading">
        <div data-hero>
          <SectionHeading
            title="تسوّق حسب القسم"
            emoji="🧸"
            action={{ to: '/categories', label: 'كل الأقسام' }}
          />
        </div>

        {categoriesQuery.isPending ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="skeleton aspect-square rounded-card bg-joy-line" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <ErrorState error={categoriesQuery.error} onRetry={() => void categoriesQuery.refetch()} />
        ) : (
          <ul data-reveal-group className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {(categoriesQuery.data ?? []).slice(0, 6).map((category) => (
              <li key={category.id}>
                <Link
                  to={`/categories/${category.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-card bg-joy-paper p-3 text-center shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-lg bg-joy-cream">
                    {category.image ? (
                      <img src={category.image} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <span className="text-3xl" aria-hidden="true">
                        🎁
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-1 text-xs font-extrabold text-joy-ink sm:text-sm">
                    {category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------------------------------------------------------- featured */}
      <ProductSection
        id="featured"
        title="ألعاب مميّزة"
        emoji="⭐"
        query={featuredQuery}
        action={{ to: '/products?filter=featured', label: 'عرض المزيد' }}
      />

      {/* ------------------------------------------------------------ promos */}
      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        {PROMOS.map((promo) => (
          <Link
            key={promo.to}
            to={promo.to}
            className={cn(
              'pressable group flex items-center gap-3 rounded-card p-5 shadow-card transition-shadow hover:shadow-card-hover',
              promo.tone,
            )}
          >
            <span className="text-4xl" aria-hidden="true">
              {promo.emoji}
            </span>
            <span>
              <span className="block font-display text-base font-extrabold text-joy-ink">
                {promo.title}
              </span>
              <span className="block text-sm text-joy-ink-soft">{promo.text}</span>
            </span>
            <span
              className="ms-auto text-xl transition-transform duration-200 group-hover:-translate-x-1"
              aria-hidden="true"
            >
              ←
            </span>
          </Link>
        ))}
      </section>

      {/* -------------------------------------------------- wide home banner */}
      {wideQuery.banners[0] ? (
        <section className="mt-10" aria-label={wideQuery.banners[0].title}>
          <WideBanner banner={wideQuery.banners[0]} />
        </section>
      ) : null}

      <ProductSection
        id="new"
        title="وصل حديثاً"
        emoji="✨"
        query={newestQuery}
        action={{ to: '/products?filter=new', label: 'عرض المزيد' }}
      />

      <ProductSection
        id="sale"
        title="عروض لفترة محدودة"
        emoji="🔥"
        query={saleQuery}
        action={{ to: '/products?filter=sale', label: 'عرض المزيد' }}
      />

      <BrandMarquee />
    </div>
  );
}

/** One product row with its own loading / error handling. */
function ProductSection({
  title,
  emoji,
  query,
  action,
}: {
  id: string;
  title: string;
  emoji: string;
  query: ReturnType<typeof useProducts>;
  action: { to: string; label: string };
}) {
  if (query.isPending) {
    return (
      <section className="mt-10">
        <SectionHeading title={title} emoji={emoji} />
        <ProductGridSkeleton count={4} />
      </section>
    );
  }

  if (query.isError) {
    return (
      <section className="mt-10">
        <SectionHeading title={title} emoji={emoji} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  const items = query.data?.data ?? [];

  return (
    <section className="mt-10">
      <div data-hero>
        <SectionHeading title={title} emoji={emoji} action={action} />
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<span className="text-3xl">🎈</span>}
          title="مفيش منتجات هنا دلوقتي"
          description="رجع تاني قريب — بنضيف ألعاب جديدة كل يوم."
        />
      ) : (
        <div data-reveal-group className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {items.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
