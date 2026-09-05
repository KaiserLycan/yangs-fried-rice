import { createClient } from "@/lib/supabase/server";

/**
 * Everything the profile screen's chrome displays about the signed-in
 * customer, and the single place that knows which tables and columns it
 * comes from.
 *
 * The column names are deliberately confined to this file. `CLAUDE.md` warns
 * that the schema is still moving and that column names should be treated as
 * likely to change; keeping the reads here means that change lands in one
 * function rather than inside a React component.
 */
export type CustomerProfile = {
  /** May be empty — see the fallback in `readCustomerProfile`. */
  name: string;
  /**
   * ISO `YYYY-MM-DD`, or null — which today is always. There is no
   * date-of-birth column on the customer record yet; it is confirmed as
   * coming and confirmed as optional when it does, so the field is modelled
   * here and reads null until the column lands. The alternative, leaving it
   * out until then, would mean the card that displays it has nothing to read
   * and no empty state to draw.
   */
  dateOfBirth: string | null;
  /** As stored, in whatever shape it was typed — see `formatMobileNumber`. */
  mobile: string | null;
  /**
   * The customer's sign-in identity, read from the authenticated user rather
   * than the customer row. The two are written separately at registration and
   * only the auth copy is the one they actually log in with, so that is the
   * one the screen shows.
   */
  email: string;
  /** ISO timestamp of when the account was created, or null. */
  memberSince: string | null;
  orderCount: number;
  /** Free-text detail of the customer's first saved address, or null. */
  deliverToAddress: string | null;
  /**
   * Every address the customer has saved, in the order `customer_address`
   * returns them. A sign-up writes exactly one today, but the addresses card
   * renders this as a list that happens to contain one entry rather than a
   * single fixed row, because a second address is a confirmed upcoming
   * feature.
   */
  addresses: CustomerAddress[];
};

export type CustomerAddress = {
  id: string;
  /** Free text ("Home", "Work"), or null if the customer never set one. */
  label: string | null;
  addressDetails: string;
  /**
   * No column exists yet. Confirmed as coming — see
   * `.scratch/profile-page/issues/05-backend-handoff.md` — so this reads
   * null rather than being left out, and the card renders its empty state
   * instead of inventing a note.
   */
  deliveryNote: string | null;
  /**
   * No column exists yet either. Always false today: a default is only
   * meaningful once a customer has more than one address, and nothing yet
   * records which one that would be.
   */
  isDefault: boolean;
};

/**
 * Reads the signed-in customer's profile, or null when nobody is signed in.
 *
 * Returning null rather than redirecting keeps the routing decision with the
 * page: this function's job is the data, and a redirect buried in a read is
 * hard to find when a second caller wants different behaviour.
 *
 * Every query degrades to a neutral value rather than throwing. A failure
 * here is far more likely to be a missing row-level-security policy than a
 * real fault, and losing the whole screen because an order count came back
 * empty would be the wrong trade.
 */
export async function readCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [customerResult, orderCountResult, addressesResult] = await Promise.all([
    supabase
      .from("customer")
      .select("name, phone_number")
      .eq("customer_id", user.id)
      .maybeSingle(),
    supabase
      .from("order")
      .select("order_id", { count: "exact", head: true })
      .eq("customer_id", user.id),
    supabase
      .from("customer_address")
      .select("address_id, label, address_details")
      .eq("customer_id", user.id)
      .order("address_id"),
  ]);

  const addresses: CustomerAddress[] = (addressesResult.data ?? []).map(
    (row) => ({
      id: row.address_id,
      label: row.label,
      addressDetails: row.address_details,
      // Neither column exists yet — see the type's own comments.
      deliveryNote: null,
      isDefault: false,
    }),
  );

  // Registration writes the customer row separately from creating the auth
  // user and can leave the second write undone, so a name is not guaranteed.
  // Falling back to the sign-up metadata keeps the avatar and the greeting
  // from rendering blank for an account that is otherwise fine.
  const metadataName = user.user_metadata?.name;
  const name =
    customerResult.data?.name ??
    (typeof metadataName === "string" ? metadataName : "");

  return {
    name,
    // Nothing writes this yet. Named rather than omitted so the card that
    // draws its empty state is reading a real field, and so the day the
    // column lands this file is the only one that changes.
    dateOfBirth: null,
    mobile: customerResult.data?.phone_number ?? null,
    email: user.email ?? "",
    memberSince: user.created_at ?? null,
    orderCount: orderCountResult.count ?? 0,
    // The nav bar's "Deliver to" affordance only ever names the first saved
    // address — it has room for a street and nothing else — so it reads the
    // same list the addresses card does rather than a separate query.
    deliverToAddress: addresses[0]?.addressDetails ?? null,
    addresses,
  };
}
