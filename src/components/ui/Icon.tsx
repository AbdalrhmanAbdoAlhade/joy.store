/**
 * Inline icon set.
 *
 * One SVG family with a single stroke weight (1.75px), driven entirely by
 * `currentColor` so hover/active states come from CSS colour and opacity —
 * never from a second asset (interface-polish guidance, principles 17 & 18).
 *
 * `aria-hidden` by default: icons that sit next to a text label are
 * decorative and must not be announced twice.
 */

import type { ReactNode } from 'react';

export type IconProps = {
  size?: number | string;
  className?: string;
  /** Set when the icon is the only content and carries meaning. */
  title?: string;
};

function icon(paths: ReactNode, displayName: string) {
  const Component = ({ size = 20, className, title }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {paths}
    </svg>
  );
  Component.displayName = displayName;
  return Component;
}

export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
  'SearchIcon',
);

export const CartIcon = icon(
  <>
    <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.55h7.5a2 2 0 0 0 1.95-1.57L20.5 8H6" />
    <circle cx="9.5" cy="19.5" r="1.4" />
    <circle cx="17" cy="19.5" r="1.4" />
  </>,
  'CartIcon',
);

export const HeartIcon = ({ filled = false, ...props }: IconProps & { filled?: boolean }) => (
  <svg
    width={props.size ?? 20}
    height={props.size ?? 20}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    aria-hidden={props.title ? undefined : true}
    role={props.title ? 'img' : undefined}
    focusable="false"
  >
    {props.title ? <title>{props.title}</title> : null}
    <path d="M12 20.5S3.5 15.2 3.5 9.4A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8.5 2c0 5.8-8.5 11.1-8.5 11.1Z" />
  </svg>
);
HeartIcon.displayName = 'HeartIcon';

export const UserIcon = icon(
  <>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </>,
  'UserIcon',
);

export const MenuIcon = icon(
  <>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </>,
  'MenuIcon',
);

export const CloseIcon = icon(<path d="m6 6 12 12M18 6 6 18" />, 'CloseIcon');

export const ChevronDownIcon = icon(<path d="m6 9 6 6 6-6" />, 'ChevronDownIcon');

/** RTL-aware chevron: points the way the user is moving, not a fixed side. */
export const ArrowIcon = icon(<path d="M5 12h14m-6-6 6 6-6 6" />, 'ArrowIcon');

export const StarIcon = ({ filled = 1, ...props }: IconProps & { filled?: number }) => (
  <svg
    width={props.size ?? 18}
    height={props.size ?? 18}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    aria-hidden={props.title ? undefined : true}
    role={props.title ? 'img' : undefined}
    focusable="false"
    style={{ opacity: filled }}
  >
    {props.title ? <title>{props.title}</title> : null}
    <path d="m12 3.6 2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4-4 5.6-.8L12 3.6Z" />
  </svg>
);
StarIcon.displayName = 'StarIcon';

export const PackageIcon = icon(
  <>
    <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
    <path d="M4 7l8 4 8-4M12 11v10" />
  </>,
  'PackageIcon',
);

export const TrashIcon = icon(
  <>
    <path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13" />
    <path d="M10 11v5M14 11v5" />
  </>,
  'TrashIcon',
);

export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />, 'PlusIcon');
export const MinusIcon = icon(<path d="M5 12h14" />, 'MinusIcon');

export const CheckIcon = icon(<path d="m5 13 4.5 4.5L19 7" />, 'CheckIcon');

export const SparkIcon = icon(
  <>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
    <path d="M18.5 4.5 19 6.3l1.8.5-1.8.5-.5 1.8-.5-1.8-1.8-.5 1.8-.5.5-1.8Z" />
  </>,
  'SparkIcon',
);

export const AlertIcon = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5M12 16h.01" />
  </>,
  'AlertIcon',
);

export const TruckIcon = icon(
  <>
    <path d="M2.5 6.5h10v9h-10z" />
    <path d="M12.5 9.5H17l3.5 3v3h-8z" />
    <circle cx="7" cy="17.5" r="1.75" />
    <circle cx="16.5" cy="17.5" r="1.75" />
  </>,
  'TruckIcon',
);
