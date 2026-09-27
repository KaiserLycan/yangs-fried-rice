#!/usr/bin/env node
// ============================================================================
// Database cleanse — removes test data and repairs rows that contradict the
// rules the app now enforces, so reports and order history add up.
//
//   npm run db:cleanse              dry run: prints what it WOULD do
//   npm run db:cleanse -- --apply   does it
//
// Real accounts are never deleted for their history; only rows that are test
// data or internally contradictory are touched. Run `npm run db:seed --
// --reset` afterwards to refresh the demo accounts' data.
//
// What it does, in order:
//   1. Test accounts: employees and customers whose email or name looks like
//      test data (…@test.local, @example.com, "Test Staff"), and employees
//      with a role the app no longer has (RIDER, since pickup-only, #114).
//      The last manager is never deleted.
//   2. Test menu items (KNOWN_TEST_PRODUCTS) with every order that holds
//      them, then categories left with no dishes.
//   3. Orders: `pickup` / NULL order types become `take_out` (same meaning);
//      orders with no identifiable line (no dish, no saved name) are deleted.
//   4. Payments:
//      - a completed order with no payment row gets the pay-in-store one it
//        was collected as (wallet orders always had a row from checkout);
//      - an order with several payment rows keeps the one that took money
//        (or the latest) and loses the empty attempts;
//      - a cancelled order whose payment says "paid" but never captured
//        anything (no PayMongo id, ₱0) is marked failed. One that did take
//        money is marked `refund_failed` for a manager to refund by hand —
//        never `refund_pending`, which would make the cron call PayMongo.
//   5. Orphans: auth users with no customer or employee row older than a
//      day (abandoned sign-ups), and empty open carts idle for 30 days.
// ============================================================================

import {
  createAdmin,
  hasFlag,
  check,
  selectAll,
  listAllAuthUsers,
  deleteIn,
  deleteCartsCascade,
  deleteCustomersCascade,
  deleteEmployeesCascade,
  deleteOrdersCascade,
} from "./lib/admin.mjs";

const APPLY = hasFlag("--apply");

/** Menu items made while testing. Matched by exact name. */
const KNOWN_TEST_PRODUCTS = ["Yang's Meaty Steak"];

const ROLES = new Set(["MANAGER", "STAFF"]);
const TEST_DOMAIN = /@(example\.(com|org|net)|test\.com|mailinator\.com|yopmail\.com|[\w.-]+\.(test|invalid|example|localhost|local|demo))$/i;
const TEST_LOCAL = /(^|[^a-z])(test|tester|testing|asdf|qwerty|dummy|sample|fake|temp)(\d|_|[^a-z]|$)/i;
const TEST_NAME = /^(test\w*|tester|asdf\w*|dummy|sample|fake|temp)$/i;

function looksLikeTest(email, name) {
  if (email && (TEST_DOMAIN.test(email) || TEST_LOCAL.test(email.split("@")[0]))) return "test email";
  if ((name ?? "").split(/\s+/).some((word) => TEST_NAME.test(word))) return "test name";
  return null;
}

const db = createAdmin();
const log = [];
const note = (line) => log.push(line);
console.log(`\nYang's Fried Rice — database cleanse (${APPLY ? "APPLY" : "dry run"})\n`);

const [customers, employees, products, categories, orders, orderItems, transactions, carts, cartItems, authUsers] =
  await Promise.all([
    selectAll(db, "customer", "customer_id, email, name"),
    selectAll(db, "employee", "employee_id, email, name, role"),
    selectAll(db, "product", "product_id, product_name, category_id"),
    selectAll(db, "categories", "category_id, category_name"),
    selectAll(db, "order", "order_id, order_number, order_type, order_status, created_at"),
    selectAll(db, "order_item", "order_id, product_id, product_name, subtotal"),
    selectAll(db, "transaction", "transaction_id, order_id, payment_method, payment_status, total_paid, provider_payment_id, transaction_date"),
    selectAll(db, "cart", "cart_id, customer_id, is_final, updated_at"),
    selectAll(db, "cart_item", "cart_id"),
    listAllAuthUsers(db),
  ]);

