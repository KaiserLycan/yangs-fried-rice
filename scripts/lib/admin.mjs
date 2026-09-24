// Shared helpers for the database maintenance scripts (db-cleanse, db-seed).
//
// They talk to Supabase with the SERVICE ROLE key, which bypasses row-level
// security — so they only ever run from a developer's machine, never from the
// app, and they read the key from .env.local rather than taking it as an
// argument that would land in shell history.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

/** Loads KEY=value lines from .env.local (then .env) into process.env. */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match || line.trim().startsWith("#")) continue;
      const [, key, raw] = match;
      const value = raw.replace(/^(['"])(.*)\1$/, "$2");
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export function createAdmin() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Add both to .env.local (Supabase dashboard → Project Settings → API).",
    );
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const hasFlag = (flag) => process.argv.includes(flag);

/** Throws with context when a Supabase call failed. */
export function check(result, what) {
  if (result.error) {
    throw new Error(`${what}: ${result.error.message}${result.error.details ? ` (${result.error.details})` : ""}`);
  }
  return result.data;
}

/** Every row of a table (PostgREST caps a response at 1,000 rows). */
export async function selectAll(db, table, columns = "*") {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = check(
      await db.from(table).select(columns).range(from, from + 999),
      `read ${table}`,
    );
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

/** Every Supabase Auth user. */
export async function listAllAuthUsers(db) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`list auth users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

/** DELETE … WHERE column IN (ids), in batches that fit in a URL. */
export async function deleteIn(db, table, column, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 100) {
    check(
      await db.from(table).delete().in(column, unique.slice(i, i + 100)),
      `delete from ${table}`,
    );
  }
  return unique.length;
}

/** SELECT column FROM table WHERE key IN (ids), batched. */
export async function selectIn(db, table, columns, key, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  const rows = [];
  for (let i = 0; i < unique.length; i += 100) {
    rows.push(
      ...check(
        await db.from(table).select(columns).in(key, unique.slice(i, i + 100)),
        `read ${table}`,
      ),
    );
  }
  return rows;
}

/**
 * Deletes orders and everything hanging off them, children first so no
 * foreign key is left pointing at a missing row.
 */
export async function deleteOrdersCascade(db, orderIds) {
  if (orderIds.length === 0) return 0;
  const items = await selectIn(db, "order_item", "order_item_id", "order_id", orderIds);
  await deleteIn(db, "order_item_add_on", "order_item_id", items.map((i) => i.order_item_id));
  await deleteIn(db, "order_item", "order_id", orderIds);
  await deleteIn(db, "order_add_on", "order_id", orderIds);
  await deleteIn(db, "transaction", "order_id", orderIds);
  await deleteIn(db, "delivery", "order_id", orderIds);
  await deleteIn(db, "review", "order_id", orderIds);
  // A submitted cart points at its order.
  const carts = await selectIn(db, "cart", "cart_id", "order_id", orderIds);
  await deleteCartsCascade(db, carts.map((c) => c.cart_id));
  return deleteIn(db, "order", "order_id", orderIds);
}

export async function deleteCartsCascade(db, cartIds) {
  if (cartIds.length === 0) return 0;
  const items = await selectIn(db, "cart_item", "cart_item_id", "cart_id", cartIds);
  await deleteIn(db, "cart_item_add_on", "cart_item_id", items.map((i) => i.cart_item_id));
  await deleteIn(db, "cart_item", "cart_id", cartIds);
  await deleteIn(db, "cart_add_on", "cart_id", cartIds);
  return deleteIn(db, "cart", "cart_id", cartIds);
}

/** Removes customers with their orders, carts, addresses, reviews and auth users. */
export async function deleteCustomersCascade(db, customerIds) {
  if (customerIds.length === 0) return 0;
  const orders = await selectIn(db, "order", "order_id", "customer_id", customerIds);
  await deleteOrdersCascade(db, orders.map((o) => o.order_id));
  const carts = await selectIn(db, "cart", "cart_id", "customer_id", customerIds);
  await deleteCartsCascade(db, carts.map((c) => c.cart_id));
  await deleteIn(db, "review", "customer_id", customerIds);
  await deleteIn(db, "notification", "customer_id", customerIds);
  await deleteIn(db, "customer_address", "customer_id", customerIds);
  await deleteIn(db, "customer", "customer_id", customerIds);
  for (const id of customerIds) {
    const { error } = await db.auth.admin.deleteUser(id);
    if (error && !/not found/i.test(error.message)) {
      console.warn(`  ! could not delete auth user ${id}: ${error.message}`);
    }
  }
  return customerIds.length;
}

/** Removes employees (and rider rows) and their auth users. Deliveries keep their order. */
export async function deleteEmployeesCascade(db, employeeIds) {
  if (employeeIds.length === 0) return 0;
  const riders = await selectIn(db, "rider", "rider_id", "employee_id", employeeIds);
  const riderIds = riders.map((r) => r.rider_id);
  for (let i = 0; i < riderIds.length; i += 100) {
    check(
      await db.from("delivery").update({ rider_id: null }).in("rider_id", riderIds.slice(i, i + 100)),
      "detach deliveries from rider",
    );
  }
  for (let i = 0; i < employeeIds.length; i += 100) {
    const batch = employeeIds.slice(i, i + 100);
    check(await db.from("delivery").update({ employee_id: null }).in("employee_id", batch), "detach deliveries");
    check(await db.from("order").update({ employee_id: null }).in("employee_id", batch), "detach orders");
    check(await db.from("reports").update({ generated_by_employee_id: null }).in("generated_by_employee_id", batch), "detach reports");
  }
  await deleteIn(db, "rider", "employee_id", employeeIds);
  await deleteIn(db, "employee", "employee_id", employeeIds);
  for (const id of employeeIds) {
    const { error } = await db.auth.admin.deleteUser(id);
    if (error && !/not found/i.test(error.message)) {
      console.warn(`  ! could not delete auth user ${id}: ${error.message}`);
    }
  }
  return employeeIds.length;
}
