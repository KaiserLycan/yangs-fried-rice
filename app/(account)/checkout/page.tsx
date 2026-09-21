import { redirect } from "next/navigation";
import { CheckoutScreen } from "@/components/checkout/checkout-screen";
import { ToastProvider } from "@/components/ui/toast";
import { fulfilmentFromParam } from "@/lib/checkout/fulfilment-param";
import { formatOrderTime } from "@/lib/checkout/order-time";
import { readCart } from "@/lib/cart/read-cart";
import { readCustomerProfile } from "@/lib/profile/customer-profile";
import { validateNcrAddress } from "@/lib/address/validate-ncr";

/**
 * Checkout (Browsing8-10, TPI1; GitHub issue #22) — order review and payment
 * method selection.
 *
 * Reads are real: the customer's name, contact and address come from their
 * record, and the cart id and lines come from the same `readCart()` the cart
 * screen uses. Placing the order calls the backend's `submitCart` (PR #68)
 * from `OrderSummaryCard`.
 *
 * `fulfilment` arrives as a query parameter because the cart's Delivery /
 * Pickup toggle has nowhere to persist to — there is no fulfilment column on
 * `cart` or `cart_item` (see `FulfilmentToggle`'s own comment). Carrying the
 * choice in the URL is what stops this screen quoting a total ₱95 different
 * from the one the customer just agreed to on the cart. Anything other than
 * "pickup" reads as delivery, so a typed or stale URL lands on the default
 * both frames draw rather than on an error.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { fulfilment?: string };
}) {
  const [profile, { cartId, lines }] = await Promise.all([
    readCustomerProfile(),
    readCart(),
  ]);

  // Middleware already turns signed-out visitors away from /checkout.
  // Guarded anyway, the same defence-in-depth the cart and profile pages use.
  if (!profile) redirect("/login?next=/checkout");

  const fulfilment = fulfilmentFromParam(searchParams.fulfilment);

  // Distance to the delivery address drives the fee, so the total shown here
  // is the total `submitCart` will charge (it recomputes the same figure
  // server-side). Best effort: if the geocoder is unreachable the fee falls
  // back to the base rate rather than blocking checkout.
  let distanceKm: number | null = null;
  if (fulfilment === "delivery" && profile.deliverToAddress) {
    try {
      const check = await validateNcrAddress(profile.deliverToAddress);
      if (Number.isFinite(check.distanceKm)) distanceKm = check.distanceKm ?? null;
    } catch {
      distanceKm = null;
    }
  }

  return (
    <ToastProvider>
      <CheckoutScreen
        profile={profile}
        cartId={cartId}
        lines={lines}
        fulfilment={fulfilment}
        distanceKm={distanceKm}
        placedAtLabel={formatOrderTime(new Date())}
      />
    </ToastProvider>
  );
}
