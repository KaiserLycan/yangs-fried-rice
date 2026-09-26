import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Issue #114, checked statically.
 *
 * The real enforcement is in Postgres and was verified against the live
 * project when the migrations were applied. These tests stop a later edit
 * from quietly undoing it: re-adding a customer INSERT policy, dropping the
 * row lock from checkout, or putting a direct order insert back in the app.
 */

const MIGRATIONS = "supabase/migrations";
const read = (file: string) => readFileSync(`${MIGRATIONS}/${file}`, "utf8");

const checkout = read("20260927000001_atomic_checkout_and_order_write_lockdown.sql");
const hardening = read("20260927000002_security_hardening_indexes_and_storage.sql");
const pickupOnly = read("20260927000000_pickup_only_drop_rider_and_delivery.sql");
const quantityBounds = read("20260927000003_quantity_bounds_and_search_path.sql");

/** Comments stripped, so an explanation mentioning a statement doesn't count as one. */
const sql = (text: string) => text.replace(/--.*$/gm, "");

describe("atomic checkout (limitations #15)", () => {
  const body = sql(checkout);

  it("locks the cart row before checking it", () => {
    const lock = body.indexOf("FOR UPDATE");
    const finalCheck = body.indexOf("IF v_cart.is_final THEN");
    expect(lock).toBeGreaterThan(-1);
    expect(finalCheck).toBeGreaterThan(lock);
  });

  it("backs the lock with a unique index on order.cart_id", () => {
    expect(body).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS order_cart_id_key\s+ON public\."order" \(cart_id\)/);
  });

  it("prices lines from the menu, not from the caller", () => {
    expect(body).toMatch(/p\.product_price/);
    expect(body).not.toMatch(/p_delivery_fee|p_unit_price|p_subtotal/);
  });

  it("is callable by signed-in users only, and pins its search_path", () => {
    expect(body).toMatch(/REVOKE ALL ON FUNCTION public\.submit_cart_to_order\(uuid, text, text, text\) FROM PUBLIC, anon;/);
    expect(body).toMatch(/GRANT EXECUTE ON FUNCTION public\.submit_cart_to_order\(uuid, text, text, text\) TO authenticated;/);
    expect(body).toMatch(/SECURITY DEFINER\s+SET search_path = public/);
  });

  it("refuses a disabled customer", () => {
    expect(body).toMatch(/ACCOUNT_DISABLED/);
  });

  // Persona review (DBA / QA): the function trusts cart_item.quantity, which
  // customers write directly, so the column itself refuses a negative one.
  it("cannot be fed a zero or negative quantity", () => {
    const bounds = sql(quantityBounds);
    expect(bounds).toMatch(/cart_item_quantity_range CHECK \(quantity BETWEEN 1 AND 99\)/);
    expect(bounds).toMatch(/order_item_quantity_positive CHECK \(quantity > 0\)/);
  });
});

