import Link from "next/link";

/**
 * "Cart is empty. Back to the menu?" (`132:406` and no-name equivalent
 * inside the desktop rail) — the whole sentence is the link, since it's
 * phrased as a question and a question should behave like one.
 *
 * This is the state every real customer sees today, and correctly so: there
 * is no honest way for the frontend to put a row in a cart when adding to
 * one is still a stubbed write. See `.scratch/ordering-flow/issues/
 * 04-cart.md`.
 */
export function CartEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center px-[20px] py-[48px] text-center">
      <Link
        href="/menu"
        className="text-[14px] text-muted-foreground underline"
      >
        Cart is empty. Back to the menu?
      </Link>
    </div>
  );
}
