/**
 * Where a guest's "Sign in to order" goes: the login page, coming back to the
 * same dish afterwards (UI/UX review, docs/user-simulation.md #16). The menu
 * opens `?item=<id>` on arrival, so the customer picks up where they were
 * instead of scrolling back to find it.
 */
export function signInToOrderHref(productId?: string | null): string {
  const next = productId ? `/menu?item=${encodeURIComponent(productId)}` : "/menu";
  return `/login?next=${encodeURIComponent(next)}`;
}

/** The `?item=` a menu URL may carry: a product id, or null for anything else. */
export function itemParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^[0-9a-f-]{36}$/i.test(raw) ? raw : null;
}
