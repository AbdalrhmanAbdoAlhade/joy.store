/** Minimal class-name joiner — keeps JSX readable without a dependency. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
