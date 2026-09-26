#!/usr/bin/env node
// ============================================================================
// Database cleanse — removes test data and repairs or removes rows that break
// the field rules in lib/validation/fields.ts (the same rules the CHECK
// constraints in supabase/migrations/20260924000000_atomic_names_and_addresses.sql
// enforce on new writes).
//
//   npm run db:cleanse                      dry run: prints what it WOULD do
//   npm run db:cleanse -- --apply           does it
//   npm run db:cleanse -- --apply --wipe-orders
//                                           also deletes every order, cart,
//                                           review and notification — a clean
//                                           slate before `npm run db:seed`
//
// What it does, in order:
//   1. Test accounts — customers/employees whose email or name looks like
//      test data (test@…, asdf, @example.com, "Test User", digits in a name)
//      are deleted with their orders, carts, addresses and auth users.
//   2. Repairable rows are repaired: names trimmed and re-split, phone numbers
//      normalised to +63XXXXXXXXXX (or cleared when unrecoverable).
//   3. Customers whose name or email still can't pass are deleted.
//      Employees are NEVER deleted for a bad field — they are listed for a
//      manager to fix by hand — and the last manager is never deleted at all.
//   4. Addresses with a part that can't pass, duplicates, and orphans are
//      deleted; a customer left without a default gets one.
//   5. Invalid rider plate / licence values are cleared.
//   6. Test products are deleted (or hidden, if past orders reference them);
//      products that break the name/price rules are hidden and listed.
//   7. Orphans: auth users with no customer or employee row (half-finished
//      sign-ups), addresses/carts/notifications for missing customers, and
//      empty carts abandoned for over 30 days.
//
// Afterwards run supabase/validate-constraints.sql in the SQL editor.
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
const WIPE_ORDERS = hasFlag("--wipe-orders");