// ---- 1. test accounts --------------------------------------------------------
const deleteEmployees = new Map();
const managers = employees.filter((e) => (e.role ?? "").toUpperCase() === "MANAGER");
for (const e of employees) {
  const role = (e.role ?? "").toUpperCase();
  const reason = looksLikeTest(e.email, e.name) ?? (ROLES.has(role) ? null : `retired role ${role || "(none)"}`);
  if (!reason) continue;
  const managersLeft = managers.filter((m) => m.employee_id !== e.employee_id && !deleteEmployees.has(m.employee_id));
  if (role === "MANAGER" && managersLeft.length === 0) {
    note(`keep employee ${e.email}: ${reason}, but the last manager`);
    continue;
  }
  deleteEmployees.set(e.employee_id, `${reason}: ${e.email}`);
}
const deleteCustomers = new Map();
for (const c of customers) {
  const reason = looksLikeTest(c.email, c.name);
  if (reason) deleteCustomers.set(c.customer_id, `${reason}: ${c.email}`);
}

// ---- 2. test menu items --------------------------------------------------------
const testProducts = products.filter((p) => KNOWN_TEST_PRODUCTS.includes(p.product_name));
const testProductIds = new Set(testProducts.map((p) => p.product_id));
const deleteOrders = new Map();
for (const item of orderItems) {
  if (testProductIds.has(item.product_id)) deleteOrders.set(item.order_id, "holds a test menu item");
}
const remainingProducts = products.filter((p) => !testProductIds.has(p.product_id));
const emptyCategories = categories.filter(
  (c) => !remainingProducts.some((p) => p.category_id === c.category_id),
);

// ---- 3. orders -----------------------------------------------------------------
const itemsByOrder = new Map();
for (const item of orderItems) {
  const list = itemsByOrder.get(item.order_id) ?? [];
  list.push(item);
  itemsByOrder.set(item.order_id, list);
}
const retypeOrders = [];
for (const o of orders) {
  if (deleteOrders.has(o.order_id)) continue;
  // A line with neither a dish nor a saved name can't be shown or reported
  // on; an order made only of those is test debris.
  const lines = itemsByOrder.get(o.order_id) ?? [];
  if (!lines.some((line) => line.product_id || line.product_name)) {
    deleteOrders.set(o.order_id, `#${o.order_number}: no identifiable items`);
    continue;
  }
  if (o.order_type === null || o.order_type === "pickup") retypeOrders.push(o.order_id);
}

// ---- 4. payments ---------------------------------------------------------------
const txByOrder = new Map();
for (const t of transactions) {
  const list = txByOrder.get(t.order_id) ?? [];
  list.push(t);
  txByOrder.set(t.order_id, list);
}
const captured = (t) => Number(t.total_paid ?? 0) > 0 || Boolean(t.provider_payment_id);
const insertPayments = [];
const deletePayments = new Map();
const updatePayments = [];
for (const o of orders) {
  if (deleteOrders.has(o.order_id)) continue;
  const rows = txByOrder.get(o.order_id) ?? [];
  if (rows.length === 0 && o.order_status === "completed") {
    const total = (itemsByOrder.get(o.order_id) ?? []).reduce((sum, i) => sum + Number(i.subtotal ?? 0), 0);
    insertPayments.push({
      order_id: o.order_id,
      payment_method: "pay_in_store",
      payment_status: "paid",
      subtotal: total,
      tax_amount: Math.round((total * 12 / 112) * 100) / 100,
      discount_amount: 0,
      total_paid: total,
      transaction_date: o.created_at,
    });
    note(`#${o.order_number}: completed with no payment — recorded as paid in store, ₱${total}`);
    continue;
  }
  let keep = rows;
  if (rows.length > 1) {
    const sorted = [...rows].sort((a, b) => Number(captured(b)) - Number(captured(a)) || String(b.transaction_date).localeCompare(String(a.transaction_date)));
    keep = [sorted[0]];
    for (const extra of sorted.slice(1)) {
      if (captured(extra)) note(`#${o.order_number}: two payments took money — kept both, check by hand`);
      else deletePayments.set(extra.transaction_id, `#${o.order_number}: empty extra payment attempt`);
    }
  }
  if (o.order_status === "cancelled") {
    for (const t of keep) {
      if (t.payment_status !== "paid") continue;
      if (captured(t) && t.payment_method !== "pay_in_store") {
        updatePayments.push({ id: t.transaction_id, patch: { payment_status: "refund_failed", refund_error: "Cancelled before automatic refunds existed. Refund by hand in PayMongo, then mark it refunded." }, why: `#${o.order_number}: cancelled after payment — refund owed` });
      } else {
        updatePayments.push({ id: t.transaction_id, patch: { payment_status: "failed", total_paid: 0 }, why: `#${o.order_number}: cancelled, nothing was collected` });
      }
    }
  }
}

