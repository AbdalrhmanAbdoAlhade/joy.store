import { memo } from 'react';
import { Link } from 'react-router-dom';
import { primaryImage, productTags, type AnyProduct } from '@/lib/utils/product';
import { formatAgeGroup, toRating, toNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { Badge, DiscountBadge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { HeartIcon, PlusIcon, StarIcon } from '@/components/ui/Icon';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';

/**
 * The product card.
 *
 * Hierarchy: photo → discount → name → price → actions. Everything the eye
 * needs to decide lives above the fold of the card, and the two actions
 * (add to cart, wishlist) are always visible — never hover-only, because
 * hover does not exist on the touch devices most parents shop from.
 */
export const ProductCard = memo(function ProductCard({
  product,
  index = 0,
}: {
  product: AnyProduct;
  index?: number;
}) {
  const cart = useCart();
  const wishlist = useWishlist();

  const image = primaryImage(product);
  const name = product.name;
  const rating = toRating(product.avg_rating);
  const ageLabel = formatAgeGroup(product.age_group?.min_age ?? null, product.age_group?.max_age ?? null);
  const tags = productTags(product);
  const wished = wishlist.has(product.id);

  const outOfStock = product.variants.length > 0 && product.variants.every((v) => !v.is_in_stock);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-card bg-joy-paper shadow-card transition-shadow duration-200 hover:shadow-card-hover"
      /* Staggered entrance is driven by GSAP; this marks the element. */
      data-card-index={index}
    >
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-lg bg-joy-cream">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-joy-muted/50" aria-hidden="true">
            🧸
          </div>
        )}

        {/* Badges sit on the image, start corner (RTL-correct via logical props). */}
        <div className="absolute start-2 top-2 flex flex-col items-start gap-1.5">
          {product.discount_percentage ? (
            <DiscountBadge percentage={toNumber(product.discount_percentage)} />
          ) : null}
          {product.is_new_arrival ? <Badge tone="mint">جديد</Badge> : null}
          {product.is_featured && !product.is_new_arrival ? <Badge tone="grape">مميّز</Badge> : null}
          {outOfStock ? <Badge tone="neutral">نفد المخزون</Badge> : null}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => wishlist.toggle(product)}
        aria-pressed={wished}
        aria-label={wished ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        className="pressable hit-target absolute end-2 top-2 grid place-items-center rounded-full bg-joy-paper/90 text-joy-muted shadow-xs backdrop-blur-sm transition-colors hover:text-joy-coral data-[wished=true]:text-joy-coral"
        data-wished={wished || undefined}
      >
        <HeartIcon size={18} filled={wished} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2 text-xs text-joy-muted">
          {product.brand ? <span className="font-bold text-joy-ink-soft">{product.brand.name}</span> : null}
          {ageLabel ? <span>· {ageLabel}</span> : null}
        </div>

        <Link
          to={`/products/${product.slug}`}
          className="line-clamp-2 min-h-[2.6em] font-display text-[15px] font-bold leading-snug text-joy-ink transition-colors hover:text-joy-coral-dark"
        >
          {name}
        </Link>

        {tags.length ? (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 1).map((tag) => (
              <Badge key={tag} tone="sky" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-col">
            <Price value={product.final_price ?? product.price} compareAt={product.is_on_sale ? product.price : null} size="sm" />
            {rating > 0 ? (
              <span className="flex items-center gap-1 text-[11px] text-joy-muted">
                <StarIcon size={12} className="text-joy-sun-dark" filled={Math.round(rating) / 5} />
                <span className="price">{rating.toFixed(1)}</span>
                <span>({product.reviews_count})</span>
              </span>
            ) : null}
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => cart.add(product, product.variants.find((v) => v.is_in_stock) ?? null)}
            aria-label={`أضف ${name} إلى السلة`}
            className={cn(
              'pressable hit-target grid size-11 shrink-0 place-items-center rounded-full text-white',
              'bg-joy-coral shadow-[0_4px_0_0_var(--color-joy-coral-dark)] transition-[transform,box-shadow,filter]',
              'hover:brightness-105 active:shadow-[0_2px_0_0_var(--color-joy-coral-dark)]',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            <PlusIcon size={20} />
          </button>
        </div>
      </div>
    </article>
  );
});
