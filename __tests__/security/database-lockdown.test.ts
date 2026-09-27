import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BASELINE, PLATFORM, SCHEMA, functionSql, policiesOn, tableSql } from "../helpers/schema";

/**
 * Issue #114, checked statically.
 *
 * The real enforcement is in Postgres and was verified against the live
 * project. These tests read the migrations (a baseline dumped from that
 * project) and stop a later edit from quietly undoing it: re-adding a
 * customer INSERT policy, dropping the row lock from checkout, or putting a
 * direct order insert back in the app.
 */

describe("atomic checkout (limitations #15)", () => {
  const body = functionSql("submit_cart_to_order");

  it("locks the cart row before checking it", () => {
    const lock = body.indexOf("FOR UPDATE");
    const finalCheck = body.indexOf("IF v_cart.is_final THEN");
    expect(lock).toBeGreaterThan(-1);
    expect(finalCheck).toBeGreaterThan(lock);
  });

  it("backs the lock with a unique index on order.cart_id", () => {
    expect(SCHEMA).toMatch(/CREATE UNIQUE INDEX order_cart_id_key ON public\.order USING btree \(cart_id\)/);
  });

  it("prices lines from the menu, not from the caller", () => {
    expect(body).toMatch(/p\.product_price/);
    expect(body).not.toMatch(/p_delivery_fee|p_unit_price|p_subtotal/);
  });

  it("is callable by signed-in users only, and pins its search_path", () => {
    expect(SCHEMA).toMatch(/REVOKE ALL ON FUNCTION public\.submit_cart_to_order\([^)]*\) FROM PUBLIC;/);
    expect(SCHEMA).toMatch(/REVOKE ALL ON FUNCTION public\.submit_cart_to_order\([^)]*\) FROM anon;/);
    expect(SCHEMA).toMatch(/GRANT ALL ON FUNCTION public\.submit_cart_to_order\([^)]*\) TO authenticated;/);
    expect(SCHEMA).not.toMatch(/GRANT [A-Z, ]+ ON FUNCTION public\.submit_cart_to_order\([^)]*\) TO anon;/);
    expect(body).toMatch(/SECURITY DEFINER\s+SET search_path TO 'public'/);
  });

  it("refuses a disabled customer", () => {
    expect(body).toMatch(/ACCOUNT_DISABLED/);
  });

  // Persona review (DBA / QA): the function trusts cart_item.quantity, which
  // customers write directly, so the column itself refuses a bad one.
  it("cannot be fed a zero, negative or oversized quantity", () => {
    expect(tableSql("cart_item")).toMatch(
      /CONSTRAINT cart_item_quantity_range CHECK \(\(\(quantity >= 1\) AND \(quantity <= 20\)\)\)/,
    );
    expect(tableSql("order_item")).toMatch(/CONSTRAINT order_item_quantity_positive CHECK \(\(quantity > 0\)\)/);
  });
});

describe("customers cannot write orders directly (limitations #21)", () => {
  it.each(["order", "order_item", "order_add_on", "order_item_add_on"])(
    "has no customer INSERT policy on public.%s",
    (table) => {
      const inserts = policiesOn(`public.${table}`).filter((p) => / FOR INSERT /.test(p));
      for (const policy of inserts) expect(policy).not.toMatch(/auth\.uid\(\)|customer_id/);
    },
  );

  it("limits a customer's cancel to the status and cancellation fields", () => {
    expect(functionSql("guard_customer_order_update")).toMatch(
      /to_jsonb\(NEW\) - ARRAY\['order_status', 'cancelled_at', 'cancellation_reason'\]/,
    );
    expect(SCHEMA).toMatch(/CREATE OR REPLACE TRIGGER trg_guard_customer_order_update BEFORE UPDATE ON public\.order/);
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
  it("stops disabled employees counting as employees in RLS", () => {
    expect(functionSql("current_employee_role")).toMatch(/coalesce\(e\.is_account_disabled, false\) = false/);
  });

  it("refuses self-promotion and self-re-enabling", () => {
    expect(SCHEMA).toMatch(/CREATE OR REPLACE TRIGGER trg_guard_employee_self_update BEFORE UPDATE ON public\.employee/);
    expect(SCHEMA).toMatch(/CREATE OR REPLACE TRIGGER trg_guard_customer_self_update BEFORE UPDATE ON public\.customer/);
  });

  it("keeps the auth trigger function away from API roles", () => {
    for (const role of ["PUBLIC", "anon", "authenticated"]) {
      expect(SCHEMA).toContain(`REVOKE ALL ON FUNCTION public.handle_password_timestamp_update() FROM ${role};`);
    }
  });

  it("pins search_path on every SECURITY DEFINER function", () => {
    const definers = BASELINE.match(/CREATE OR REPLACE FUNCTION public\.[a-z_]+\([^$]*?SECURITY DEFINER[^$]*?AS \$/g) ?? [];
    expect(definers.length).toBeGreaterThan(10);
    for (const header of definers) expect(header).toMatch(/SET search_path TO/);
  });

  it.each([
    ["order_customer_id_created_at_idx", /ON public\.order USING btree \(customer_id, created_at DESC\)/],
    ["order_order_status_created_at_idx", /ON public\.order USING btree \(order_status, created_at\)/],
    ["order_item_order_id_idx", /ON public\.order_item USING btree \(order_id\)/],
    ["transaction_order_id_idx", /ON public\.transaction USING btree \(order_id\)/],
  ])("has index %s", (name, on) => {
    const line = SCHEMA.match(new RegExp(`CREATE INDEX ${name} [^;]+;`))?.[0] ?? "";
    expect(line).toMatch(on);
  });

  it('calls the employee phone column phone_number, not "phone-num"', () => {
    expect(tableSql("employee")).toMatch(/\bphone_number text/);
    expect(SCHEMA).not.toContain("phone-num");
  });

  it("keeps senior-pwd-ids private, with no public read", () => {
    expect(PLATFORM).toMatch(/\('senior-pwd-ids',\s+'senior-pwd-ids',\s+false,/);
    const policies = policiesOn("storage.objects").filter((p) => p.includes("senior-pwd-ids"));
    expect(policies.length).toBe(3);
    for (const policy of policies) expect(policy).toContain("TO authenticated");
  });

  it("only lets employees upload menu photos", () => {
    const inserts = policiesOn("storage.objects").filter((p) => p.includes("menu-images") && / FOR INSERT /.test(p));
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatch(/TO authenticated/);
    expect(inserts[0]).toMatch(/current_employee_role\(\) = ANY \(ARRAY\['MANAGER'::text, 'STAFF'::text\]\)/);
  });

  it("keeps each customer's avatar writes inside their own folder", () => {
    const writes = policiesOn("storage.objects").filter(
      (p) => p.includes("'avatars'") && / FOR (INSERT|UPDATE) /.test(p),
    );
    expect(writes).toHaveLength(2);
    for (const policy of writes) expect(policy).toMatch(/storage\.foldername\(name\)\)\[1\] = \(auth\.uid\(\)\)::text/);
  });
});

describe("pickup-only", () => {
  it("has no rider or delivery tables", () => {
    expect(SCHEMA).not.toMatch(/CREATE TABLE IF NOT EXISTS public\.(rider|delivery) /);
  });

  it("keeps no delivery address on an order", () => {
    expect(tableSql("order")).not.toMatch(/delivery_address/);
  });
});