// ---- 5. orphans ----------------------------------------------------------------
const known = new Set([...customers.map((c) => c.customer_id), ...employees.map((e) => e.employee_id)]);
const dayAgo = Date.now() - 86_400_000;
const orphanUsers = authUsers.filter((u) => !known.has(u.id) && Date.parse(u.created_at) < dayAgo);
const busyCarts = new Set(cartItems.map((i) => i.cart_id));
const monthAgo = Date.now() - 30 * 86_400_000;
const staleCarts = carts.filter(
  (c) => !c.is_final && !busyCarts.has(c.cart_id) && c.updated_at && Date.parse(c.updated_at) < monthAgo,
);

// ---- report --------------------------------------------------------------------
const section = (title, entries) => {
  console.log(`${title}: ${entries.length}`);
  for (const line of entries.slice(0, 40)) console.log(`   - ${line}`);
  if (entries.length > 40) console.log(`   … and ${entries.length - 40} more`);
};
section("Employees to delete", [...deleteEmployees.values()]);
section("Customers to delete", [...deleteCustomers.values()]);
section("Test menu items to delete", testProducts.map((p) => p.product_name));
section("Orders to delete", [...deleteOrders.values()]);
section("Empty categories to delete", emptyCategories.map((c) => c.category_name));
section("Orders retyped to take_out", retypeOrders);
section("Payments to add", insertPayments.map((p) => `${p.order_id} ₱${p.total_paid}`));
section("Empty payment attempts to delete", [...deletePayments.values()]);
section("Payments to correct", updatePayments.map((u) => u.why));
section("Orphan auth users to delete", orphanUsers.map((u) => u.email ?? u.id));
section("Stale empty carts to delete", staleCarts.map((c) => c.cart_id));
section("Notes", log);

if (!APPLY) {
  console.log("\nDry run — nothing changed. Re-run with --apply to do it.\n");
  process.exit(0);
}

// ---- apply ---------------------------------------------------------------------
await deleteOrdersCascade(db, [...deleteOrders.keys()]);
await deleteCustomersCascade(db, [...deleteCustomers.keys()]);
await deleteEmployeesCascade(db, [...deleteEmployees.keys()]);
// review.product_id has no ON DELETE action, so a direct review blocks it.
await deleteIn(db, "review", "product_id", [...testProductIds]);
await deleteIn(db, "product", "product_id", [...testProductIds]);
await deleteIn(db, "categories", "category_id", emptyCategories.map((c) => c.category_id));
for (let i = 0; i < retypeOrders.length; i += 100) {
  check(await db.from("order").update({ order_type: "take_out" }).in("order_id", retypeOrders.slice(i, i + 100)), "retype orders");
}
if (insertPayments.length) check(await db.from("transaction").insert(insertPayments), "add missing payments");
await deleteIn(db, "transaction", "transaction_id", [...deletePayments.keys()]);
for (const u of updatePayments) {
  check(await db.from("transaction").update(u.patch).eq("transaction_id", u.id), u.why);
}
for (const u of orphanUsers) {
  const { error } = await db.auth.admin.deleteUser(u.id);
  if (error) console.warn(`  ! could not delete auth user ${u.email ?? u.id}: ${error.message}`);
}
await deleteCartsCascade(db, staleCarts.map((c) => c.cart_id));
console.log("\nDone.\n");