describe("customers cannot write orders directly (limitations #21)", () => {
  const body = sql(checkout);

  it.each([
    ['"customer_insert_own_orders"', 'public."order"'],
    ['"customer_insert_own_order_items"', "public.order_item"],
    ['"customer_insert_own_order_add_on"', "public.order_add_on"],
    ['"customer_insert_own_order_item_add_on"', "public.order_item_add_on"],
  ])("drops %s", (policy, table) => {
    expect(body).toContain(`DROP POLICY IF EXISTS ${policy}`);
    expect(body).toContain(table);
  });

  it("does not re-create any customer INSERT policy on the order tables", () => {
    expect(body).not.toMatch(/CREATE POLICY "customer_insert/);
  });

  it("limits a customer's cancel to the status and cancellation fields", () => {
    expect(body).toMatch(/to_jsonb\(NEW\) - ARRAY\['order_status', 'cancelled_at', 'cancellation_reason'\]/);
    expect(body).toMatch(/CREATE TRIGGER trg_guard_customer_order_update\s+BEFORE UPDATE ON public\."order"/);
  });

  it("submitCart places orders only through the database function", () => {
    const cart = readFileSync("lib/actions/cart.ts", "utf8");
    const submit = cart.slice(
      cart.indexOf("export async function submitCart("),
      cart.indexOf("export async function switchOrderToCashOnDelivery("),
    );
    expect(submit).toContain('rpc("submit_cart_to_order"');
    expect(submit).not.toMatch(/\.from\("(order|order_item|order_add_on|order_item_add_on|transaction)"\)/);
  });

  it("requireCustomer verifies the token with getUser, not getSession", () => {
    const cart = readFileSync("lib/actions/cart.ts", "utf8");
    const guard = cart.slice(
      cart.indexOf("async function requireCustomer("),
      cart.indexOf("// 1. Get Active Cart"),
    );
    expect(guard).toContain("auth.getUser()");
    expect(guard).not.toContain("getSession(");
    expect(guard).toContain("is_account_disabled");
  });
});

describe("security hardening", () => {
  const body = sql(hardening);

  it("stops disabled employees counting as employees in RLS", () => {
    expect(body).toMatch(/coalesce\(e\.is_account_disabled, false\) = false/);
  });

  it("refuses self-promotion and self-re-enabling", () => {
    expect(body).toMatch(/CREATE TRIGGER trg_guard_employee_self_update/);
    expect(body).toMatch(/CREATE TRIGGER trg_guard_customer_self_update/);
  });

  it("revokes the auth trigger function from API roles", () => {
    expect(body).toMatch(
      /REVOKE EXECUTE ON FUNCTION public\.handle_password_timestamp_update\(\) FROM PUBLIC, anon, authenticated;/,
    );
  });

  it("pins search_path on every SECURITY DEFINER function", () => {
    expect(body).toMatch(/AND p\.prosecdef/);
    expect(body).toMatch(/ALTER FUNCTION %s SET search_path = public/);
  });

  it.each([
    ["order_customer_id_created_at_idx", /ON public\."order" \(customer_id, created_at DESC\)/],
    ["order_order_status_created_at_idx", /ON public\."order" \(order_status, created_at\)/],
    ["order_item_order_id_idx", /ON public\.order_item \(order_id\)/],
    ["transaction_order_id_idx", /ON public\.transaction \(order_id\)/],
  ])("adds %s", (name, on) => {
    expect(body).toContain(`CREATE INDEX IF NOT EXISTS ${name}`);
    expect(body).toMatch(on);
  });

  it('renames employee."phone-num" to phone_number', () => {
    expect(body).toMatch(/RENAME COLUMN "phone-num" TO phone_number/);
  });

  it("keeps senior-pwd-ids private, with no public read", () => {
    expect(body).toMatch(/'senior-pwd-ids',\s+'senior-pwd-ids',\s+false/);
    expect(body).toMatch(/SET public\s+= false/);
    // Every policy on the bucket is for signed-in users.
    const policies = body.match(/CREATE POLICY "senior_pwd_ids[^;]+;/g) ?? [];
    expect(policies.length).toBe(4);
    for (const policy of policies) expect(policy).toContain("TO authenticated");
  });
});

describe("pickup-only", () => {
  const body = sql(pickupOnly);

  it("archives rider and delivery before dropping them", () => {
    expect(body.indexOf("CREATE TABLE archive.delivery")).toBeLessThan(
      body.indexOf("DROP TABLE IF EXISTS public.delivery"),
    );
    expect(body.indexOf("CREATE TABLE archive.rider")).toBeLessThan(
      body.indexOf("DROP TABLE IF EXISTS public.rider"),
    );
  });

  it("keeps the archive out of reach of the API roles", () => {
    expect(body).toMatch(/REVOKE ALL ON SCHEMA archive FROM anon, authenticated;/);
  });

  it("disables rider accounts rather than deleting them", () => {
    expect(body).toMatch(/SET is_account_disabled = true\s+WHERE upper\(trim\(role\)\) IN \('RIDER', 'DELIVERY'\)/);
    expect(body).not.toMatch(/DELETE FROM public\.employee/);
  });
});