// ---- rules (mirror lib/validation/fields.ts) --------------------------------
const NAME = /^\p{L}[\p{L}\p{M} .'-]*$/u;
const EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_STORED = /^\+639\d{9}$/;
const PHONE_ANY = /^(?:\+?63|0)?9\d{9}$/;
const PLATE = /^[A-Z0-9]+(?: [A-Z0-9]+)?$/i;
const LICENSE = /^[A-Z]\d{2}-\d{2}-\d{6}$/i;

const validName = (v) => typeof v === "string" && v.length >= 2 && v.length <= 50 && NAME.test(v);
const validEmail = (v) => typeof v === "string" && v.length >= 6 && v.length <= 254 && EMAIL.test(v);

const TEST_WORD = /^(test\w*|tester|asdf\w*|qwe\w*|dummy|sample|fake|temp|user\d*|abc|xyz|aa+|xx+|zz+|n\/?a|none|null|undefined)$/i;
const TEST_LOCAL = /(^|[^a-z])(test|tester|testing|asdf|qwerty|dummy|sample|fake|temp)\d*([^a-z]|$)/i;
const TEST_DOMAIN = /@(example\.(com|org|net)|test\.com|mailinator\.com|yopmail\.com|tempmail\.\w+|[\w.-]+\.(test|invalid|example|localhost))$/i;

function looksLikeTest({ email, first, last, full }) {
  if (email && (TEST_DOMAIN.test(email) || TEST_LOCAL.test(email.split("@")[0]))) return "test email";
  const words = `${first ?? ""} ${last ?? ""} ${full ?? ""}`.trim().split(/\s+/).filter(Boolean);
  if (words.some((w) => TEST_WORD.test(w))) return "test name";
  if (/\d/.test(`${first ?? ""}${last ?? ""}`)) return "digits in name";
  return null;
}

function tidy(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Trimmed parts; a one-word first name with an empty last name is re-split. */
function repairName(first, last) {
  let f = tidy(first);
  let l = tidy(last);
  if (!l && f.includes(" ")) {
    const i = f.lastIndexOf(" ");
    l = f.slice(i + 1);
    f = f.slice(0, i);
  }
  return { first: f, last: l };
}

function repairPhone(raw) {
  if (raw == null || raw === "") return { value: null, ok: true };
  if (PHONE_STORED.test(raw)) return { value: raw, ok: true };
  const compact = String(raw).replace(/[\s().-]/g, "");
  if (PHONE_ANY.test(compact)) {
    const digits = compact.replace(/\D/g, "").slice(-10);
    return { value: `+63${digits}`, ok: true };
  }
  return { value: null, ok: false };
}

function addressProblem(a) {
  const len = (v) => tidy(v).length;
  if (len(a.building_no) < 1 || len(a.building_no) > 50) return "building no.";
  if (len(a.street) < 3 || len(a.street) > 100) return "street";
  if (len(a.barangay) < 2 || len(a.barangay) > 100) return "barangay";
  if (len(a.city) < 3 || len(a.city) > 50) return "city";
  if (!/^\d{4}$/.test(tidy(a.zip_code))) return "ZIP";
  if (a.label && a.label.length > 30) return "label";
  if (a.address_note && a.address_note.length > 200) return "delivery note";
  return null;
}

// ---- plan -------------------------------------------------------------------
const plan = {
  deleteCustomers: new Map(), // id -> reason
  deleteEmployees: new Map(),
  deleteAuthUsers: new Map(),
  deleteAddresses: new Map(),
  deleteCarts: new Map(),
  deleteNotifications: new Map(),
  deleteProducts: new Map(),
  deleteCategories: new Map(),
  updates: [], // { table, key, id, patch, why }
  report: [], // things a person must fix
};

const db = createAdmin();
console.log(`\nYang's Fried Rice — database cleanse (${APPLY ? "APPLY" : "dry run"})\n`);

const [customers, employees, addresses, riders, products, categories, orderItems, carts, cartItems, notifications, authUsers] =
  await Promise.all([
    selectAll(db, "customer", "customer_id, first_name, last_name, email, phone_number"),
    selectAll(db, "employee", 'employee_id, first_name, last_name, email, role, "phone-num"'),
    selectAll(db, "customer_address", "address_id, customer_id, label, building_no, street, barangay, city, zip_code, address_note, is_default"),
    selectAll(db, "rider", "rider_id, employee_id, vehicle_plate_number, driver_license_number, vehicle_make_model"),
    selectAll(db, "product", "product_id, product_name, product_price, product_details, is_available, category_id"),
    selectAll(db, "categories", "category_id, category_name"),
    selectAll(db, "order_item", "product_id"),
    selectAll(db, "cart", "cart_id, customer_id, status, updated_at"),
    selectAll(db, "cart_item", "cart_id"),
    selectAll(db, "notification", "notification_id, customer_id"),
    listAllAuthUsers(db),
  ]);

// 1–3. customers
for (const c of customers) {
  const reason = looksLikeTest({ email: c.email, first: c.first_name, last: c.last_name });
  if (reason) {
    plan.deleteCustomers.set(c.customer_id, `${reason}: ${c.email ?? "(no email)"}`);
    continue;
  }
  const name = repairName(c.first_name, c.last_name);
  const phone = repairPhone(c.phone_number);
  if (!validName(name.first) || !validName(name.last)) {
    plan.deleteCustomers.set(c.customer_id, `name can't be repaired: "${c.first_name} ${c.last_name}"`);
    continue;
  }
  if (c.email && !validEmail(c.email)) {
    plan.deleteCustomers.set(c.customer_id, `invalid email: ${c.email}`);
    continue;
  }
  const patch = {};
  if (name.first !== c.first_name) patch.first_name = name.first;
  if (name.last !== c.last_name) patch.last_name = name.last;
  if (phone.value !== c.phone_number) patch.phone_number = phone.value;
  if (Object.keys(patch).length) {
    plan.updates.push({
      table: "customer", key: "customer_id", id: c.customer_id, patch,
      why: phone.ok ? "tidy name / normalise phone" : `phone "${c.phone_number}" unrecoverable — cleared`,
    });
  }
}

// employees — test accounts go, bad fields are repaired or reported
const managers = employees.filter((e) => (e.role ?? "").toUpperCase() === "MANAGER");
for (const e of employees) {
  const reason = looksLikeTest({ email: e.email, first: e.first_name, last: e.last_name });
  const isManager = (e.role ?? "").toUpperCase() === "MANAGER";
  if (reason) {
    const managersLeft = managers.filter((m) => !plan.deleteEmployees.has(m.employee_id) && m.employee_id !== e.employee_id);
    if (isManager && managersLeft.length === 0) {
      plan.report.push(`employee ${e.email}: looks like test data (${reason}) but is the last manager — kept`);
    } else {
      plan.deleteEmployees.set(e.employee_id, `${reason}: ${e.email}`);
    }
    continue;
  }
  const name = repairName(e.first_name, e.last_name);
  const phone = repairPhone(e["phone-num"]);
  const patch = {};
  if (name.first !== e.first_name) patch.first_name = name.first;
  if (name.last !== e.last_name) patch.last_name = name.last;
  if (phone.value !== e["phone-num"]) patch["phone-num"] = phone.value;
  if (Object.keys(patch).length) {
    plan.updates.push({ table: "employee", key: "employee_id", id: e.employee_id, patch, why: "tidy name / normalise phone" });
  }
  if (!validName(name.first) || !validName(name.last)) {
    plan.report.push(`employee ${e.email}: name "${e.first_name} ${e.last_name}" breaks the name rule — fix it in Manage → Employees`);
  }
  if (!validEmail(e.email)) {
    plan.report.push(`employee ${e.employee_id}: email "${e.email}" is invalid — fix it in Manage → Employees`);
  }
}

// 4. addresses
const customerIds = new Set(customers.map((c) => c.customer_id));
const seenAddress = new Set();
for (const a of addresses) {
  if (!a.customer_id || !customerIds.has(a.customer_id)) {
    plan.deleteAddresses.set(a.address_id, "orphan (no customer)");
    continue;
  }
  if (plan.deleteCustomers.has(a.customer_id)) continue; // goes with the customer
  const problem = addressProblem(a);
  if (problem) {
    plan.deleteAddresses.set(a.address_id, `invalid ${problem}: "${[a.building_no, a.street, a.barangay, a.city, a.zip_code].join(" | ")}"`);
    continue;
  }
  const key = [a.customer_id, ...[a.building_no, a.street, a.barangay, a.city].map((v) => tidy(v).toLowerCase()), tidy(a.zip_code)].join("|");
  if (seenAddress.has(key)) {
    plan.deleteAddresses.set(a.address_id, "duplicate address");
    continue;
  }
  seenAddress.add(key);
}
// a default for everyone who keeps an address but loses (or never had) one
const keptByCustomer = new Map();
for (const a of addresses) {
  if (plan.deleteAddresses.has(a.address_id) || plan.deleteCustomers.has(a.customer_id) || !customerIds.has(a.customer_id)) continue;
  if (!keptByCustomer.has(a.customer_id)) keptByCustomer.set(a.customer_id, []);
  keptByCustomer.get(a.customer_id).push(a);
}
for (const [, list] of keptByCustomer) {
  if (!list.some((a) => a.is_default)) {
    plan.updates.push({ table: "customer_address", key: "address_id", id: list[0].address_id, patch: { is_default: true }, why: "customer had no default address" });
  }
}

// 5. riders
for (const r of riders) {
  if (plan.deleteEmployees.has(r.employee_id)) continue;
  const patch = {};
  if (r.vehicle_plate_number && !(PLATE.test(r.vehicle_plate_number) && r.vehicle_plate_number.length >= 5 && r.vehicle_plate_number.length <= 10)) patch.vehicle_plate_number = null;
  if (r.driver_license_number && !LICENSE.test(r.driver_license_number)) patch.driver_license_number = null;
  if (r.vehicle_make_model && (tidy(r.vehicle_make_model).length < 2 || tidy(r.vehicle_make_model).length > 50)) patch.vehicle_make_model = null;
  if (Object.keys(patch).length) {
    plan.updates.push({ table: "rider", key: "rider_id", id: r.rider_id, patch, why: `invalid ${Object.keys(patch).join(", ")} cleared — re-enter in Manage → Employees` });
  }
}

// 6. products and categories
const orderedProducts = new Set(orderItems.map((i) => i.product_id).filter(Boolean));
for (const p of products) {
  const name = tidy(p.product_name);
  const isTest = name.split(/\s+/).some((w) => TEST_WORD.test(w));
  const broken = name.length < 2 || name.length > 80 || !(Number(p.product_price) > 0) || Number(p.product_price) > 99999.99 || (p.product_details ?? "").length > 300;
  if (isTest && !orderedProducts.has(p.product_id)) {
    plan.deleteProducts.set(p.product_id, `test product "${p.product_name}"`);
  } else if (isTest || broken) {
    if (p.is_available !== false) {
      plan.updates.push({ table: "product", key: "product_id", id: p.product_id, patch: { is_available: false }, why: `hidden: ${isTest ? "test product with past orders" : "breaks name/price/details rules"} ("${p.product_name}")` });
    }
    if (broken) plan.report.push(`product "${p.product_name}": fix its name (2–80), price (₱0.01–₱99,999.99) or details (≤300) in Manage → Menu`);
  }
}
const productsLeftByCategory = new Map();
for (const p of products) {
  if (plan.deleteProducts.has(p.product_id)) continue;
  productsLeftByCategory.set(p.category_id, (productsLeftByCategory.get(p.category_id) ?? 0) + 1);
}
for (const c of categories) {
  const name = tidy(c.category_name);
  const isTest = name.split(/\s+/).some((w) => TEST_WORD.test(w));
  if ((isTest || name.length < 2) && !productsLeftByCategory.get(c.category_id)) {
    plan.deleteCategories.set(c.category_id, `test/empty category "${c.category_name}"`);
  } else if (name.length < 2 || name.length > 40) {
    plan.report.push(`category "${c.category_name}": name must be 2–40 characters`);
  }
}

// 7. orphans
const employeeIds = new Set(employees.map((e) => e.employee_id));
for (const u of authUsers) {
  if (customerIds.has(u.id) || employeeIds.has(u.id)) continue;
  plan.deleteAuthUsers.set(u.id, `auth user with no customer or employee record: ${u.email ?? u.id}`);
}
const itemsByCart = new Set(cartItems.map((i) => i.cart_id));
const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
for (const cart of carts) {
  if (plan.deleteCustomers.has(cart.customer_id)) continue;
  if (!cart.customer_id || !customerIds.has(cart.customer_id)) {
    plan.deleteCarts.set(cart.cart_id, "orphan cart");
  } else if (cart.status === "active" && !itemsByCart.has(cart.cart_id) && cart.updated_at && Date.parse(cart.updated_at) < monthAgo) {
    plan.deleteCarts.set(cart.cart_id, "empty cart abandoned for 30+ days");
  }
}
for (const n of notifications) {
  if (!n.customer_id || !customerIds.has(n.customer_id)) plan.deleteNotifications.set(n.notification_id, "orphan notification");
}

// ---- print ------------------------------------------------------------------
function section(title, entries) {
  const list = [...entries];
  console.log(`${title}: ${list.length}`);
  for (const [id, why] of list.slice(0, 50)) console.log(`   - ${why}  [${id}]`);
  if (list.length > 50) console.log(`   … and ${list.length - 50} more`);
}
section("Customers to delete", plan.deleteCustomers);
section("Employees to delete", plan.deleteEmployees);
section("Orphan auth users to delete", plan.deleteAuthUsers);
section("Addresses to delete", plan.deleteAddresses);
section("Carts to delete", plan.deleteCarts);
section("Notifications to delete", plan.deleteNotifications);
section("Products to delete", plan.deleteProducts);
section("Categories to delete", plan.deleteCategories);
console.log(`Rows to repair: ${plan.updates.length}`);
for (const u of plan.updates.slice(0, 50)) console.log(`   - ${u.table} ${u.id}: ${JSON.stringify(u.patch)} — ${u.why}`);
if (WIPE_ORDERS) console.log("ALL orders, carts, reviews and notifications will be deleted (--wipe-orders).");
if (plan.report.length) {
  console.log(`\nNeeds a person (not changed automatically): ${plan.report.length}`);
  for (const line of plan.report) console.log(`   - ${line}`);
}

if (!APPLY) {
  console.log("\nDry run — nothing was changed. Re-run with --apply to make these changes.\n");
  process.exit(0);
}

// ---- apply ------------------------------------------------------------------
console.log("\nApplying…");
if (WIPE_ORDERS) {
  const orders = await selectAll(db, "order", "order_id");
  await deleteOrdersCascade(db, orders.map((o) => o.order_id));
  const allCarts = await selectAll(db, "cart", "cart_id");
  await deleteCartsCascade(db, allCarts.map((c) => c.cart_id));
  check(await db.from("review").delete().not("review_id", "is", null), "delete reviews");
  check(await db.from("notification").delete().not("notification_id", "is", null), "delete notifications");
}
await deleteCustomersCascade(db, [...plan.deleteCustomers.keys()]);
await deleteEmployeesCascade(db, [...plan.deleteEmployees.keys()]);
for (const id of plan.deleteAuthUsers.keys()) {
  const { error } = await db.auth.admin.deleteUser(id);
  if (error) console.warn(`  ! auth user ${id}: ${error.message}`);
}
await deleteIn(db, "customer_address", "address_id", [...plan.deleteAddresses.keys()]);
if (!WIPE_ORDERS) {
  await deleteCartsCascade(db, [...plan.deleteCarts.keys()]);
  await deleteIn(db, "notification", "notification_id", [...plan.deleteNotifications.keys()]);
}
const productIds = [...plan.deleteProducts.keys()];
await deleteIn(db, "add_on", "product_id", productIds);
await deleteIn(db, "review", "product_id", productIds);
await deleteIn(db, "product", "product_id", productIds);
await deleteIn(db, "categories", "category_id", [...plan.deleteCategories.keys()]);
for (const u of plan.updates) {
  const { error } = await db.from(u.table).update(u.patch).eq(u.key, u.id);
  if (error) console.warn(`  ! ${u.table} ${u.id}: ${error.message}`);
}
console.log("Done. Now run supabase/validate-constraints.sql in the Supabase SQL editor.\n");
