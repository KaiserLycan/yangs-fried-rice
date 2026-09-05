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
  /** ISO timestamp of when the account was created, or null. */
  memberSince: string | null;
  orderCount: number;
  /** Free-text detail of the customer's first saved address, or null. */
  deliverToAddress: string | null;
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

  const [customerResult, orderCountResult, addressResult] = await Promise.all([
    supabase
      .from("customer")
      .select("name")
      .eq("customer_id", user.id)
      .maybeSingle(),
    supabase
      .from("order")
      .select("order_id", { count: "exact", head: true })
      .eq("customer_id", user.id),
    supabase
      .from("customer_address")
      .select("address_details")
      .eq("customer_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

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
    memberSince: user.created_at ?? null,
    orderCount: orderCountResult.count ?? 0,
    deliverToAddress: addressResult.data?.address_details ?? null,
  };
}
