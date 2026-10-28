import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useProduct, useProductReviews, useProducts } from '@/lib/hooks/useCatalog';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { useSeo } from '@/lib/hooks/useSeo';
import { galleryImages, seoFor } from '@/lib/utils/product';
import { ApiError } from '@/lib/api/errors';
import { formatAgeGroup, formatDate, formatDiscount, toRating, toNumber } from '@/lib/utils/format';
import { Badge, DiscountBadge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { Button, Spinner } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { ErrorState, NotFoundBlock, PageLoader } from '@/components/ui/States';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { SectionHeading, ProductGrid } from '@/components/product/SectionHeading';
import { CheckIcon, HeartIcon, StarIcon, TruckIcon } from '@/components/ui/Icon';

/**
 * Product detail.
 *
 * The route is keyed by **slug** (API.md gotcha #2) — `/products/5` 404s.
 * Gallery, price block, variants, trust signals and reviews all render from
 * one `GET /products/{slug}` payload; related products come from a second,
 * cheap category query.
 */
export function ProductDetailsPage() {
  const { slug } = useParams();
  const query = useProduct(slug);
  const product = query.data;

  useSeo(
    product
      ? {
          ...seoFor(product),
          image: galleryImages(product)[0]?.url,
          path: `/products/${product.slug}`,
        }
      : { title: 'منتج', path: `/products/${slug ?? ''}` },
  );

  if (query.isPending) return <PageLoader label="جاري تحميل المنتج…" />;
  if (query.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        {query.error instanceof ApiError && query.error.isNotFound ? (
          <NotFoundBlock what="المنتج" />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }
  if (!product) return <NotFoundBlock what="المنتج" />;

  const gallery = galleryImages(product);
  const rating = toRating(product.avg_rating);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Breadcrumbs */}
      <nav aria-label="مسار التنقل" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-joy-muted">
        <Link to="/" className="hover:text-joy-coral-dark">الرئيسية</Link>
        <span aria-hidden="true">/</span>
        {product.categories[0] ? (
          <>
            <Link to={`/categories/${product.categories[0].slug}`} className="hover:text-joy-coral-dark">
              {product.categories[0].name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        ) : null}
        <span className="max-w-[14rem] truncate font-bold text-joy-ink">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <Gallery images={gallery} name={product.name} />

        <div className="space-y-4">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.is_on_sale && product.discount_percentage ? (
                <DiscountBadge percentage={toNumber(product.discount_percentage)} />
              ) : null}
              {product.is_new_arrival ? <Badge tone="mint">وصل حديثاً</Badge> : null}
              {product.educational ? <Badge tone="sky">تعليمي</Badge> : null}
              {product.brand ? (
                <Link
                  to={`/products?brand=${encodeURIComponent(product.brand.slug)}`}
                  className="text-sm font-bold text-joy-grape-dark hover:underline"
                >
                  {product.brand.name}
                </Link>
              ) : null}
            </div>

            <h1 className="text-2xl leading-tight text-joy-ink sm:text-3xl">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-joy-muted">
              <span className="price">كود: {product.sku}</span>
              {rating > 0 ? (
                <span className="flex items-center gap-1">
                  <StarIcon size={15} className="text-joy-sun-dark" filled={Math.round(rating) / 5} />
                  <span className="price font-bold text-joy-ink">{rating.toFixed(1)}</span>
                  <span>({product.reviews_count} تقييم)</span>
                </span>
              ) : null}
              <span className="price">{product.sold_count} عملية بيع</span>
            </div>
          </header>

          <PriceBlock
            price={product.final_price ?? product.price}
            compareAt={product.is_on_sale ? product.price : null}
            discount={product.discount_percentage}
          />

          <BuyPanel product={product} />

          {product.short_description || product.description ? (
            <p className="text-sm leading-relaxed text-joy-ink-soft">
              {product.short_description || product.description}
            </p>
          ) : null}

          <TrustSignals product={product} />
        </div>
      </div>

      {/* Specs */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {product.how_to_play ? (
          <InfoCard title="ازاي تلعب؟ 🎮">{product.how_to_play}</InfoCard>
        ) : null}
        <InfoCard title="مواصفات المنتج 📦">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {product.material ? <Spec term="الخامة" value={product.material} /> : null}
            {product.dimensions ? <Spec term="الأبعاد" value={product.dimensions} /> : null}
            {product.weight ? <Spec term="الوزن" value={product.weight} /> : null}
            {product.pieces_count ? <Spec term="عدد القطع" value={String(product.pieces_count)} /> : null}
            {product.age_group ? (
              <Spec
                term="الفئة العمرية"
                value={formatAgeGroup(product.age_group.min_age, product.age_group.max_age) ?? ''}
              />
            ) : null}
            <Spec term="البطاريات" value={product.batteries_included ? 'مرفقة' : product.battery_required ? 'مطلوبة (غير مرفقة)' : 'غير مطلوبة'} />
            {product.certifications.length ? <Spec term="الاعتمادات" value={product.certifications.join('، ')} /> : null}
            <Spec term="تاريخ الإضافة" value={formatDate(product.created_at)} />
          </dl>
        </InfoCard>
      </section>

      <ReviewsSection productId={product.id} count={product.reviews_count} rating={rating} />
      <RelatedProducts categorySlug={product.categories[0]?.slug} currentId={product.id} />
    </div>
  );
}

/* ------------------------------------------------------------- gallery ---- */

function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const current = images[active];

  // Cross-fade on change; skipped for reduced-motion users.
  useGSAP(
    () => {
      if (!frameRef.current || active === 0) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(frameRef.current, { opacity: 0.35 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    },
    { dependencies: [active], scope: frameRef },
  );

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-panel bg-joy-cream text-6xl shadow-card" aria-hidden="true">
        🧸
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={frameRef}
        className="relative aspect-square overflow-hidden rounded-panel bg-joy-cream shadow-card"
      >
        <img src={current!.url} alt={current!.alt || name} className="size-full object-cover" />
        {images.length > 1 ? (
          <span className="price absolute bottom-3 end-3 rounded-full bg-joy-ink/70 px-2.5 py-1 text-xs font-bold text-white">
            {active + 1} / {images.length}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`صورة ${index + 1}`}
              aria-current={index === active}
              className={
                index === active
                  ? 'size-16 shrink-0 overflow-hidden rounded-md ring-2 ring-joy-coral ring-offset-2 ring-offset-joy-paper'
                  : 'size-16 shrink-0 overflow-hidden rounded-md opacity-70 ring-1 ring-joy-line transition-[opacity,box-shadow] duration-200 hover:opacity-100'
              }
            >
              <img src={image.url} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ price ------- */

function PriceBlock({
  price,
  compareAt,
  discount,
}: {
  price: string | number | null;
  compareAt?: string | number | null;
  discount?: number | null;
}) {
  return (
    <div className="rounded-card bg-joy-coral-soft/60 p-4">
      <Price value={price} compareAt={compareAt} size="lg" />
      {compareAt && discount ? (
        <p className="mt-1 text-xs font-bold text-joy-mint-dark">
          🎉 وفّر {formatDiscount(discount)} عن السعر الأصلي
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- buy ------ */

function BuyPanel({ product }: { product: NonNullable<ReturnType<typeof useProduct>['data']> }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const available = useMemo(
    () => product.variants.filter((variant) => variant.is_in_stock),
    [product.variants],
  );
  const selectedVariant = available[0] ?? null;
  const stock = selectedVariant?.available_stock ?? 0;
  const outOfStock = available.length === 0;
  const wished = wishlist.has(product.id);

  async function addToCart() {
    await cart.add(product, selectedVariant, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="space-y-3 rounded-card bg-joy-paper p-4 shadow-card">
      {available.length > 1 ? (
        <div>
          <p className="mb-1.5 text-sm font-bold text-joy-ink-soft">اختر النوع:</p>
          <div className="flex flex-wrap gap-2">
            {available.map((variant) => (
              <span
                key={variant.id}
                className="rounded-full bg-joy-cream px-3 py-1.5 text-xs font-bold text-joy-ink-soft ring-1 ring-joy-line"
              >
                {variant.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            max={Math.max(1, Math.min(stock, 99))}
            disabled={outOfStock}
          />
          <span className="text-xs font-bold text-joy-muted">
            {outOfStock ? 'غير متاح الآن' : stock > 0 && stock <= 5 ? `باقي ${stock} فقط!` : `متاح: ${stock}`}
          </span>
        </div>

      <div className="flex gap-2">
        <Button
          size="lg"
          fullWidth
          loading={cart.isMutating}
          disabled={outOfStock}
          onClick={() => void addToCart()}
          icon={added ? <CheckIcon size={18} /> : undefined}
        >
          {outOfStock ? 'نفد المخزون' : added ? 'اتضافت! ✓' : 'أضف إلى السلة'}
        </Button>

        <Button
          size="lg"
          variant="outline"
          aria-pressed={wished}
          aria-label={wished ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          onClick={() => wishlist.toggle(product)}
          className={wished ? 'text-joy-coral' : undefined}
        >
          <HeartIcon size={20} filled={wished} />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- trust ------ */

function TrustSignals({ product }: { product: NonNullable<ReturnType<typeof useProduct>['data']> }) {
  const rows: { icon: React.ReactNode; text: string }[] = [
    { icon: <TruckIcon size={18} />, text: 'توصيل سريع لكل المحافظات' },
    { icon: <CheckIcon size={18} />, text: 'دفع آمن عند الاستلام' },
  ];
  if (product.choking_hazard) {
    rows.push({ icon: <span aria-hidden="true">⚠️</span>, text: product.safety_warnings || 'احذر خطر ابتلاع القطع الصغيرة' });
  } else if (product.safety_warnings) {
    rows.push({ icon: <CheckIcon size={18} />, text: product.safety_warnings });
  }

  return (
    <ul className="grid gap-2 rounded-card bg-joy-mint-soft p-4 text-sm font-semibold text-joy-ink">
      {rows.map((row, index) => (
        <li key={index} className="flex items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-joy-paper text-joy-mint-dark">
            {row.icon}
          </span>
          {row.text}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------- cards ----- */

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-joy-paper p-5 shadow-card">
      <h2 className="mb-3 font-display text-lg font-extrabold text-joy-ink">{title}</h2>
      <div className="text-sm leading-relaxed text-joy-ink-soft">{children}</div>
    </section>
  );
}

function Spec({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-joy-line py-1.5 last:border-0">
      <dt className="shrink-0 font-bold text-joy-muted">{term}</dt>
      <dd className="text-end font-semibold text-joy-ink">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------ reviews ----- */

function ReviewsSection({ productId, count, rating }: { productId: number; count: number; rating: number }) {
  const query = useProductReviews(productId);
  const reviews = query.data?.data ?? [];

  return (
    <section className="mt-10" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="mb-4 text-xl font-extrabold text-joy-ink">
        التقييمات ⭐
      </h2>

      <div className="rounded-card bg-joy-paper p-5 shadow-card">
        {query.isPending ? (
          <div className="flex justify-center py-6"><Spinner className="size-7 text-joy-grape" /></div>
        ) : reviews.length === 0 ? (
          /* Aggregate counts exist but rows are empty (API.md gotcha #10). */
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} size={22} className="text-joy-sun-dark" filled={rating >= star ? 1 : 0.18} />
              ))}
            </div>
            <p className="text-sm font-bold text-joy-ink">
              {rating > 0 ? `متوسط التقييم ${rating.toFixed(1)} من ٥` : 'لا تقييمات بعد'}
            </p>
            <p className="text-sm text-joy-muted">
              {count > 0
                ? `${count} تقييم من العملاء — أول تقييم ممكن يكون منك!`
                : 'كن أول من يقيّم هذا المنتج.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-joy-line pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon key={star} size={14} className="text-joy-sun-dark" filled={review.rating >= star ? 1 : 0.18} />
                    ))}
                  </span>
                  <span className="text-sm font-bold text-joy-ink">{review.user_name ?? 'عميل JOY'}</span>
                  <span className="text-xs text-joy-muted">{formatDate(review.created_at)}</span>
                </div>
                {review.comment ? <p className="mt-1 text-sm text-joy-ink-soft">{review.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ related ----- */

function RelatedProducts({ categorySlug, currentId }: { categorySlug?: string; currentId: number }) {
  const query = useProducts({ category: categorySlug, per_page: 8 });
  const items = (query.data?.data ?? []).filter((item) => item.id !== currentId).slice(0, 4);

  if (query.isPending) {
    return (
      <section className="mt-10">
        <SectionHeading title="منتجات مشابهة" emoji="🧩" />
        <ProductGridSkeleton count={4} />
      </section>
    );
  }
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <SectionHeading
        title="منتجات مشابهة"
        emoji="🧩"
        action={categorySlug ? { to: `/categories/${categorySlug}`, label: 'عرض الكل' } : undefined}
      />
      <ProductGrid>
        {items.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </ProductGrid>
    </section>
  );
}
